/**
 * Media compression helpers.
 *
 * Why these exist: the native-streaming-upload PR removed the JS-bridge
 * round-trip, but a 4K iPhone clip is still 100-150 MB/min on the wire.
 * Even with Transfer Acceleration the cellular UX is "go make coffee."
 *
 * What these do:
 *   - compressVideoIfNeeded()  → 720p H.264 ~6 Mbps target. A 1m clip
 *     drops from ~100 MB to ~10 MB; quality is indistinguishable for
 *     phone-screen playback.
 *   - compressImageIfNeeded()  → resize to 1024×1024 max, JPEG q=0.85.
 *     iPhone-camera photos (4032×3024 ≈ 4-6 MB) drop to ~200-400 KB.
 *
 * Both are no-ops if the input is already small enough. The "skip"
 * thresholds are tuned to avoid the recompression-quality-cliff for
 * already-compressed sources.
 */

import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  Image,
  Video,
  createVideoThumbnail,
} from 'react-native-compressor';

export interface CompressResult {
  /** The URI the caller should upload — original or compressed. */
  uri: string;
  /** Whether compression actually ran (the input was larger than threshold). */
  compressed: boolean;
  /** Original size in bytes when known; null if we never measured. */
  originalBytes: number | null;
  /** Resulting size in bytes when known; null if we never measured. */
  resultBytes: number | null;
}

/** Skip video compression below this size. */
const VIDEO_SKIP_BYTES = 10 * 1024 * 1024; // 10 MB

/** Skip image compression below this size. */
const IMAGE_SKIP_BYTES = 1 * 1024 * 1024; // 1 MB

/**
 * Compress a video to a 720p / ~6 Mbps target if it's larger than the
 * skip threshold. Returns the new URI (or the original if skipped).
 *
 * Compressor uses native AVAssetExportSession (iOS) / MediaCodec (Android),
 * so no JS bridge load. The temp file lives in the app cache directory;
 * react-native-blob-util.wrap() handles it the same as the original.
 */
export async function compressVideoIfNeeded(
  uri: string,
  onProgress?: (fraction: number) => void,
): Promise<CompressResult> {
  const sizeBefore = await getSize(uri);
  if (sizeBefore !== null && sizeBefore < VIDEO_SKIP_BYTES) {
    return { uri, compressed: false, originalBytes: sizeBefore, resultBytes: sizeBefore };
  }

  const newUri = await Video.compress(
    uri,
    {
      compressionMethod: 'auto',
      maxSize: 1280, // longest edge → 720p portrait or landscape
      minimumFileSizeForCompress: VIDEO_SKIP_BYTES / (1024 * 1024), // MB
    },
    progress => {
      if (onProgress) onProgress(progress);
    },
  );

  const sizeAfter = await getSize(newUri);
  return {
    uri: newUri,
    compressed: true,
    originalBytes: sizeBefore,
    resultBytes: sizeAfter,
  };
}

/**
 * Resize a still image to fit within 1024×1024 if it's larger than the
 * skip threshold. JPEG q=0.85 — visually lossless for avatar / inline
 * display, ~10× smaller than raw camera output.
 */
export async function compressImageIfNeeded(
  uri: string,
): Promise<CompressResult> {
  const sizeBefore = await getSize(uri);
  if (sizeBefore !== null && sizeBefore < IMAGE_SKIP_BYTES) {
    return { uri, compressed: false, originalBytes: sizeBefore, resultBytes: sizeBefore };
  }

  const newUri = await Image.compress(uri, {
    compressionMethod: 'auto',
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.85,
    output: 'jpg',
  });

  const sizeAfter = await getSize(newUri);
  return {
    uri: newUri,
    compressed: true,
    originalBytes: sizeBefore,
    resultBytes: sizeAfter,
  };
}

/**
 * Resolve the byte size of a local URI. Returns null when the platform
 * doesn't expose a path we can stat (e.g. iOS PHAsset-style URIs before
 * export). Callers treat null as "unknown, just go ahead and compress."
 */
async function getSize(uri: string): Promise<number | null> {
  try {
    const path = uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    const size = typeof stat.size === 'string' ? parseInt(stat.size, 10) : stat.size;
    return Number.isFinite(size) ? size : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort cleanup of a temp file written by react-native-compressor.
 * Failure here is non-fatal: the temp directory will be reclaimed by the OS
 * eventually. We just log and move on so callers don't have to wrap this
 * in another try.
 */
export async function unlinkQuietly(uri: string): Promise<void> {
  try {
    const path = uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;
    await ReactNativeBlobUtil.fs.unlink(path);
  } catch (err) {
    console.warn('Failed to unlink compressed temp file:', uri, err);
  }
}

/**
 * Extract a single JPEG frame from a video for use as a poster thumbnail.
 *
 * Uses ``react-native-compressor.createVideoThumbnail`` which native-side
 * runs AVAssetImageGenerator (iOS) / MediaMetadataRetriever (Android)
 * and writes a JPEG to the app cache directory. The default frame is
 * t=1s; we let the library decide so we don't fight its codec defaults.
 *
 * Returns the local file path (caller is responsible for uploading +
 * cleanup) or null if extraction fails. Never throws — poster
 * generation is opportunistic and a failure shouldn't cascade into
 * the user-facing save flow.
 */
export async function createPosterThumbnail(
  videoUri: string,
): Promise<string | null> {
  try {
    const result = await createVideoThumbnail(videoUri);
    return result?.path ?? null;
  } catch (err) {
    console.warn('createVideoThumbnail failed:', err);
    return null;
  }
}
