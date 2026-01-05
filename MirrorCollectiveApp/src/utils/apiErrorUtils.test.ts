import { getApiErrorMessage } from './apiErrorUtils';

describe('getApiErrorMessage', () => {
  // Mock translation function
  const t = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'apiErrors.AuthenticationError': 'Auth failed',
      'apiErrors.NetworkError': 'Network issue',
      'apiErrors.TimeoutError': 'Request timed out',
      'apiErrors.UnknownError': 'Something went wrong',
    };
    return translations[key] || '';
  }) as any;

  it('resolves specific ApiErrorType translation', () => {
    const error = { error: 'AuthenticationError' };
    const result = getApiErrorMessage(error, t);
    expect(result).toBe('Auth failed');
  });

  it('falls back to server message if translation missing for error type', () => {
    const error = { error: 'NewUnknownErrorCode', message: 'Server specific details' };
    // t('apiErrors.NewUnknownErrorCode') will return '' (falsy) by default in our mock
    const result = getApiErrorMessage(error, t);
    expect(result).toBe('Server specific details');
  });

  it('handles Error objects identifying Network errors', () => {
    const error = new Error('Network request failed');
    const result = getApiErrorMessage(error, t);
    expect(result).toBe('Network issue');
  });

  it('handles Error objects identifying Timeout errors', () => {
    const error = new Error('The request timeout');
    const result = getApiErrorMessage(error, t);
    expect(result).toBe('Request timed out');
  });

  it('returns explicit server message if present (and no error type matched)', () => {
    const error = { message: 'Custom validation error' };
    const result = getApiErrorMessage(error, t);
    expect(result).toBe('Custom validation error');
  });

  it('falls back to UnknownError if nothing else matches', () => {
    const error = { someOtherField: 123 };
    const result = getApiErrorMessage(error, t);
    expect(result).toBe('Something went wrong');
  });

  it('handles generic Error objects without special keywords', () => {
    const error = new Error('Some random crash');
    const result = getApiErrorMessage(error, t);
    expect(result).toBe('Some random crash');
  });
});
