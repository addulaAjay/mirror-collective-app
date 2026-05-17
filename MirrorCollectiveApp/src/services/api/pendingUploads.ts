/**
 * Persistence layer for in-flight multipart uploads.
 *
 * The problem this solves
 * -----------------------
 * Force-quitting the app (user swipe-up, OS kill on memory pressure)
 * during a multipart upload throws away all progress. The bytes are
 * in S3 — but the upload_id is lost from JS memory, so the client
 * starts over from byte zero on next launch. For a 100 MB+ video
 * over cellular this is the worst-case UX in the upload pipeline.
 *
 * What this does
 * --------------
 * Persists the state of every in-flight multipart upload to
 * AsyncStorage. After ``initiate`` succeeds we write the row; after
 * each part lands we append its (part_number, etag); on ``complete``
 * or ``abort`` we delete it. On next app launch
 * ``listResumableUploads()`` returns whatever's still recoverable —
 * stale rows (>7 days, matching the bucket lifecycle rule) and rows
 * whose source file has been deleted are pruned automatically.
 *
 * Why AsyncStorage and not MMKV
 * -----------------------------
 * AsyncStorage is already a dependency and the access pattern is
 * "one read at app launch, occasional writes during an upload" —
 * sub-millisecond access isn't worth a new native module. MMKV
 * would be ~10x faster but the savings are unmeasurable here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'pendingUpload:';

/**
 * 7 days — matches the bucket's AbortIncompleteMultipartUpload
 * lifecycle rule on the backend. Rows older than this point at S3
 * upload sessions that have already been reaped, so trying to resume
 * them would 404 (the server maps NoSuchUpload to "session expired").
 */
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export interface CompletedPart {
  part_number: number;
  etag: string;
}

export interface PendingUpload {
  echoId: string;
  uploadId: string;
  /** S3 object key — same value the client sent to /multipart/initiate. */
  key: string;
  /**
   * Path to a copy of the source file inside the app's cache directory.
   * NOT the original picker URI — those are often ``PHAsset://``
   * references that go invalid after the picker session ends. We copy
   * once at the start of every multipart upload (see prepareSourceCopy
   * in multipart.ts) so resume survives a force-quit even when the
   * picker is long gone.
   */
  cachedFileUri: string;
  contentType: string;
  fileSize: number;
  /**
   * Append-only list of parts that successfully PUT to S3. Sorted by
   * insertion order; not by part_number (callers sort defensively).
   */
  completedParts: CompletedPart[];
  /** ISO timestamp of initiate (== createdAt). */
  createdAt: string;
  /** ISO timestamp of the most recent append/save. */
  lastUpdatedAt: string;
  /**
   * Human-readable title from the echo metadata. Used by the resume
   * banner so the user knows which upload they're picking back up
   * without having to navigate into the row.
   */
  title: string;
}

function storageKey(echoId: string): string {
  return `${KEY_PREFIX}${echoId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Persist (or overwrite) a pending-upload row. Used by:
 *   - ``initiate`` callsite after the server returns ``upload_id``
 *   - ``markPartComplete`` after each successful per-part PUT
 *
 * Failures are swallowed (logged) — persistence is best-effort, never
 * worth blocking the upload itself.
 */
export async function savePending(pending: PendingUpload): Promise<void> {
  try {
    const withStamp: PendingUpload = {
      ...pending,
      lastUpdatedAt: nowIso(),
    };
    await AsyncStorage.setItem(storageKey(pending.echoId), JSON.stringify(withStamp));
  } catch (err) {
    console.warn('savePending failed:', err);
  }
}

/**
 * Append a completed part to an existing pending row. No-op if the
 * row doesn't exist (a race we don't care about — the part is already
 * in S3 and the lifecycle rule will reap the orphan).
 */
export async function markPartComplete(
  echoId: string,
  part: CompletedPart,
): Promise<void> {
  try {
    const existing = await loadPending(echoId);
    if (!existing) return;
    // Defensive: don't append a duplicate part_number. The upload
    // pipeline's per-part retry mechanism may legitimately re-PUT the
    // same part on a 5xx; the second success should overwrite the
    // first ETag (which it would anyway, in S3's eyes) rather than
    // produce two entries the server would reject on complete.
    const filtered = existing.completedParts.filter(
      p => p.part_number !== part.part_number,
    );
    filtered.push(part);
    await savePending({ ...existing, completedParts: filtered });
  } catch (err) {
    console.warn('markPartComplete failed:', err);
  }
}

/** Fetch a single pending-upload row, or null if missing. */
export async function loadPending(echoId: string): Promise<PendingUpload | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(echoId));
    if (!raw) return null;
    return JSON.parse(raw) as PendingUpload;
  } catch (err) {
    console.warn('loadPending failed:', err);
    return null;
  }
}

/** Remove the pending-upload row. Idempotent. */
export async function removePending(echoId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(echoId));
  } catch (err) {
    console.warn('removePending failed:', err);
  }
}

/**
 * Source-file existence check delegated to the caller. We can't
 * import react-native-blob-util at the top of this module without
 * dragging the native module into every storage test; instead
 * listResumableUploads accepts a probe function.
 */
export type FileExistsProbe = (path: string) => Promise<boolean>;

/**
 * Return every pending-upload row that's still resumable.
 *
 * Drops:
 *   - rows where createdAt is older than STALE_THRESHOLD_MS (the S3
 *     session has been reaped by the bucket lifecycle rule)
 *   - rows whose cachedFileUri no longer exists on disk (OS cleaned
 *     up the cache directory, or the file was manually deleted)
 *
 * Pruned rows are removed from AsyncStorage in the same pass so the
 * caller sees a clean list and the storage doesn't accumulate
 * unrecoverable junk.
 */
export async function listResumableUploads(
  fileExists: FileExistsProbe,
  now: number = Date.now(),
): Promise<PendingUpload[]> {
  let keys: readonly string[];
  try {
    keys = await AsyncStorage.getAllKeys();
  } catch (err) {
    console.warn('listResumableUploads keys() failed:', err);
    return [];
  }

  const candidateKeys = keys.filter(k => k.startsWith(KEY_PREFIX));
  if (candidateKeys.length === 0) return [];

  const rows = await Promise.all(
    candidateKeys.map(async key => {
      try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? (JSON.parse(raw) as PendingUpload) : null;
      } catch {
        return null;
      }
    }),
  );

  const resumable: PendingUpload[] = [];
  await Promise.all(
    rows.map(async row => {
      if (!row) return;
      // Stale row → S3 session is gone. Resume would 404.
      const ageMs = now - Date.parse(row.createdAt);
      if (!Number.isFinite(ageMs) || ageMs > STALE_THRESHOLD_MS) {
        await removePending(row.echoId);
        return;
      }
      // Source bytes are gone → we can't upload anything even if S3
      // is ready for us.
      const exists = await fileExists(row.cachedFileUri).catch(() => false);
      if (!exists) {
        await removePending(row.echoId);
        return;
      }
      resumable.push(row);
    }),
  );
  return resumable;
}

export const __TESTING__ = {
  KEY_PREFIX,
  STALE_THRESHOLD_MS,
};
