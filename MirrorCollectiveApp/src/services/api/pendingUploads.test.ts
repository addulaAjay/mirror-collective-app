/**
 * Tests for the AsyncStorage-backed pending-upload persistence layer.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  __TESTING__,
  CompletedPart,
  PendingUpload,
  listResumableUploads,
  loadPending,
  markPartComplete,
  removePending,
  savePending,
} from './pendingUploads';

function makePending(overrides: Partial<PendingUpload> = {}): PendingUpload {
  return {
    echoId: 'echo-1',
    uploadId: 'UPLOAD-1',
    key: 'echoes/u-1/echo-1.mp4',
    cachedFileUri: '/cache/mc-pending/echo-1.mp4',
    contentType: 'video/mp4',
    fileSize: 5 * 1024 * 1024,
    completedParts: [],
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    title: 'A test echo',
    ...overrides,
  };
}

describe('savePending / loadPending / removePending', () => {
  beforeEach(() => {
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.removeItem as jest.Mock).mockReset();
  });

  it('savePending writes a JSON-stringified row under the key prefix', async () => {
    await savePending(makePending());
    const [key, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(key).toBe(`${__TESTING__.KEY_PREFIX}echo-1`);
    const parsed = JSON.parse(value);
    expect(parsed.echoId).toBe('echo-1');
    expect(parsed.completedParts).toEqual([]);
  });

  it('savePending refreshes lastUpdatedAt on every write', async () => {
    const old = makePending({ lastUpdatedAt: '2020-01-01T00:00:00.000Z' });
    await savePending(old);
    const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const parsed = JSON.parse(value);
    expect(parsed.lastUpdatedAt).not.toBe('2020-01-01T00:00:00.000Z');
    expect(Date.parse(parsed.lastUpdatedAt)).toBeGreaterThan(
      Date.parse('2020-01-01T00:00:00.000Z'),
    );
  });

  it('loadPending parses an existing row', async () => {
    const row = makePending();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(row));
    const out = await loadPending('echo-1');
    expect(out?.uploadId).toBe('UPLOAD-1');
  });

  it('loadPending returns null when missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    expect(await loadPending('nope')).toBeNull();
  });

  it('loadPending returns null on parse error (corrupt row)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not-json{{');
    expect(await loadPending('echo-1')).toBeNull();
  });

  it('removePending calls removeItem with the right key', async () => {
    await removePending('echo-1');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      `${__TESTING__.KEY_PREFIX}echo-1`,
    );
  });
});

describe('markPartComplete', () => {
  beforeEach(() => {
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockReset();
  });

  it('appends a part to the existing list', async () => {
    const row = makePending({ completedParts: [{ part_number: 1, etag: 'a' }] });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(row));

    await markPartComplete('echo-1', { part_number: 2, etag: 'b' });

    const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const parsed = JSON.parse(value);
    expect(parsed.completedParts).toEqual([
      { part_number: 1, etag: 'a' },
      { part_number: 2, etag: 'b' },
    ]);
  });

  it('replaces (not duplicates) on the same part_number — covers retry', async () => {
    const row = makePending({
      completedParts: [{ part_number: 3, etag: 'first-try' }],
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(row));

    await markPartComplete('echo-1', { part_number: 3, etag: 'second-try' });

    const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const parsed = JSON.parse(value);
    expect(parsed.completedParts).toHaveLength(1);
    expect(parsed.completedParts[0].etag).toBe('second-try');
  });

  it('silently no-ops when the row is missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await markPartComplete('echo-1', { part_number: 1, etag: 'a' });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('listResumableUploads', () => {
  beforeEach(() => {
    (AsyncStorage.getAllKeys as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.removeItem as jest.Mock).mockReset();
  });

  function setStorage(rows: Record<string, PendingUpload>) {
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(Object.keys(rows));
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      return rows[key] ? JSON.stringify(rows[key]) : null;
    });
  }

  const alwaysExists: () => Promise<boolean> = async () => true;
  const neverExists: () => Promise<boolean> = async () => false;

  it('returns all rows when source exists and rows are fresh', async () => {
    setStorage({
      [`${__TESTING__.KEY_PREFIX}echo-1`]: makePending({ echoId: 'echo-1' }),
      [`${__TESTING__.KEY_PREFIX}echo-2`]: makePending({ echoId: 'echo-2' }),
    });
    const out = await listResumableUploads(alwaysExists);
    const ids = out.map(r => r.echoId).sort();
    expect(ids).toEqual(['echo-1', 'echo-2']);
  });

  it('ignores non-pending storage keys', async () => {
    setStorage({
      [`${__TESTING__.KEY_PREFIX}echo-1`]: makePending({ echoId: 'echo-1' }),
    });
    // Add some unrelated keys to the keylist
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
      `${__TESTING__.KEY_PREFIX}echo-1`,
      '@/some-other-app-key',
      'random',
    ]);
    const out = await listResumableUploads(alwaysExists);
    expect(out).toHaveLength(1);
    expect(out[0].echoId).toBe('echo-1');
  });

  it('prunes stale rows (>7 days old) and removes them from storage', async () => {
    const stale = makePending({
      echoId: 'old',
      createdAt: '2020-01-01T00:00:00.000Z',
    });
    const fresh = makePending({ echoId: 'new' });
    setStorage({
      [`${__TESTING__.KEY_PREFIX}old`]: stale,
      [`${__TESTING__.KEY_PREFIX}new`]: fresh,
    });
    const out = await listResumableUploads(alwaysExists);
    expect(out.map(r => r.echoId)).toEqual(['new']);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      `${__TESTING__.KEY_PREFIX}old`,
    );
  });

  it('prunes rows whose source file is gone', async () => {
    setStorage({
      [`${__TESTING__.KEY_PREFIX}gone`]: makePending({ echoId: 'gone' }),
    });
    const out = await listResumableUploads(neverExists);
    expect(out).toEqual([]);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      `${__TESTING__.KEY_PREFIX}gone`,
    );
  });

  it('returns an empty list when no pending keys exist', async () => {
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
      'unrelated-key',
    ]);
    const out = await listResumableUploads(alwaysExists);
    expect(out).toEqual([]);
  });

  it('survives AsyncStorage.getAllKeys() rejection', async () => {
    (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(
      new Error('storage broken'),
    );
    const out = await listResumableUploads(alwaysExists);
    expect(out).toEqual([]);
  });
});
