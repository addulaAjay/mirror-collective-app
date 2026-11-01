/**
 * Turn a freshly-picked photo into something ready to send inline.
 *
 * Chat media rides in the request body as base64 and is never uploaded or
 * stored (see docs/CHAT_MEDIA_V1_PLAN.md D6/D7), so there is no presign, no
 * PUT and no progress reporting here — just normalize, shrink, and hand back
 * a local URI the send step reads.
 *
 * The expensive work (HEIC decode, re-encode) happens at **pick** time, not
 * send time. That is what keeps the send tap responsive now that there is no
 * background upload to hide latency behind.
 */

import ReactNativeBlobUtil from 'react-native-blob-util';

import { compressChatPhoto, ensureWebSafePhoto } from '@utils/media/compress';
import { normalizeMime, resolveFileContentType } from '@utils/media/mime';

/**
 * Must match the backend's `MAX_CHAT_IMAGE_BYTES`
 * (services/chat_attachment_service.py). Checked client-side too so an
 * oversized photo fails instantly instead of after a slow request that ends
 * in a 400.
 */
export const CHAT_PHOTO_MAX_DECODED_BYTES = 1_500_000;

/**
 * Mirrors the backend's chat image allowlist — deliberately narrower than
 * Echo Vault's upload allowlist. No HEIC: `ensureWebSafePhoto` converts it
 * before we get here, so a HEIC surviving to this check means that step
 * failed and we would rather say so than send bytes the server will refuse.
 */
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface PickedPhoto {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

export interface PreparedChatPhoto {
  kind: 'image';
  /** Local file URI of the normalized, compressed photo. */
  localUri: string;
  /** Canonical MIME type the backend will accept. */
  mimeType: string;
  /** Size after compression, or null when it could not be measured. */
  sizeBytes: number | null;
}

/** Strip the file:// scheme — ReactNativeBlobUtil.fs takes paths, not URIs. */
const toPath = (uri: string): string =>
  uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;

/**
 * Normalize and compress a picked photo.
 *
 * @throws when the photo's type is unsupported, or when it is still over the
 *   size cap after compression. Both are user-actionable, so the caller
 *   surfaces the message rather than failing silently.
 */
export async function prepareChatPhoto(
  picked: PickedPhoto,
): Promise<PreparedChatPhoto> {
  // HEIC → JPEG first: Image.compress cannot decode every HEIC variant, so
  // compressing before converting would fail on exactly the iOS default
  // camera format.
  const webSafe = await ensureWebSafePhoto(
    picked.uri,
    picked.mimeType ?? undefined,
  );

  const mimeType = normalizeMime(
    webSafe.contentType ??
      resolveFileContentType(picked.fileName ?? picked.uri, picked.mimeType),
  );

  if (!ACCEPTED_MIME_TYPES.includes(mimeType as never)) {
    throw new Error(
      `The Mirror can't read that kind of image. Supported: JPEG, PNG, WebP.`,
    );
  }

  const compressed = await compressChatPhoto(webSafe.uri);

  // null means the size could not be measured (e.g. an iOS PHAsset URI).
  // Letting it through is deliberate — rejecting on "unknown" would block
  // valid photos, and the backend enforces the real cap.
  if (
    compressed.resultBytes !== null &&
    compressed.resultBytes > CHAT_PHOTO_MAX_DECODED_BYTES
  ) {
    throw new Error(
      'That photo is too large to share, even after compressing. Try a smaller one.',
    );
  }

  return {
    kind: 'image',
    localUri: compressed.uri,
    mimeType,
    sizeBytes: compressed.resultBytes,
  };
}

/**
 * Read a prepared photo as base64, for the request body.
 *
 * Done at send time rather than at pick time so a staged-but-never-sent photo
 * doesn't sit in JS memory as a ~400KB string for the life of the screen.
 */
export async function readPhotoAsBase64(localUri: string): Promise<string> {
  const base64 = await ReactNativeBlobUtil.fs.readFile(
    toPath(localUri),
    'base64',
  );

  if (!base64) {
    // An empty read would otherwise be sent as a zero-byte attachment and
    // rejected by the server with a confusing "malformed base64".
    throw new Error('Could not read that photo. Try picking it again.');
  }

  return base64;
}
