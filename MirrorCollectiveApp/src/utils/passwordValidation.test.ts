import {
  getUnmetPasswordRequirements,
  isPasswordValid,
  PASSWORD_MIN_LENGTH,
} from './passwordValidation';

describe('getUnmetPasswordRequirements', () => {
  it('returns [] for a password that meets every rule', () => {
    expect(getUnmetPasswordRequirements('Str0ng!pass')).toEqual([]);
  });

  it('flags a missing uppercase letter (the case that confused users)', () => {
    // Has lowercase, number and special char — but no uppercase. The old
    // message only mentioned "symbols or numbers", so this failure was opaque.
    expect(getUnmetPasswordRequirements('str0ng!pass')).toEqual(['uppercase']);
  });

  it('flags a missing lowercase letter', () => {
    expect(getUnmetPasswordRequirements('STR0NG!PASS')).toEqual(['lowercase']);
  });

  it('flags a missing number', () => {
    expect(getUnmetPasswordRequirements('Strong!pass')).toEqual(['number']);
  });

  it('flags a missing special character', () => {
    expect(getUnmetPasswordRequirements('Str0ngpass')).toEqual(['special']);
  });

  it('flags too-short passwords first, then the missing classes', () => {
    expect(getUnmetPasswordRequirements('aB1!')).toEqual(['minLength']);
    expect(getUnmetPasswordRequirements('ab')).toEqual([
      'minLength',
      'uppercase',
      'number',
      'special',
    ]);
  });

  it('accepts a space as a special character (matches Cognito)', () => {
    expect(getUnmetPasswordRequirements('Str0ng pass')).toEqual([]);
  });

  it('requires at least PASSWORD_MIN_LENGTH characters', () => {
    const short = 'Ab1!'.padEnd(PASSWORD_MIN_LENGTH - 1, 'x');
    expect(getUnmetPasswordRequirements(short)).toContain('minLength');
  });
});

describe('isPasswordValid', () => {
  it('is true only when nothing is unmet', () => {
    expect(isPasswordValid('Str0ng!pass')).toBe(true);
    expect(isPasswordValid('weak')).toBe(false);
  });
});
