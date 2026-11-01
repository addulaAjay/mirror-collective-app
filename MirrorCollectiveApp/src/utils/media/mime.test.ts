import {
  CHAT_AUDIO_CONTENT_TYPE,
  EXT_CONTENT_TYPE,
  MIME_ALIASES,
  formatDuration,
  normalizeMime,
  resolveFileContentType,
} from './mime';

describe('normalizeMime', () => {
  it('lowercases and trims', () => {
    expect(normalizeMime('  IMAGE/PNG ')).toBe('image/png');
  });

  it('maps known image aliases to what the backend allowlist accepts', () => {
    expect(normalizeMime('image/jpg')).toBe('image/jpeg');
    expect(normalizeMime('image/pjpeg')).toBe('image/jpeg');
  });

  it('maps video/mov to video/quicktime', () => {
    expect(normalizeMime('video/mov')).toBe('video/quicktime');
  });

  it('maps audio/x-m4a to audio/m4a', () => {
    // The backend allowlist has audio/m4a, not audio/x-m4a. Android pickers
    // report the x- form.
    expect(normalizeMime('audio/x-m4a')).toBe('audio/m4a');
  });

  it('passes through a type that is already canonical', () => {
    expect(normalizeMime('image/jpeg')).toBe('image/jpeg');
    expect(normalizeMime('audio/m4a')).toBe('audio/m4a');
  });

  it('leaves an unknown type alone rather than guessing', () => {
    expect(normalizeMime('application/x-weird')).toBe('application/x-weird');
  });
});

describe('resolveFileContentType', () => {
  it('trusts a concrete provided type', () => {
    expect(resolveFileContentType('whatever.bin', 'image/png')).toBe(
      'image/png',
    );
  });

  it('normalizes the provided type', () => {
    expect(resolveFileContentType('photo.jpg', 'image/jpg')).toBe('image/jpeg');
  });

  it('derives from the extension when the type is the generic octet-stream', () => {
    // Android's DocumentPicker reports octet-stream for plenty of real files.
    expect(resolveFileContentType('scan.pdf', 'application/octet-stream')).toBe(
      'application/pdf',
    );
  });

  it('derives from the extension when no type is provided', () => {
    expect(resolveFileContentType('shot.HEIC')).toBe('image/heic');
    expect(resolveFileContentType('clip.mov')).toBe('video/quicktime');
  });

  it('resolves audio extensions so a voice note passes the upload allowlist', () => {
    expect(resolveFileContentType('voice-123.m4a')).toBe('audio/m4a');
    expect(resolveFileContentType('track.mp3')).toBe('audio/mpeg');
    expect(resolveFileContentType('clip.aac')).toBe('audio/aac');
  });

  it('is case-insensitive on the extension', () => {
    expect(resolveFileContentType('IMAGE.PNG')).toBe('image/png');
  });

  it('falls back to the provided type for an unknown extension', () => {
    expect(resolveFileContentType('data.xyz', 'text/weird')).toBe('text/weird');
  });

  it('falls back to octet-stream when nothing is resolvable', () => {
    expect(resolveFileContentType('noextension')).toBe(
      'application/octet-stream',
    );
  });

  it('handles a filename with several dots', () => {
    expect(resolveFileContentType('my.holiday.photo.png')).toBe('image/png');
  });
});

describe('formatDuration', () => {
  it('formats sub-minute durations as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5_000)).toBe('0:05');
    expect(formatDuration(59_000)).toBe('0:59');
  });

  it('rolls over to minutes', () => {
    expect(formatDuration(60_000)).toBe('1:00');
    expect(formatDuration(152_000)).toBe('2:32');
  });

  it('does not pad the minutes field', () => {
    expect(formatDuration(600_000)).toBe('10:00');
  });

  it('floors partial seconds rather than rounding up', () => {
    expect(formatDuration(1_999)).toBe('0:01');
  });

  it('treats negative input as zero rather than emitting a negative clock', () => {
    expect(formatDuration(-1)).toBe('0:00');
  });
});

describe('module constants', () => {
  it('declares audio/m4a as the canonical chat recording type', () => {
    // Resolves the NewEchoAudioScreen (audio/m4a) vs CreateEchoScreen
    // (audio/mp4) inconsistency. Both are on the backend allowlist; chat
    // standardises on m4a.
    expect(CHAT_AUDIO_CONTENT_TYPE).toBe('audio/m4a');
  });

  it('only maps aliases to canonical values', () => {
    // Guards against an alias pointing at another alias.
    for (const canonical of Object.values(MIME_ALIASES)) {
      expect(MIME_ALIASES[canonical]).toBeUndefined();
    }
  });

  it('maps every extension to an already-normalized mime', () => {
    for (const [ext, mime] of Object.entries(EXT_CONTENT_TYPE)) {
      expect(normalizeMime(mime)).toBe(mime);
      expect(ext).toBe(ext.toLowerCase());
    }
  });
});
