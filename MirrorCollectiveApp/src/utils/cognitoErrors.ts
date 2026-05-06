/**
 * Cognito error detection helpers.
 *
 * The auth pipeline (BaseApiService → ApiErrorHandler) flattens errors to
 * either a thrown { message, status } object OR a response with a `message`
 * field. We match by name/message substring (case-insensitive) since the
 * specific code may be exposed via either path.
 */

export interface ErrorLike {
  name?: string;
  code?: string;
  message?: string;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function lower(value: unknown): string {
  return asString(value).toLowerCase();
}

/** Cognito's UserNotConfirmedException — user signed up but never verified. */
export function isUserNotConfirmedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as ErrorLike;
  if (lower(e.name) === 'usernotconfirmedexception') return true;
  if (lower(e.code) === 'usernotconfirmedexception') return true;
  const msg = lower(e.message);
  return (
    msg.includes('user is not confirmed') ||
    msg.includes('user not confirmed') ||
    msg.includes('email is not verified')
  );
}

/** Cognito's UsernameExistsException — sign-up against an email already in use. */
export function isUsernameExistsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as ErrorLike;
  if (lower(e.name) === 'usernameexistsexception') return true;
  if (lower(e.code) === 'usernameexistsexception') return true;
  const msg = lower(e.message);
  return (
    msg.includes('user already exists') ||
    msg.includes('account with the given email already exists') ||
    msg.includes('an account with this email already exists') ||
    msg.includes('email already exists')
  );
}
