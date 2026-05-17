/**
 * useAutoReadPreference — AsyncStorage-backed boolean toggle for
 * "Auto-read Mirror replies". Default is OFF so first-time users hear
 * no surprise audio.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AUTO_READ_STORAGE_KEY,
  useAutoReadPreference,
} from './useAutoReadPreference';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAutoReadPreference', () => {
  it('starts disabled when AsyncStorage has no value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAutoReadPreference());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.enabled).toBe(false);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(AUTO_READ_STORAGE_KEY);
  });

  it('hydrates from AsyncStorage value "true"', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

    const { result } = renderHook(() => useAutoReadPreference());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.enabled).toBe(true);
  });

  it('setEnabled writes to AsyncStorage and updates state', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAutoReadPreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
      await result.current.setEnabled(true);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      AUTO_READ_STORAGE_KEY,
      'true',
    );
    expect(result.current.enabled).toBe(true);
  });

  it('setEnabled(false) writes "false" — not removeItem — so it survives "any non-null = true" parsing bugs', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

    const { result } = renderHook(() => useAutoReadPreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
      await result.current.setEnabled(false);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      AUTO_READ_STORAGE_KEY,
      'false',
    );
    expect(result.current.enabled).toBe(false);
  });

  it('treats unknown values as disabled (defensive)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('garbage');

    const { result } = renderHook(() => useAutoReadPreference());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.enabled).toBe(false);
  });
});
