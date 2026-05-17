/**
 * Client-side orchestration for S3 multipart uploads.
 *
 * Used by EchoApiService.uploadEchoMedia when the source file is larger
 * than MULTIPART_THRESHOLD. Replaces the single-PUT path with the
 * four-step ceremony:
 *
 *   1. POST /api/echoes/{id}/multipart/initiate
 *        → server creates the S3 multipart upload, returns upload_id + key.
 *   2. Slice the file into 5 MB parts using react-native-blob-util.fs.slice
 *      (native side, no JS-bridge round-trip).
 *   3. POST /api/echoes/{id}/multipart/part-urls
 *        → server presigns one PUT URL per part.
 *   4. PUT each part to its presigned URL with bounded parallelism (4)
 *      and per-part retry. Capture the ETag from the response header.
 *   5. POST /api/echoes/{id}/multipart/complete
 *        → server assembles the object and atomically commits media_url.
 *
 * On any non-recoverable failure we POST /multipart/abort and re-throw
 * so the bucket isn't left holding partial bytes (the lifecycle rule
 * also reaps them after 7 days as a backstop).
 */

import ReactNativeBlobUtil from 'react-native-blob-util';

import type { EchoApiService, EchoResponse, UploadStage } from './echo';
import type { ApiResponse } from '@types';

import {
  type CompletedPart,
  type PendingUpload,
  markPartComplete,
  removePending,
  savePending,
} from './pendingUploads';

// Anything under this size uses the single-PUT path. 50 MB is roughly
// where iPhone 4K video at default bitrate crosses the line where a
// single TCP upload starts being lossy on cellular.
export const MULTIPART_THRESHOLD = 50 * 1024 * 1024;

// S3 minimum part size is 5 MB except the last; using exactly 5 MB
// maximizes parallelism (more parts) without hitting the part-count
// ceiling (10,000) on any realistic file. A 4 GB file = 800 parts.
const PART_SIZE = 5 * 1024 * 1024;

// How many parts to PUT to S3 in parallel. Higher gives bigger
// throughput on a fat pipe but more contention on cellular; 4 is a
// reasonable middle ground that mirrors what AWS SDKs default to.
const PART_CONCURRENCY = 4;

// Per-part retry budget. Idempotent PUTs of the same bytes to the same
// presigned URL are safe to retry — S3 dedupes by content-md5 and
// overwrites the in-progress part.
const PART_MAX_RETRIES = 3;
const PART_RETRY_BASE_DELAY_MS = 500;

interface PartResult {
  part_number: number;
  etag: string;
}

function stripFileScheme(uri: string): string {
  return uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;
}

/**
 * Pull the ETag out of an S3 PUT response. AWS returns it as `ETag` in
 * documentation but lowercase `etag` in practice; ReactNativeBlobUtil
 * preserves the server's casing, so be tolerant. Also strip the
 * surrounding quotes that S3 always includes.
 */
function extractEtag(
  headers: Record<string, string | undefined> | undefined,
): string | null {
  if (!headers) return null;
  const raw =
    headers.ETag ??
    headers.etag ??
    headers.Etag ??
    null;
  if (!raw) return null;
  return raw.replace(/^"+|"+$/g, '');
}

/**
 * Lightweight semaphore — no library needed for this single use.
 * Permits requests block when the count hits the cap; release()
 * wakes the next waiter.
 */
function createSemaphore(max: number) {
  let inUse = 0;
  const waiters: Array<() => void> = [];

  return {
    async acquire(): Promise<void> {
      if (inUse < max) {
        inUse++;
        return;
      }
      await new Promise<void>(resolve => waiters.push(resolve));
      inUse++;
    },
    release() {
      inUse--;
      const next = waiters.shift();
      if (next) next();
    },
  };
}

/** Marker class so the retry loop can tell "permanent" errors apart from
 * transient ones. 4xx PUT failures are presign/permissions issues that
 * won't recover; we surface them immediately.
 */
class NonRetryableUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableUploadError';
  }
}

async function uploadPartWithRetry(
  url: string,
  partPath: string,
  contentType: string,
): Promise<string> {
  let lastError: unknown = new Error('unreachable');
  for (let attempt = 1; attempt <= PART_MAX_RETRIES; attempt++) {
    try {
      const response = await ReactNativeBlobUtil.fetch(
        'PUT',
        url,
        { 'Content-Type': contentType },
        ReactNativeBlobUtil.wrap(partPath),
      );
      const status = response.respInfo?.status ?? 0;
      if (status >= 200 && status < 300) {
        const etag = extractEtag(response.respInfo?.headers);
        if (!etag) {
          throw new Error(
            'S3 part PUT succeeded but no ETag in response headers',
          );
        }
        return etag;
      }
      // 4xx: presign/permissions issue, won't recover. Throw a typed
      // error so the catch block can surface it without retrying.
      if (status >= 400 && status < 500) {
        throw new NonRetryableUploadError(`Part PUT failed (${status})`);
      }
      // 5xx + everything else: retry-worthy.
      throw new Error(`Part PUT 5xx (${status})`);
    } catch (err) {
      lastError = err;
      // Permanent errors short-circuit the retry loop.
      if (err instanceof NonRetryableUploadError) break;
      if (attempt === PART_MAX_RETRIES) break;
      // Exponential backoff with linear jitter.
      const delay = PART_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Part upload failed after retries');
}

interface UploadMultipartArgs {
  api: EchoApiService;
  echoId: string;
  fileUri: string;
  contentType: string;
  fileSize: number;
  onStage?: (stage: UploadStage) => void;
  /**
   * Human-readable echo title persisted alongside the pending row so
   * a resume banner can show "Continue uploading <title>?" without
   * having to fetch the echo. Defaults to ``echoId`` when omitted —
   * callers (the three new-echo screens) should plumb the real title
   * through; the fallback exists so older call sites don't break.
   */
  title?: string;
}

/** Maps a content_type to the file extension we use for the cached
 *  source copy. Mirrors the backend's audio_map / image_map; falls
 *  back to mp4 for unknown video types and bin for everything else. */
function extensionFor(contentType: string): string {
  if (contentType === 'audio/mpeg') return 'mp3';
  if (contentType === 'audio/aac') return 'aac';
  if (contentType.startsWith('audio/')) return 'm4a';
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/heic') return 'heic';
  if (contentType.startsWith('video/')) return 'mp4';
  return 'bin';
}

/** Cache subdir we own for pending-upload source copies. */
const PENDING_CACHE_DIR_NAME = 'mc-pending';

/**
 * Copy the (already post-compression) source into a stable path the
 * resume flow can rely on. The picker's original URI may be
 * a PHAsset:// reference that goes invalid after the picker session,
 * and the compressed temp file (when compression ran) is unlinked
 * by ``uploadEchoMedia``'s finally after the upload settles. Neither
 * is suitable for a resume that may happen days later.
 */
async function prepareSourceForResume(
  workingUri: string,
  echoId: string,
  contentType: string,
): Promise<string> {
  const dir = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${PENDING_CACHE_DIR_NAME}`;
  await ReactNativeBlobUtil.fs.mkdir(dir).catch(() => undefined);
  const ext = extensionFor(contentType);
  const dest = `${dir}/${echoId}.${ext}`;
  const sourcePath = stripFileScheme(workingUri);
  // Skip the copy when source is already at dest (would happen on a
  // retry that found a stale dest; unlink it first to be safe).
  if (sourcePath !== dest) {
    await ReactNativeBlobUtil.fs.unlink(dest).catch(() => undefined);
    await ReactNativeBlobUtil.fs.cp(sourcePath, dest);
  }
  return dest;
}

/** Best-effort cleanup of the cached source copy. Failure to unlink
 *  is non-fatal — the OS will reclaim CacheDir eventually. */
async function cleanupPendingSource(cachedFileUri: string): Promise<void> {
  await ReactNativeBlobUtil.fs
    .unlink(stripFileScheme(cachedFileUri))
    .catch(() => undefined);
}

/**
 * Orchestrate a multipart upload end-to-end. Returns the finalized echo
 * response on success; throws on unrecoverable failure (the caller
 * converts that into the user-facing error path).
 */
export async function uploadMediaMultipart({
  api,
  echoId,
  fileUri,
  contentType,
  fileSize,
  onStage,
  title,
}: UploadMultipartArgs): Promise<ApiResponse<EchoResponse>> {
  const partCount = Math.ceil(fileSize / PART_SIZE);
  const partNumbers = Array.from({ length: partCount }, (_, i) => i + 1);

  // 1. Initiate. The backend handles the existing-media-attached
  // first-write check; if it 4xx's, no S3 multipart was created and we
  // don't need to abort anything.
  const init = await api.initiateMultipart(echoId, contentType);
  if (!init.success || !init.data) {
    throw new Error(init.error ?? 'Failed to initiate multipart upload');
  }
  const { upload_id, key } = init.data;

  // Copy the (post-compression) source into a stable resume cache so
  // a force-quit between here and `complete` leaves something the
  // resume flow can pick back up.
  const cachedFileUri = await prepareSourceForResume(
    fileUri,
    echoId,
    contentType,
  );

  // Persist the initial pending row. From this point on, every part
  // PUT extends the row's completedParts; complete/abort delete it.
  const pending: PendingUpload = {
    echoId,
    uploadId: upload_id,
    key,
    cachedFileUri,
    contentType,
    fileSize,
    completedParts: [],
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    title: title ?? echoId,
  };
  await savePending(pending);

  // Delegate to the shared inner runner — same code path the resume
  // entry point uses, with the full set of part numbers to upload.
  return runMultipartUpload({
    api,
    pending,
    onStage,
    missingPartNumbers: partNumbers,
    initiallyUploadedBytes: 0,
  });
}

/**
 * Resume an in-flight multipart upload from a persisted PendingUpload
 * row. Skips ``initiate`` (we already have ``upload_id`` + ``key``);
 * re-requests presigned URLs for ONLY the parts that haven't completed
 * yet, then continues the standard pipeline.
 *
 * The caller is the resume hook (typically run at app start after
 * listing recoverable pending uploads). The cached source file at
 * ``pending.cachedFileUri`` must still exist — the hook is expected
 * to have filtered out rows whose source is gone.
 */
export async function resumeMediaMultipart(
  api: EchoApiService,
  pending: PendingUpload,
  onStage?: (stage: UploadStage) => void,
): Promise<ApiResponse<EchoResponse>> {
  const partCount = Math.ceil(pending.fileSize / PART_SIZE);
  const completedSet = new Set(
    pending.completedParts.map(p => p.part_number),
  );
  const missing: number[] = [];
  for (let n = 1; n <= partCount; n++) {
    if (!completedSet.has(n)) missing.push(n);
  }

  // Bytes already uploaded — seeds the progress callback so the bar
  // starts where it left off rather than at zero.
  const initiallyUploadedBytes = pending.completedParts.reduce((acc, p) => {
    const start = (p.part_number - 1) * PART_SIZE;
    const end = Math.min(start + PART_SIZE, pending.fileSize);
    return acc + (end - start);
  }, 0);

  return runMultipartUpload({
    api,
    pending,
    onStage,
    missingPartNumbers: missing,
    initiallyUploadedBytes,
  });
}

interface RunArgs {
  api: EchoApiService;
  pending: PendingUpload;
  onStage?: (stage: UploadStage) => void;
  missingPartNumbers: number[];
  initiallyUploadedBytes: number;
}

/**
 * Shared inner runner for both fresh-start and resume multipart paths.
 *
 * Both paths converge here after they've ensured:
 *   - the pending row exists in AsyncStorage (with at least an empty
 *     completedParts list)
 *   - the cached source file exists at pending.cachedFileUri
 *   - the missing-parts set is computed
 *
 * The runner handles:
 *   - presign for just the missing parts
 *   - slice + parallel upload + per-part persistence
 *   - density check, complete, cleanup
 *   - error path: abort, cleanup, re-throw
 */
async function runMultipartUpload(
  args: RunArgs,
): Promise<ApiResponse<EchoResponse>> {
  const { api, pending, onStage, missingPartNumbers, initiallyUploadedBytes } = args;
  const { echoId, uploadId: upload_id, key, fileSize, contentType, cachedFileUri } = pending;
  const sourcePath = stripFileScheme(cachedFileUri);

  // No work left? Just complete.
  if (missingPartNumbers.length === 0) {
    onStage?.({ type: 'finalizing' });
    return await completeAndCleanup(api, pending, pending.completedParts);
  }

  const sliceDir = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/mc-mp-${echoId}-${Date.now()}`;

  try {
    await ReactNativeBlobUtil.fs.mkdir(sliceDir);

    // 2. Presign ONLY the parts that haven't completed. On a fresh
    // upload that's everything; on a resume it's just the gap.
    const urlsResp = await api.getMultipartPartUrls(
      echoId,
      upload_id,
      key,
      missingPartNumbers,
    );
    if (!urlsResp.success || !urlsResp.data) {
      throw new Error(urlsResp.error ?? 'Failed to get part URLs');
    }
    const urlByPart = new Map<number, string>();
    for (const p of urlsResp.data.part_urls) {
      urlByPart.set(p.part_number, p.url);
    }

    // 3. Slice + upload with bounded concurrency. Each successful
    // part is persisted to the pending row immediately, so a force
    // quit at any point during this loop leaves a recoverable row.
    const sem = createSemaphore(PART_CONCURRENCY);
    const freshParts: PartResult[] = [];
    let uploadedBytes = initiallyUploadedBytes;
    onStage?.({
      type: 'uploading',
      sent: uploadedBytes,
      total: fileSize,
    });

    await Promise.all(
      missingPartNumbers.map(async n => {
        await sem.acquire();
        const start = (n - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, fileSize);
        const partPath = `${sliceDir}/part-${n}`;
        try {
          await ReactNativeBlobUtil.fs.slice(sourcePath, partPath, start, end);
          const url = urlByPart.get(n);
          if (!url) throw new Error(`No presigned URL for part ${n}`);
          const etag = await uploadPartWithRetry(url, partPath, contentType);

          freshParts.push({ part_number: n, etag });
          // Persist progress AFTER the part lands. A force-quit
          // before this fires loses just this one part on resume;
          // it'll re-presign + re-PUT, which is safe (S3 dedups by
          // PartNumber).
          await markPartComplete(echoId, { part_number: n, etag });

          uploadedBytes += end - start;
          onStage?.({
            type: 'uploading',
            sent: uploadedBytes,
            total: fileSize,
          });
        } finally {
          // Bounded peak disk usage = PART_CONCURRENCY × PART_SIZE.
          await ReactNativeBlobUtil.fs.unlink(partPath).catch(() => undefined);
          sem.release();
        }
      }),
    );

    // Merge what we just uploaded with what was already done on a
    // prior attempt. Sort defensively even though the server sorts
    // again — keeps test/inspection output stable.
    const allParts: CompletedPart[] = [...pending.completedParts, ...freshParts];
    allParts.sort((a, b) => a.part_number - b.part_number);

    if (allParts.length !== Math.ceil(fileSize / PART_SIZE)) {
      throw new Error('Internal error: multipart upload missing parts');
    }

    onStage?.({ type: 'finalizing' });
    return await completeAndCleanup(api, pending, allParts);
  } catch (err) {
    // Non-recoverable failure: abort + clean up. The user will have
    // to re-create the echo. (Recoverable failures we'd leave the
    // pending row in place; today's pipeline doesn't distinguish.)
    try {
      await api.abortMultipart(echoId, upload_id, key);
    } catch (abortErr) {
      console.warn('Failed to abort multipart upload:', abortErr);
    }
    await removePending(echoId);
    await cleanupPendingSource(cachedFileUri);
    throw err;
  } finally {
    // Slice dir is per-attempt; always clean up.
    await ReactNativeBlobUtil.fs.unlink(sliceDir).catch(() => undefined);
  }
}

/**
 * Final step shared between fresh + resume paths: assemble the parts
 * on S3, then remove the pending row + delete the cached source. On
 * server-side failure we leave the pending row in place so the user
 * can try again — the server's CompleteMultipartUpload is idempotent
 * by upload_id, and our client uses a deterministic Idempotency-Key
 * derived from upload_id so the retry hits the server cache.
 */
async function completeAndCleanup(
  api: EchoApiService,
  pending: PendingUpload,
  parts: CompletedPart[],
): Promise<ApiResponse<EchoResponse>> {
  const completed = await api.completeMultipart(
    pending.echoId,
    pending.uploadId,
    pending.key,
    parts,
  );
  if (completed.success) {
    await removePending(pending.echoId);
    await cleanupPendingSource(pending.cachedFileUri);
  }
  return completed;
}

/**
 * Read the file size from disk for routing into multipart vs single-PUT.
 * Returns null when the platform doesn't expose a path we can stat
 * (e.g. iOS PHAsset-style URIs that haven't been exported yet) —
 * callers treat null as "unknown, default to single-PUT path".
 */
export async function getFileSize(uri: string): Promise<number | null> {
  try {
    const path = stripFileScheme(uri);
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    const size =
      typeof stat.size === 'string' ? parseInt(stat.size, 10) : stat.size;
    return Number.isFinite(size) ? Number(size) : null;
  } catch {
    return null;
  }
}
