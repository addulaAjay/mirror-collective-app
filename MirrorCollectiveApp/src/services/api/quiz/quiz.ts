import { API_CONFIG } from '@constants';
import type { QuizRequest, QuizResponse } from '@quiz-types';

import { BaseApiService } from '../base';

export class QuizApiService extends BaseApiService {
  async sendQuiz(request: QuizRequest): Promise<QuizResponse> {
    const response = await this.makeRequest<any>(
      API_CONFIG.ENDPOINTS.QUIZ.SUBMIT,
      'POST',
      request,
      true, // Requires authentication - Bearer token
    );

    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  }
}

export const quizApiService = new QuizApiService();