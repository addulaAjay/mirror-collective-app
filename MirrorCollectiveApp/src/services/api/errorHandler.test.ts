import { ApiErrorHandler } from './errorHandler';

describe('ApiErrorHandler.formatValidationErrors', () => {
  it('returns the single field message', () => {
    expect(
      ApiErrorHandler.formatValidationErrors([
        { field: 'password', message: 'Password must contain at least one special character' },
      ]),
    ).toBe('Password must contain at least one special character');
  });

  it('joins multiple distinct messages on separate lines', () => {
    expect(
      ApiErrorHandler.formatValidationErrors([
        { field: 'password', message: 'Password too weak' },
        { field: 'fullName', message: 'Name has invalid characters' },
      ]),
    ).toBe('Password too weak\nName has invalid characters');
  });

  it('de-duplicates repeated messages', () => {
    expect(
      ApiErrorHandler.formatValidationErrors([
        { field: 'a', message: 'Same problem' },
        { field: 'b', message: 'Same problem' },
      ]),
    ).toBe('Same problem');
  });

  it.each([undefined, null, [], 'nope', {}, [{ field: 'x' }], [{ message: '' }]])(
    'returns undefined for unusable input: %p',
    input => {
      expect(ApiErrorHandler.formatValidationErrors(input)).toBeUndefined();
    },
  );
});

describe('ApiErrorHandler.handleApiResponse', () => {
  it('surfaces the validation message instead of the generic envelope title', () => {
    const result = ApiErrorHandler.handleApiResponse(
      {
        success: false,
        error: 'Validation Error',
        message: 'One or more fields contain invalid data',
        validationErrors: [
          { field: 'password', message: 'Password must contain at least one special character' },
        ],
        statusCode: 422,
      },
      'Account created successfully',
      'SignUpError',
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe(
      'Password must contain at least one special character',
    );
    expect(result.validationErrors).toHaveLength(1);
    expect(result.statusCode).toBe(422);
  });

  it('falls back to error/message when there are no validation errors', () => {
    const result = ApiErrorHandler.handleApiResponse(
      { success: false, error: 'Server error', statusCode: 500 },
      'ok',
      'ServerError',
    );
    expect(result.message).toBe('Server error');
  });
});
