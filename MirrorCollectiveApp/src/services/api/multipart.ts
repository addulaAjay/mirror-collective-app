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
}: UploadMultipartArgs): Promise<ApiResponse<EchoResponse>> {
  const partCount = Math.ceil(fileSize / PART_SIZE);
  const partNumbers = Array.from({ length: partCount }, (_, i) => i + 1);
  const sourcePath = stripFileScheme(fileUri);

  // 1. Initiate. The backend handles the existing-media-attached
  // first-write check; if it 4xx's, no S3 multipart was created and we
  // don't need to abort anything.
  const init = await api.initiateMultipart(echoId, contentType);
  if (!init.success || !init.data) {
    throw new Error(init.error ?? 'Failed to initiate multipart upload');
  }
  const { upload_id, key } = init.data;

  // Carve out a temp directory specific to this upload so concurrent
  // multipart uploads (rare but possible) can't stomp on each other's
  // part files.
  const sliceDir = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/mc-mp-${echoId}-${Date.now()}`;

  try {
    await ReactNativeBlobUtil.fs.mkdir(sliceDir);

    // 2. Presign all parts in one batch. Backend caps batch at 1000;
    // a 5 GB file = 1000 parts at 5 MB, which is the maximum we'll
    // hand to the user anyway.
    const urlsResp = await api.getMultipartPartUrls(
      echoId,
      upload_id,
      key,
      partNumbers,
    );
    if (!urlsResp.success || !urlsResp.data) {
      throw new Error(urlsResp.error ?? 'Failed to get part URLs');
    }
    const urlByPart = new Map<number, string>();
    for (const p of urlsResp.data.part_urls) {
      urlByPart.set(p.part_number, p.url);
    }

    // 3. Slice + upload with bounded concurrency. We aggregate
    // uploadedBytes for the progress callback; this is a shared
    // counter touched from multiple in-flight tasks but JS is
    // single-threaded, so no locking needed.
    const sem = createSemaphore(PART_CONCURRENCY);
    const partResults: PartResult[] = new Array(partCount);
    let uploadedBytes = 0;

    await Promise.all(
      partNumbers.map(async n => {
        await sem.acquire();
        const start = (n - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, fileSize);
        const partPath = `${sliceDir}/part-${n}`;
        try {
          await ReactNativeBlobUtil.fs.slice(sourcePath, partPath, start, end);
          const url = urlByPart.get(n);
          if (!url) throw new Error(`No presigned URL for part ${n}`);
          const etag = await uploadPartWithRetry(url, partPath, contentType);

          partResults[n - 1] = { part_number: n, etag };
          uploadedBytes += end - start;
          onStage?.({
            type: 'uploading',
            sent: uploadedBytes,
            total: fileSize,
          });
        } finally {
          // Best-effort cleanup of each part file as soon as it's
          // done uploading — keeps peak disk usage bounded to
          // (concurrency × PART_SIZE) regardless of file size.
          await ReactNativeBlobUtil.fs.unlink(partPath).catch(() => undefined);
          sem.release();
        }
      }),
    );

    // 4. Complete. The server runs HEAD + DDB write atomically, same
    // as the single-PUT finalize path.
    onStage?.({ type: 'finalizing' });
    const completed = await api.completeMultipart(
      echoId,
      upload_id,
      key,
      partResults,
    );
    return completed;
  } catch (err) {
    // 5. Abort. Best effort — if it fails the lifecycle rule will
    // reap the upload after 7 days. Always re-throw the original.
    try {
      await api.abortMultipart(echoId, upload_id, key);
    } catch (abortErr) {
      console.warn('Failed to abort multipart upload:', abortErr);
    }
    throw err;
  } finally {
    // Clean up the slice directory itself. unlink on a directory
    // works recursively in react-native-blob-util.
    await ReactNativeBlobUtil.fs
      .unlink(sliceDir)
      .catch(() => undefined);
  }
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
