import { decodeJwtPayload, getUsernameFromToken } from './jwt';

/** Build a JWT-shaped string (header.payload.signature) from a claims object. */
function makeToken(payload: Record<string, unknown>): string {
  const enc = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/[=]/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc(payload)}.signature`;
}

describe('getUsernameFromToken', () => {
  it('reads the `username` claim from an access token', () => {
    const token = makeToken({ username: 'user@example.com', sub: 'abc' });
    expect(getUsernameFromToken(token)).toBe('user@example.com');
  });

  it('falls back to `cognito:username` (id token)', () => {
    const token = makeToken({ 'cognito:username': 'user@example.com' });
    expect(getUsernameFromToken(token)).toBe('user@example.com');
  });

  it('decodes even when the token is expired (no signature/expiry check)', () => {
    const token = makeToken({ username: 'u@e.com', exp: 1 });
    expect(getUsernameFromToken(token)).toBe('u@e.com');
  });

  it('tolerates non-ASCII values in other claims', () => {
    const token = makeToken({ username: 'jose@example.com', name: 'José' });
    expect(getUsernameFromToken(token)).toBe('jose@example.com');
  });

  it.each([null, undefined, '', 'not-a-jwt', 'only.two'])(
    'returns null for invalid token: %p',
    input => {
      expect(getUsernameFromToken(input as string)).toBeNull();
    },
  );

  it('returns null when no username claim is present', () => {
    expect(getUsernameFromToken(makeToken({ sub: 'abc' }))).toBeNull();
  });

  it('returns null for an empty username claim', () => {
    expect(getUsernameFromToken(makeToken({ username: '' }))).toBeNull();
  });

  it('returns null when the payload is not valid base64/JSON', () => {
    expect(getUsernameFromToken('header.%%%notbase64%%%.sig')).toBeNull();
  });
});

describe('decodeJwtPayload', () => {
  it('returns the full claims object', () => {
    const token = makeToken({ username: 'u', sub: 's', exp: 123 });
    expect(decodeJwtPayload(token)).toEqual({ username: 'u', sub: 's', exp: 123 });
  });

  it('returns null for malformed input', () => {
    expect(decodeJwtPayload('garbage')).toBeNull();
  });
});
