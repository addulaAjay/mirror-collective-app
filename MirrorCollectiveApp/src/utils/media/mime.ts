/**
 * MIME-type normalization for picked and recorded media.
 *
 * Extracted from CreateEchoScreen so the chat surface can share it rather
 * than grow a fourth copy. The backend signs the presigned PUT with the
 * exact Content-Type string the client passes
 * (`echo_service.generate_upload_url`), so S3 rejects the upload with
 * 403 SignatureDoesNotMatch if the client later sends a different string.
 * That makes "normalize once, then use the same value everywhere" a
 * correctness requirement, not a tidiness preference.
 *
 * The canonical set the backend accepts lives in
 * `ALLOWED_UPLOAD_MIME_TYPES` (mirror_collective_python_api
 * `src/app/services/echo_service.py`). Everything here maps into that set.
 */

/**
 * The content type chat uses for a voice recording.
 *
 * `react-native-audio-recorder-player` writes an m4a container on both
 * platforms. Echo Vault is inconsistent about how it labels that file —
 * NewEchoAudioScreen says `audio/m4a`, CreateEchoScreen says `audio/mp4` —
 * and both happen to be on the backend allowlist, so neither broke. Chat
 * standardises on `audio/m4a` so there is one answer.
 */
export const CHAT_AUDIO_CONTENT_TYPE = 'audio/m4a';

/**
 * Non-canonical MIME types that pickers and recorders report in the wild,
 * mapped to the spelling the backend allowlist uses.
 *
 * Keep values canonical — an alias must never point at another alias
 * (pinned by a test), because `normalizeMime` resolves only one hop.
 */
export const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'video/mov': 'video/quicktime',
  // Android content resolvers commonly report the x- form for m4a.
  'audio/x-m4a': 'audio/m4a',
};

/** Lowercase, trim, and map known aliases (e.g. image/jpg → image/jpeg). */
export function normalizeMime(contentType: string): string {
  const c = contentType.trim().toLowerCase();
  return MIME_ALIASES[c] ?? c;
}

/**
 * Canonical content type per file extension, for the cases where a picker
 * gives us a filename but no usable type.
 */
export const EXT_CONTENT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  heic: 'image/heic',
  heif: 'image/heic',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  // Audio — needed so a recorded or picked voice note resolves to something
  // on the upload allowlist instead of octet-stream.
  m4a: 'audio/m4a',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
};

/**
 * Resolve a usable content type for a picked file.
 *
 * Trusts a concrete provided type; otherwise derives one from the filename
 * extension so the backend upload allowlist accepts it. `application/
 * octet-stream` counts as "no useful type" — Android's DocumentPicker
 * reports it for plenty of real files.
 */
export function resolveFileContentType(
  name: string,
  providedType?: string | null,
): string {
  if (providedType && providedType !== 'application/octet-stream') {
    return normalizeMime(providedType);
  }
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_CONTENT_TYPE[ext] ?? providedType ?? 'application/octet-stream';
}

/**
 * mm:ss from milliseconds, for recording timers and audio attachment labels.
 *
 * Minutes are deliberately unpadded ("2:32", "10:00") to match the existing
 * Echo Vault recorder UI. Negative input clamps to zero so a bad duration
 * can never render as "-1:-1".
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
