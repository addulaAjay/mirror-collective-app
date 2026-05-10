/**
 * Tests for Cognito error detection helpers.
 */

import {
  isUserNotConfirmedError,
  isUsernameExistsError,
} from './cognitoErrors';

describe('cognitoErrors', () => {
  describe('isUserNotConfirmedError', () => {
    it.each([
      { name: 'UserNotConfirmedException', message: '' },
      { name: 'usernotconfirmedexception', message: '' },
      { code: 'UserNotConfirmedException' },
      { message: 'User is not confirmed.' },
      { message: 'User not confirmed' },
      { message: 'Email is not verified' },
    ])('matches %p', input => {
      expect(isUserNotConfirmedError(input)).toBe(true);
    });

    it.each([
      null,
      undefined,
      'string',
      {},
      { name: 'OtherException', message: 'something else' },
      { message: 'Network error' },
    ])('does not match %p', input => {
      expect(isUserNotConfirmedError(input as unknown)).toBe(false);
    });
  });

  describe('isUsernameExistsError', () => {
    it.each([
      { name: 'UsernameExistsException' },
      { code: 'UsernameExistsException' },
      { message: 'User already exists' },
      { message: 'An account with the given email already exists' },
      { message: 'An account with this email already exists.' },
      { message: 'Email already exists in our system' },
    ])('matches %p', input => {
      expect(isUsernameExistsError(input)).toBe(true);
    });

    it.each([
      null,
      undefined,
      {},
      { message: 'Invalid password' },
    ])('does not match %p', input => {
      expect(isUsernameExistsError(input as unknown)).toBe(false);
    });
  });
});
