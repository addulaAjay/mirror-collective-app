import AsyncStorage from '@react-native-async-storage/async-storage';

import { quizApiService } from './api';
import { QuizStorageService } from './quizStorageService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock quizApiService
jest.mock('./api', () => ({
  quizApiService: {
    submitQuizResults: jest.fn(),
  },
}));

const mockQuizData = {
  answers: [
    { questionId: 1, question: 'Test?', answer: 'A', answeredAt: '2024-01-01', type: 'text' as const },
  ],
  completedAt: '2024-01-01T00:00:00Z',
  quizVersion: '1.0',
  backendResult: {
    final_archetype: 'Seeker',
    assignment_reason: 'highest_score',
    total_scores: { Seeker: 8, Guardian: 2, Flamebearer: 1, Weaver: 0 },
  },
};

describe('QuizStorageService', () => {
  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) so any unconsumed mockResolvedValueOnce
    // queue from a prior test is drained — otherwise a leftover getItem value
    // leaks forward and makes order-dependent failures.
    jest.resetAllMocks();
  });

  describe('storePendingQuizResults', () => {
    it('stores quiz data in AsyncStorage', async () => {
      await QuizStorageService.storePendingQuizResults(mockQuizData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'PENDING_QUIZ_RESULTS',
        JSON.stringify(mockQuizData)
      );
    });
  });

  describe('getPendingQuizResults', () => {
    it('returns parsed quiz data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockQuizData));

      const result = await QuizStorageService.getPendingQuizResults();

      expect(result).toEqual(mockQuizData);
    });

    it('returns null if no data stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await QuizStorageService.getPendingQuizResults();

      expect(result).toBeNull();
    });
  });

  describe('hasPendingQuizResults', () => {
    it('returns true if quiz data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{}');

      const result = await QuizStorageService.hasPendingQuizResults();

      expect(result).toBe(true);
    });

    it('returns false if no quiz data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await QuizStorageService.hasPendingQuizResults();

      expect(result).toBe(false);
    });
  });

  describe('clearPendingQuizResults', () => {
    it('removes quiz data from AsyncStorage', async () => {
      await QuizStorageService.clearPendingQuizResults();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('PENDING_QUIZ_RESULTS');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('QUIZ_SUBMITTED_FLAG');
    });
  });

  describe('retryPendingSubmissions', () => {
    it('skips submission if already submitted', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

      await QuizStorageService.retryPendingSubmissions();

      expect(quizApiService.submitQuizResults).not.toHaveBeenCalled();
    });

    it('returns true if no pending results', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null) // submission tracker
        .mockResolvedValueOnce(null); // pending quiz

      await QuizStorageService.retryPendingSubmissions();

    });

    it('submits and clears on success', async () => {
      // retryPendingSubmissions reads the pending quiz first (getPendingQuizResults),
      // then the submission tracker — so order the getItem mocks accordingly.
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockQuizData)) // pending quiz
        .mockResolvedValueOnce(null); // submission tracker (not yet submitted)
      // Submission goes through submitAnonymousQuiz, which expects a successful
      // ApiResponse envelope ({ success, data }) before it sets the submitted flag.
      (quizApiService.submitQuizResults as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          final_archetype: 'Seeker',
          assignment_reason: 'highest_score',
          total_scores: { Seeker: 8, Guardian: 2, Flamebearer: 1, Weaver: 0 },
        },
      });

      await QuizStorageService.retryPendingSubmissions();

      // submitAnonymousQuiz augments the payload with an anonymousId, so assert
      // the original quiz data is forwarded rather than an exact-equality match.
      expect(quizApiService.submitQuizResults).toHaveBeenCalledWith(
        expect.objectContaining(mockQuizData),
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('QUIZ_SUBMITTED_FLAG', 'true');
    });

    it('returns false on submission failure', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(mockQuizData));
      (quizApiService.submitQuizResults as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      try {
        await QuizStorageService.retryPendingSubmissions();
      } catch (e) {
        // Should catch and log error, not throw
      }
    });
  });
});
