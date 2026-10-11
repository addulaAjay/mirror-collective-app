import ReactNativeBlobUtil from 'react-native-blob-util';

import { ensureWebSafePhoto, compressChatPhoto } from '@utils/media/compress';

import {
  CHAT_PHOTO_MAX_DECODED_BYTES,
  prepareChatPhoto,
  readPhotoAsBase64,
} from './prepareChatPhoto';

jest.mock('@utils/media/compress', () => ({
  ensureWebSafePhoto: jest.fn(),
  compressChatPhoto: jest.fn(),
  unlinkQuietly: jest.fn().mockResolvedValue(undefined),
}));

const mockEnsureWebSafe = ensureWebSafePhoto as jest.Mock;
const mockCompress = compressChatPhoto as jest.Mock;
const mockReadFile = ReactNativeBlobUtil.fs.readFile as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockEnsureWebSafe.mockResolvedValue({
    uri: 'file:///tmp/web-safe.jpg',
    contentType: 'image/jpeg',
  });
  mockCompress.mockResolvedValue({
    uri: 'file:///tmp/small.jpg',
    compressed: true,
    originalBytes: 4_000_000,
    resultBytes: 300_000,
  });
  mockReadFile.mockResolvedValue('QUJD');
});

describe('prepareChatPhoto', () => {
  it('converts HEIC before compressing', async () => {
    // Order matters: Image.compress cannot decode every HEIC variant, so the
    // web-safe conversion has to run first.
    const order: string[] = [];
    mockEnsureWebSafe.mockImplementation(async () => {
      order.push('ensureWebSafe');
      return { uri: 'file:///tmp/web-safe.jpg', contentType: 'image/jpeg' };
    });
    mockCompress.mockImplementation(async () => {
      order.push('compress');
      return { uri: 'file:///tmp/small.jpg', compressed: true, originalBytes: 1, resultBytes: 1 };
    });

    await prepareChatPhoto({ uri: 'file:///x.heic', mimeType: 'image/heic' });

    expect(order).toEqual(['ensureWebSafe', 'compress']);
  });

  it('returns the compressed local uri and its mime type', async () => {
    const result = await prepareChatPhoto({
      uri: 'file:///x.jpg',
      mimeType: 'image/jpeg',
    });

    expect(result.localUri).toBe('file:///tmp/small.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.kind).toBe('image');
  });

  it('reports the resulting byte size so the caller can gate on it', async () => {
    const result = await prepareChatPhoto({
      uri: 'file:///x.jpg',
      mimeType: 'image/jpeg',
    });

    expect(result.sizeBytes).toBe(300_000);
  });

  it('normalizes a non-canonical mime from the picker', async () => {
    mockEnsureWebSafe.mockResolvedValue({
      uri: 'file:///tmp/web-safe.jpg',
      contentType: 'image/jpg',
    });

    const result = await prepareChatPhoto({
      uri: 'file:///x.jpg',
      mimeType: 'image/jpg',
    });

    expect(result.mimeType).toBe('image/jpeg');
  });

  it('derives a mime type from the filename when the picker gives none', async () => {
    mockEnsureWebSafe.mockResolvedValue({
      uri: 'file:///tmp/web-safe.png',
      contentType: undefined,
    });

    const result = await prepareChatPhoto({
      uri: 'file:///photo.png',
      mimeType: undefined,
      fileName: 'photo.png',
    });

    expect(result.mimeType).toBe('image/png');
  });

  it('rejects a photo that is still too large after compression', async () => {
    // The server enforces this too, but failing here saves the user a slow
    // upload that ends in a 400.
    mockCompress.mockResolvedValue({
      uri: 'file:///tmp/big.jpg',
      compressed: true,
      originalBytes: 20_000_000,
      resultBytes: CHAT_PHOTO_MAX_DECODED_BYTES + 1,
    });

    await expect(
      prepareChatPhoto({ uri: 'file:///x.jpg', mimeType: 'image/jpeg' }),
    ).rejects.toThrow(/too large/i);
  });

  it('allows a photo of unknown size through rather than guessing', async () => {
    // getSize returns null for an unmeasurable PHAsset. Blocking on "unknown"
    // would reject valid photos; the server is the backstop.
    mockCompress.mockResolvedValue({
      uri: 'file:///tmp/x.jpg',
      compressed: true,
      originalBytes: null,
      resultBytes: null,
    });

    const result = await prepareChatPhoto({
      uri: 'file:///x.jpg',
      mimeType: 'image/jpeg',
    });

    expect(result.localUri).toBe('file:///tmp/x.jpg');
    expect(result.sizeBytes).toBeNull();
  });

  it('rejects a mime type the backend will not accept', async () => {
    mockEnsureWebSafe.mockResolvedValue({
      uri: 'file:///tmp/x.gif',
      contentType: 'image/gif',
    });

    await expect(
      prepareChatPhoto({ uri: 'file:///x.gif', mimeType: 'image/gif' }),
    ).rejects.toThrow(/support/i);
  });
});

describe('readPhotoAsBase64', () => {
  it('strips the file:// scheme before reading', async () => {
    // ReactNativeBlobUtil.fs takes a path, not a URI.
    await readPhotoAsBase64('file:///tmp/photo.jpg');

    expect(mockReadFile).toHaveBeenCalledWith('/tmp/photo.jpg', 'base64');
  });

  it('passes a scheme-less path through unchanged', async () => {
    await readPhotoAsBase64('/tmp/photo.jpg');

    expect(mockReadFile).toHaveBeenCalledWith('/tmp/photo.jpg', 'base64');
  });

  it('returns the base64 payload', async () => {
    mockReadFile.mockResolvedValue('SGVsbG8=');

    await expect(readPhotoAsBase64('file:///tmp/p.jpg')).resolves.toBe(
      'SGVsbG8=',
    );
  });

  it('surfaces a read failure rather than sending an empty payload', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    await expect(readPhotoAsBase64('file:///tmp/p.jpg')).rejects.toThrow();
  });

  it('rejects an empty read rather than sending a zero-byte attachment', async () => {
    mockReadFile.mockResolvedValue('');

    await expect(readPhotoAsBase64('file:///tmp/p.jpg')).rejects.toThrow();
  });
});
