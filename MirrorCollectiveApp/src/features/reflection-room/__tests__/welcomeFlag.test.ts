/**
 * Tests for welcomeFlag — AsyncStorage-backed first-time onboarding flag.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  hasSeenWelcome,
  markWelcomeSeen,
  resetWelcomeForTests,
} from '../state/welcomeFlag';

describe('welcomeFlag', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (AsyncStorage.removeItem as jest.Mock).mockReset();
  });

  it('hasSeenWelcome returns false when storage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await expect(hasSeenWelcome()).resolves.toBe(false);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('RR_WELCOME_SEEN');
  });

  it('hasSeenWelcome returns true when flag is set', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
    await expect(hasSeenWelcome()).resolves.toBe(true);
  });

  it('hasSeenWelcome returns false when storage throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('disk full'),
    );
    await expect(hasSeenWelcome()).resolves.toBe(false);
  });

  it('markWelcomeSeen writes the flag', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
    await markWelcomeSeen();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('RR_WELCOME_SEEN', 'true');
  });

  it('markWelcomeSeen does not throw when storage fails', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('disk full'),
    );
    await expect(markWelcomeSeen()).resolves.toBeUndefined();
  });

  it('resetWelcomeForTests clears the flag', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);
    await resetWelcomeForTests();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('RR_WELCOME_SEEN');
  });
});
