import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuizSubmissionRequest } from '@types';
import uuid from 'react-native-uuid';

import { quizApiService } from './api';

/**
 * Service to manage temporary quiz result storage before user registration
 */
class QuizStorageService {
  private static readonly STORAGE_KEY = 'PENDING_QUIZ_RESULTS';
  private static readonly SUBMISSION_TRACKER_KEY = 'QUIZ_SUBMITTED_FLAG';
  private static readonly ANONYMOUS_ID_KEY = 'ANONYMOUS_QUIZ_ID';
  private static readonly OFFLINE_QUEUE_KEY = 'QUIZ_OFFLINE_QUEUE';
  private static readonly ACCOUNT_READY_KEY = 'IS_ACCOUNT_READY';

  /**
   * Get or generate a persistent anonymous ID for this installation
   * Rotated upon successful registration
   */
  static async getAnonymousId(): Promise<string> {
    try {
      let anonId = await AsyncStorage.getItem(this.ANONYMOUS_ID_KEY);
      if (!anonId) {
        // Use production-ready UUID v4 generator
        anonId = uuid.v4().toString();
        await AsyncStorage.setItem(this.ANONYMOUS_ID_KEY, anonId);
      }
      return anonId;
    } catch (error) {
      console.error('Failed to get/generate anonymous ID:', error);
      return 'fallback-anon-id-' + Date.now();
    }
  }

  /**
   * Rotate the anonymous ID called after successful user liinking
   * This ensures the next user on this device starts fresh.
   */
  static async rotateAnonymousId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ANONYMOUS_ID_KEY);
      await this.getAnonymousId(); // Generate new one immediately
      console.log('Rotated anonymous ID');
    } catch (error) {
      console.error('Failed to rotate anonymous ID:', error);
    }
  }

  /**
   * Check if online.
   * Note: Actual network checking should be passed in or handled by caller/NetInfo.
   * For now we assume online unless specified.
   */

  /**
   * Store quiz results locally (Offline Fallback)
   * This is only used if immediate submission fails.
   */
  static async storePendingQuizResults(
    quizData: QuizSubmissionRequest,
  ): Promise<void> {
    try {
      const quizJson = JSON.stringify(quizData);
      await AsyncStorage.setItem(this.STORAGE_KEY, quizJson);

      if (__DEV__) {
        console.log('Quiz results stored temporarily:', {
          answerCount: quizData.answers.length,
          archetype: quizData.archetypeResult.name,
          completedAt: quizData.completedAt,
        });
      }
    } catch (error) {
      console.error('Failed to store pending quiz results:', error);
      throw new Error('Unable to save quiz results temporarily');
    }
  }

  /**
   * Get stored pending quiz results
   */
  static async getPendingQuizResults(): Promise<QuizSubmissionRequest | null> {
    try {
      const quizJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!quizJson) {
        return null;
      }

      const quizData: QuizSubmissionRequest = JSON.parse(quizJson);

      if (__DEV__) {
        console.log('Retrieved pending quiz results:', {
          answerCount: quizData.answers.length,
          archetype: quizData.archetypeResult.name,
        });
      }

      return quizData;
    } catch (error) {
      console.error('Failed to retrieve pending quiz results:', error);
      return null;
    }
  }

  /**
   * Submit pending quiz results to the backend and clear from storage
   */
  /**
   * Submit quiz results immediately for an anonymous user
   * If network fails, it queues the data for later retry.
   */
  static async submitAnonymousQuiz(
    quizData: QuizSubmissionRequest,
  ): Promise<boolean> {
    try {
      // 1. Ensure we have an anonymous ID
      if (!quizData.anonymousId) {
        quizData.anonymousId = await this.getAnonymousId();
      }

      // 2. Try to submit immediately to backend
      try {
        if (__DEV__) {
          console.log('\n🔵 ===================================================');
          console.log(`🔵 [MIRROR_DEBUG] Attempting immediate anonymous submission`);
          console.log(`🔵 [MIRROR_DEBUG] ID: ${quizData.anonymousId}`);
          console.log('🔵 ===================================================\n');
        }
        await quizApiService.submitQuizResults(quizData);
        
        // Success! Store the quiz data locally so we can show the result on app relaunch
        // AND set the submission flag so we know it was successfully submitted
        await this.storePendingQuizResults(quizData);
        await AsyncStorage.setItem(this.SUBMISSION_TRACKER_KEY, 'true');
        
        if (__DEV__) {
          console.log('\n🟢 ===================================================');
          console.log('🟢 [MIRROR_DEBUG] Immediate anonymous submission SUCCESS!');
          console.log('🟢 ===================================================\n');
        }
        return true;

      } catch (apiError: any) {
        console.warn('\n🔴 ===================================================');
        console.warn('🔴 [MIRROR_DEBUG] Immediate submission FAILED');
        console.warn('🔴 [MIRROR_DEBUG] Error:', apiError);
        console.warn('🔴 [MIRROR_DEBUG] Queuing for offline retry...');
        console.warn('🔴 ===================================================\n');
        
        // 3. Network failed? Save to offline queue (Pending Results)
        await this.storePendingQuizResults(quizData);
        return false;
      }
    } catch (error) {
      console.error('Critical error in submitAnonymousQuiz:', error);
      return false;
    }
  }

  /**
   * Retry submitting any pending/offline quiz results
   * Called on app launch, network connect, or registration
   */
  static async retryPendingSubmissions(): Promise<void> {
    try {
      const pendingQuiz = await this.getPendingQuizResults();
      if (!pendingQuiz) return; // Nothing to send

      // Check if already submitted successfully to avoid duplicates
      const submittedFlag = await AsyncStorage.getItem(this.SUBMISSION_TRACKER_KEY);
      if (submittedFlag === 'true') {
        if (__DEV__) {
          console.log('Quiz results already successfully submitted to server. Skipping redundant retry.');
        }
        return;
      }

      if (__DEV__) {
        console.log('Retrying pending quiz submission...');
      }

      // Reuse the logic - if we have data, try to send it
      await this.submitAnonymousQuiz(pendingQuiz);

    } catch (error) {
      console.error('Failed to retry pending submissions:', error);
    }
  }

  /**
   * Clear pending quiz results from storage
   */
  static async clearPendingQuizResults(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEY),
        AsyncStorage.removeItem(this.SUBMISSION_TRACKER_KEY),
      ]);

      if (__DEV__) {
        console.log('Pending quiz results cleared from storage');
      }
    } catch (error) {
      console.error('Failed to clear pending quiz results:', error);
    }
  }

  /**
   * Mark the account as ready (linked) on this device
   */
  static async markAccountReady(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACCOUNT_READY_KEY, 'true');
      if (__DEV__) {
        console.log('Account marked as ready on this device');
      }
    } catch (error) {
      console.error('Failed to mark account ready:', error);
    }
  }

  /**
   * Check if there are pending quiz results
   */
  static async hasPendingQuizResults(): Promise<boolean> {
    try {
      const quizJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      return quizJson !== null;
    } catch (error) {
      console.error('Failed to check for pending quiz results:', error);
      return false;
    }
  }

  /**
   * Check if user has completed the quiz (either submitted or pending)
   */
  static async hasCompletedQuiz(): Promise<boolean> {
    try {
      // Check if quiz was submitted successfully
      const submittedFlag = await AsyncStorage.getItem(this.SUBMISSION_TRACKER_KEY);
      if (submittedFlag === 'true') {
        return true;
      }
      
      // Check if there are pending results (offline queue)
      const hasPending = await this.hasPendingQuizResults();
      if (hasPending) return true;

      // Check if account is already marked as ready (linked)
      const accountReady = await AsyncStorage.getItem(this.ACCOUNT_READY_KEY);
      return accountReady === 'true';
    } catch (error) {
      console.error('Failed to check quiz completion:', error);
      return false;
    }
  }

  /**
   * Reset quiz state - useful when user takes a new quiz
   */
  static async resetQuizState(): Promise<void> {
    try {
      await this.clearPendingQuizResults();

      if (__DEV__) {
        console.log('Quiz state reset successfully');
      }
    } catch (error) {
      console.error('Failed to reset quiz state:', error);
    }
  }

  /**
   * DEV ONLY: Completely reset all quiz data including anonymous ID
   */
  static async resetEverything(): Promise<void> {
    try {
      await Promise.all([
        this.clearPendingQuizResults(),
        AsyncStorage.removeItem(this.ANONYMOUS_ID_KEY),
        AsyncStorage.removeItem(this.SUBMISSION_TRACKER_KEY),
        AsyncStorage.removeItem(this.OFFLINE_QUEUE_KEY),
        AsyncStorage.removeItem(this.ACCOUNT_READY_KEY),
      ]);
      console.log('DEV: Reset everything successfully');
    } catch (error) {
      console.error('Failed to reset everything:', error);
    }
  }
}

export { QuizStorageService };
