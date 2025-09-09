import { BaseApiService } from './base';
import { API_CONFIG } from '../../constants/config';
import { ApiErrorHandler } from './errorHandler';
import type {
  ApiResponse,
  QuizSubmissionRequest,
  QuizSubmissionResponse,
} from '../../types';

export class QuizApiService extends BaseApiService {
  /**
   * Submit archetype quiz results after user completes quiz
   */
  async submitQuizResults(
    request: QuizSubmissionRequest,
  ): Promise<ApiResponse<QuizSubmissionResponse>> {
    const response = await this.makeRequest<QuizSubmissionResponse>(
      API_CONFIG.ENDPOINTS.QUIZ.SUBMIT,
      'POST',
      request,
      true, // Requires authentication
    );

    return ApiErrorHandler.handleApiResponse<QuizSubmissionResponse>(
      response,
      'Quiz results submitted successfully',
      'QuizSubmissionError',
    );
  }
}

export const quizApiService = new QuizApiService();
