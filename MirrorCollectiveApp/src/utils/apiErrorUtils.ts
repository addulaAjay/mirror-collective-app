import type { ApiResponse } from '@types';
import type { TFunction } from 'i18next';

import type { ApiErrorType } from '@services/api/errorHandler';

/**
 * Resolves a translated error message from an API response or error object.
 * 
 * @param error The response object or error object
 * @param t The i18next translation function
 * @returns A translated string error message
 */
export const getApiErrorMessage = (
  response: ApiResponse<any> | any,
  t: TFunction
): string => {
  // 1. Handle explicit ApiResponses with an error type
  if (response && response.error) {
    const errorType = response.error as ApiErrorType;
    // Check if we have a translation for this specific error type
    const translationKey = `apiErrors.${errorType}`;
    
    // Use the translation if it exists, otherwise fall back to the backend message or unknown error
    if (t(translationKey, { defaultValue: '' })) {
      return t(translationKey);
    }
  }

  // 2. Handle generic system/network errors if they are passed directly
  if (response instanceof Error) {
    if (response.message.includes('Network') || response.message.includes('fetch')) {
      return t('apiErrors.NetworkError');
    }
    if (response.name === 'AbortError' || response.message.includes('timeout')) {
      return t('apiErrors.TimeoutError');
    }
  }

  // 3. Fallback to the message provided by the server (if any), or generic error
  return response?.message || t('apiErrors.UnknownError');
};
