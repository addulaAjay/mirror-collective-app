/**
 * Tests for the pending-verification AsyncStorage helpers.
 *  - get returns null when storage is empty.
 *  - set/get round-trips a record.
 *  - get returns null + clears storage when the record is older than TTL_MS (1h).
 *  - clear removes the record.
 *  - get returns null when storage throws or returns malformed JSON.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearPendingVerification,
  getPendingVerification,
  setPendingVerification,
} from './verificationState';

const KEY = 'PENDING_VERIFICATION';

describe('verificationState', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (AsyncStorage.removeItem as jest.Mock).mockReset();
  });

  it('getPendingVerification returns null when storage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await expect(getPendingVerification()).resolves.toBeNull();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(KEY);
  });

  it('setPendingVerification persists JSON with createdAt', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
    await setPendingVerification({
      email: 'a@b.com',
      fullName: 'Ada',
      termsAcceptedAt: '2026-05-04T00:00:00Z',
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    const [key, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(key).toBe(KEY);
    const parsed = JSON.parse(value);
    expect(parsed.email).toBe('a@b.com');
    expect(parsed.fullName).toBe('Ada');
    expect(parsed.termsAcceptedAt).toBe('2026-05-04T00:00:00Z');
    expect(typeof parsed.createdAt).toBe('string');
  });

  it('getPendingVerification returns the record when it is fresh', async () => {
    const fresh = {
      email: 'a@b.com',
      fullName: null,
      termsAcceptedAt: null,
      createdAt: new Date().toISOString(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(fresh),
    );
    await expect(getPendingVerification()).resolves.toEqual(fresh);
  });

  it('getPendingVerification clears + returns null when older than 1h', async () => {
    const stale = {
      email: 'a@b.com',
      fullName: null,
      termsAcceptedAt: null,
      // 90 minutes ago — exceeds the 1h TTL.
      createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(stale),
    );
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);
    await expect(getPendingVerification()).resolves.toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(KEY);
  });

  it('getPendingVerification returns null on malformed JSON', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{not-json');
    await expect(getPendingVerification()).resolves.toBeNull();
  });

  it('clearPendingVerification removes the record', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);
    await clearPendingVerification();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(KEY);
  });

  it('all helpers swallow storage errors (non-fatal)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('disk'));
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk'));
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('disk'));
    await expect(getPendingVerification()).resolves.toBeNull();
    await expect(
      setPendingVerification({ email: 'x', fullName: null, termsAcceptedAt: null }),
    ).resolves.toBeUndefined();
    await expect(clearPendingVerification()).resolves.toBeUndefined();
  });
});
