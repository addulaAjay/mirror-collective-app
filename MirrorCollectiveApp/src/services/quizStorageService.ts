import AsyncStorage from '@react-native-async-storage/async-storage';
import { quizApiService } from './api';
import type { QuizSubmissionRequest } from '../types';

/**
 * Service to manage temporary quiz result storage before user registration
 */
class QuizStorageService {
  private static readonly STORAGE_KEY = 'PENDING_QUIZ_RESULTS';
  private static readonly SUBMISSION_TRACKER_KEY = 'QUIZ_SUBMITTED_FLAG';

  /**
   * Store quiz results temporarily until user registration is complete
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
  static async submitPendingQuizResults(): Promise<boolean> {
    try {
      // Check if quiz was already submitted to prevent duplicates
      const isSubmitted = await AsyncStorage.getItem(
        this.SUBMISSION_TRACKER_KEY,
      );
      if (isSubmitted === 'true') {
        if (__DEV__) {
          console.log('Quiz already submitted, skipping');
        }
        return true;
      }

      const pendingQuiz = await this.getPendingQuizResults();

      if (!pendingQuiz) {
        if (__DEV__) {
          console.log('No pending quiz results to submit');
        }
        return true; // No quiz to submit is considered success
      }

      // Submit to backend
      await quizApiService.submitQuizResults(pendingQuiz);

      // Mark as submitted to prevent duplicates
      await AsyncStorage.setItem(this.SUBMISSION_TRACKER_KEY, 'true');

      // Clear from storage after successful submission
      await this.clearPendingQuizResults();

      if (__DEV__) {
        console.log('Pending quiz results submitted and cleared successfully');
      }

      return true;
    } catch (error) {
      console.error('Failed to submit pending quiz results:', error);
      // Don't clear storage if submission failed - we can retry later
      return false;
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
}

export { QuizStorageService };
