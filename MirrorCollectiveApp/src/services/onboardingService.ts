import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service to manage onboarding completion state
 */
class OnboardingService {
  private static readonly ONBOARDING_COMPLETE_KEY = 'HAS_COMPLETED_ONBOARDING';

  /**
   * Check if user has completed the onboarding flow
   */
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.ONBOARDING_COMPLETE_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as complete
   */
  static async markOnboardingComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ONBOARDING_COMPLETE_KEY, 'true');
      if (__DEV__) {
        console.log('Onboarding marked as complete');
      }
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
    }
  }

  /**
   * Reset onboarding status (for testing or when user logs out)
   */
  static async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ONBOARDING_COMPLETE_KEY);
      if (__DEV__) {
        console.log('Onboarding status reset');
      }
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }
}

export default OnboardingService;
