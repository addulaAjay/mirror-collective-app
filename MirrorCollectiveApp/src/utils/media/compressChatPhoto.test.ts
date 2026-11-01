import ReactNativeBlobUtil from 'react-native-blob-util';
import { Image } from 'react-native-compressor';

import { CHAT_PHOTO_MAX_EDGE, compressChatPhoto } from './compress';

const mockImageCompress = Image.compress as jest.Mock;
const mockStat = ReactNativeBlobUtil.fs.stat as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // The shared jest mock makes fs.stat reject ("not mocked"); give it a
  // default so getSize() resolves instead of swallowing a surprise.
  mockStat.mockResolvedValue({ size: 4 * 1024 * 1024 });
  mockImageCompress.mockResolvedValue('file:///tmp/compressed.jpg');
});

describe('compressChatPhoto', () => {
  it('resizes to the chat edge cap, not the 1024px avatar cap', async () => {
    // The existing compressImageIfNeeded caps at 1024², which is tuned for
    // avatars. A photo the Mirror is meant to *look at* needs more detail.
    await compressChatPhoto('file:///tmp/photo.jpg');

    expect(mockImageCompress).toHaveBeenCalledTimes(1);
    const [, options] = mockImageCompress.mock.calls[0];
    expect(options.maxWidth).toBe(CHAT_PHOTO_MAX_EDGE);
    expect(options.maxHeight).toBe(CHAT_PHOTO_MAX_EDGE);
    expect(CHAT_PHOTO_MAX_EDGE).toBeGreaterThan(1024);
  });

  it('outputs jpg so the uploaded bytes match the signed image/jpeg type', async () => {
    await compressChatPhoto('file:///tmp/photo.jpg');

    const [, options] = mockImageCompress.mock.calls[0];
    expect(options.output).toBe('jpg');
    expect(options.quality).toBe(0.85);
  });

  it('returns the compressed uri and both sizes', async () => {
    mockStat
      .mockResolvedValueOnce({ size: 4 * 1024 * 1024 })
      .mockResolvedValueOnce({ size: 300 * 1024 });

    const result = await compressChatPhoto('file:///tmp/photo.jpg');

    expect(result).toEqual({
      uri: 'file:///tmp/compressed.jpg',
      compressed: true,
      originalBytes: 4 * 1024 * 1024,
      resultBytes: 300 * 1024,
    });
  });

  it('skips compression for an already-small photo', async () => {
    mockStat.mockResolvedValue({ size: 120 * 1024 });

    const result = await compressChatPhoto('file:///tmp/small.jpg');

    expect(mockImageCompress).not.toHaveBeenCalled();
    expect(result.compressed).toBe(false);
    expect(result.uri).toBe('file:///tmp/small.jpg');
  });

  it('still compresses when the size cannot be measured', async () => {
    // iOS PHAsset URIs can't be stat'd before export. Unknown size means
    // "assume it's a full-resolution camera photo and compress".
    mockStat.mockRejectedValue(new Error('no such file'));

    const result = await compressChatPhoto('ph://ABC-123');

    expect(mockImageCompress).toHaveBeenCalledTimes(1);
    expect(result.compressed).toBe(true);
  });

  it('falls back to the original uri when compression fails', async () => {
    // A photo the user can see but we failed to transcode should still send,
    // rather than blocking the message on an optimisation.
    mockImageCompress.mockRejectedValue(new Error('decode failed'));

    const result = await compressChatPhoto('file:///tmp/photo.jpg');

    expect(result.uri).toBe('file:///tmp/photo.jpg');
    expect(result.compressed).toBe(false);
  });
});
