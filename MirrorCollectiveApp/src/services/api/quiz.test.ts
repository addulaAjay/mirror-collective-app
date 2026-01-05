import { QuizApiService } from './quiz';

// Mock fetch
global.fetch = jest.fn();

// Mock tokenManager
jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    getValidToken: jest.fn().mockResolvedValue('test-token'),
    getAuthHeaders: jest.fn().mockResolvedValue({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    }),
  },
}));

describe('QuizApiService', () => {
  let quizService: QuizApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    quizService = new QuizApiService();
  });

  describe('submitQuizResults', () => {
    it('submits quiz data to API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'quiz-123' } }),
      });

      const quizData = {
        answers: [{ questionId: 1, question: 'Test?', answer: 'A', answeredAt: '2024-01-01', type: 'text' as const }],
        completedAt: '2024-01-01T00:00:00Z',
        archetypeResult: { id: 'seeker', name: 'Seeker', title: 'The Seeker' },
        quizVersion: '1.0',
      };

      const result = await quizService.submitQuizResults(quizData);

      expect(global.fetch).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

  });
});
