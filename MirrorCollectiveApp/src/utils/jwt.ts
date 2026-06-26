/**
 * Minimal, dependency-free JWT claim reader.
 *
 * This intentionally does NOT verify the signature or expiry — it only decodes
 * the payload to read a claim. The single use case is extracting the Cognito
 * `username` so it can be sent to the token-refresh endpoint, where the backend
 * needs it to compute Cognito's SECRET_HASH (the app client has a secret).
 *
 * The username is non-sensitive routing data, never a credential: the refresh
 * token remains the validated credential, and a wrong/missing username only
 * results in Cognito rejecting the refresh.
 */

/** Decode a base64url segment to a UTF-8 string. */
function decodeBase64UrlToUtf8(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);

  // atob exists on Hermes (RN 0.74+) and in Node 16+ (Jest). Fall back to
  // Buffer where available (Node) for robustness.
  let binary: string;
  if (typeof atob === 'function') {
    binary = atob(padded);
  } else if (typeof Buffer !== 'undefined') {
    binary = Buffer.from(padded, 'base64').toString('binary');
  } else {
    throw new Error('No base64 decoder available');
  }

  // Promote the binary string to UTF-8 so multi-byte claim values decode
  // correctly (usernames are ASCII, but other claims may not be).
  const percentEncoded = binary
    .split('')
    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
    .join('');
  return decodeURIComponent(percentEncoded);
}

/** Parse a JWT payload into a claims object, or null if it can't be read. */
export function decodeJwtPayload(
  token: string | null | undefined,
): Record<string, unknown> | null {
  if (!token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    return JSON.parse(decodeBase64UrlToUtf8(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extract the Cognito username from an access or id token. Prefers the
 * `username` claim (access token) and falls back to `cognito:username`
 * (id token). Returns null if the token is missing/malformed or the claim
 * is absent.
 */
export function getUsernameFromToken(
  token: string | null | undefined,
): string | null {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return null;
  }
  const username = claims.username ?? claims['cognito:username'];
  return typeof username === 'string' && username.length > 0 ? username : null;
}
