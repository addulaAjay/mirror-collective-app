import type {
  ApiResponse,
  QuizSubmissionRequest,
  QuizSubmissionResponse,
} from '@types';

import { API_CONFIG } from '@constants/config';

import { BaseApiService } from './base';
import { ApiErrorHandler } from './errorHandler';


export class QuizApiService extends BaseApiService {
  /**
   * Get dynamic quiz questions
   */
  async getQuestions(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(
      API_CONFIG.ENDPOINTS.QUIZ.QUESTIONS || '/quiz/questions', // Fallback if config definition missing
      'GET',
      undefined,
      false,
    );
  }

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
      false, // Allow anonymous submission
    );

    return ApiErrorHandler.handleApiResponse<QuizSubmissionResponse>(
      response,
      'Quiz results submitted successfully',
      'QuizSubmissionError',
    );
  }

  /**
   * Get authenticated user's quiz results (for cross-device sync)
   */
  async getMyQuizResults(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      '/api/mirrorgpt/quiz/results',
      'GET',
      undefined,
      true, // Requires authentication
    );
  }
}

export const quizApiService = new QuizApiService();
