/**
 * Persistence for the Reflection Room first-time-Welcome flag.
 * Stored in AsyncStorage under "RR_WELCOME_SEEN". Set when the user
 * dismisses the Welcome onboarding and reaches the first quiz screen.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_SEEN_KEY = 'RR_WELCOME_SEEN';

export async function hasSeenWelcome(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markWelcomeSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
  } catch {
    // Non-fatal — first-time UX may repeat once if storage is broken.
  }
}

/** Test-only — restore first-time state. */
export async function resetWelcomeForTests(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WELCOME_SEEN_KEY);
  } catch {
    // ignore
  }
}
