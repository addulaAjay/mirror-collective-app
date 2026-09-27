/**
 * Password validation shared by the Sign Up and Reset Password flows.
 *
 * The rules mirror the Cognito user-pool password policy (min length + one of
 * each character class). Kept in one place so the UI can tell the user EXACTLY
 * which requirement is unmet instead of a vague "make it stronger" hint — the
 * previous message only mentioned symbols/numbers and never the upper/lower
 * case requirement, which left users guessing.
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Identifiers for each password requirement. Each maps to an i18n string
 * under `auth.validation.passwordRequirements.<key>`. */
export type PasswordRequirementKey =
  | 'minLength'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'special';

/**
 * Return the requirements the given password does NOT satisfy, in a stable,
 * display-friendly order (length first, then character classes). An empty array
 * means the password is valid.
 *
 * "special character" is any non-alphanumeric character, matching Cognito's
 * symbol set (which includes space and a broad range of punctuation).
 */
export function getUnmetPasswordRequirements(
  password: string,
): PasswordRequirementKey[] {
  const unmet: PasswordRequirementKey[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    unmet.push('minLength');
  }
  if (!/[A-Z]/.test(password)) {
    unmet.push('uppercase');
  }
  if (!/[a-z]/.test(password)) {
    unmet.push('lowercase');
  }
  if (!/\d/.test(password)) {
    unmet.push('number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    unmet.push('special');
  }
  return unmet;
}

/** True when the password satisfies every requirement. */
export function isPasswordValid(password: string): boolean {
  return getUnmetPasswordRequirements(password).length === 0;
}

/** Minimal shape of the i18next `t` function this util needs. Declared locally
 * to keep the util framework-agnostic and unit-testable without i18n. */
export type TranslateFn = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/**
 * Build a user-facing error naming exactly the unmet requirements, e.g.
 * "Password must include an uppercase letter and a number." Pulls the wording
 * (and list punctuation) from i18n so it localizes with the rest of the app.
 */
export function buildPasswordError(
  unmet: PasswordRequirementKey[],
  t: TranslateFn,
): string {
  const parts = unmet.map(key =>
    t(`auth.validation.passwordRequirements.${key}`),
  );
  const requirements =
    parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(t('auth.validation.passwordListSeparator')) +
        t('auth.validation.passwordListAnd') +
        parts[parts.length - 1];
  return t('auth.validation.passwordNeeds', { requirements });
}
