import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizStorageService } from './quizStorageService';
import { quizApiService } from './api';

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
  archetypeResult: { id: 'seeker', name: 'Seeker', title: 'The Seeker' },
  quizVersion: '1.0',
};

describe('QuizStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('submitPendingQuizResults', () => {
    it('skips submission if already submitted', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

      const result = await QuizStorageService.submitPendingQuizResults();

      expect(result).toBe(true);
      expect(quizApiService.submitQuizResults).not.toHaveBeenCalled();
    });

    it('returns true if no pending results', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null) // submission tracker
        .mockResolvedValueOnce(null); // pending quiz

      const result = await QuizStorageService.submitPendingQuizResults();

      expect(result).toBe(true);
    });

    it('submits and clears on success', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null) // submission tracker
        .mockResolvedValueOnce(JSON.stringify(mockQuizData)); // pending quiz
      (quizApiService.submitQuizResults as jest.Mock).mockResolvedValueOnce({});

      const result = await QuizStorageService.submitPendingQuizResults();

      expect(result).toBe(true);
      expect(quizApiService.submitQuizResults).toHaveBeenCalledWith(mockQuizData);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('QUIZ_SUBMITTED_FLAG', 'true');
    });

    it('returns false on submission failure', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(mockQuizData));
      (quizApiService.submitQuizResults as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await QuizStorageService.submitPendingQuizResults();

      expect(result).toBe(false);
    });
  });
});
