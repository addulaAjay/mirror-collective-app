import type { ApiResponse } from '@types';

export type ApiErrorType =
  | 'AuthenticationError'
  | 'SignUpError'
  | 'VerificationError'
  | 'ForgotPasswordError'
  | 'ResetPasswordError'
  | 'RefreshTokenError'
  | 'SignOutError'
  | 'NetworkError'
  | 'TimeoutError'
  | 'ServerError'
  | 'ValidationError'
  | 'QuizSubmissionError'
  | 'SessionError'
  | 'ChatError'
  | 'UnknownError';

export interface ErrorContext {
  endpoint?: string;
  method?: string;
  statusCode?: number;
  originalError?: any;
}

export class ApiErrorHandler {
  /**
   * Centralized method to handle API response errors
   */
  static handleApiResponse<T>(
    response: any,
    successMessage: string,
    errorType: ApiErrorType = 'UnknownError',
  ): ApiResponse<T> {
    // Handle API failure responses (when server returns success: false)
    if (response && response.success === false) {
      return {
        success: false,
        data: undefined,
        message: response.message || this.getDefaultErrorMessage(errorType),
        error: response.error || errorType,
      };
    }

    // Handle successful responses
    return {
      success: true,
      data: response.data as T,
      message: response?.message || successMessage,
      error: undefined,
    };
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse<T>(
    message: string,
    errorType: ApiErrorType = 'UnknownError',
    _context?: ErrorContext,
  ): ApiResponse<T> {
    return {
      success: false,
      data: undefined,
      message: message,
      error: errorType,
    };
  }

  /**
   * Create a standardized success response
   */
  static createSuccessResponse<T>(data: T, message: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      error: undefined,
    };
  }

  /**
   * Handle network and system errors
   */
  static handleSystemError(
    error: any,
    context?: ErrorContext,
  ): ApiResponse<any> {
    console.error('API Error:', error, context);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        return this.createErrorResponse(
          'Request timeout. Please try again.',
          'TimeoutError',
          context,
        );
      }

      if (
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch')
      ) {
        return this.createErrorResponse(
          'Network error. Please check your connection.',
          'NetworkError',
          context,
        );
      }

      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        return this.createErrorResponse(
          'Invalid server response.',
          'ServerError',
          context,
        );
      }
    }

    return this.createErrorResponse(
      'An unexpected error occurred. Please try again.',
      'UnknownError',
      context,
    );
  }

  /**
   * Get default error messages for different error types
   */
  private static getDefaultErrorMessage(errorType: ApiErrorType): string {
    const errorMessages: Record<ApiErrorType, string> = {
      AuthenticationError:
        'Authentication failed. Please check your credentials.',
      SignUpError: 'Sign up failed. Please try again.',
      VerificationError:
        'Email verification failed. Please check your verification code.',
      ForgotPasswordError: 'Failed to send reset email. Please try again.',
      ResetPasswordError: 'Password reset failed. Please try again.',
      RefreshTokenError: 'Session expired. Please log in again.',
      SignOutError: 'Sign out failed. Please try again.',
      NetworkError: 'Network error. Please check your connection.',
      TimeoutError: 'Request timeout. Please try again.',
      ServerError: 'Server error. Please try again later.',
      ValidationError: 'Invalid input. Please check your data.',
      QuizSubmissionError: 'Failed to submit quiz results. Please try again.',
      SessionError: 'Session error. Please try again.',
      ChatError: 'Chat error. Please try again.',
      UnknownError: 'An unexpected error occurred. Please try again.',
    };

    return errorMessages[errorType];
  }

  /**
   * Check if an error should be handled gracefully (not thrown)
   */
  static shouldHandleGracefully(
    endpoint: string,
    statusCode?: number,
  ): boolean {
    // Auth endpoints should return errors, not throw them
    if (endpoint.includes('/auth/')) {
      return true;
    }

    // Client errors (4xx) should be handled gracefully
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return true;
    }

    return false;
  }
}
