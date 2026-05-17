/**
 * Lightweight UUID v4 generator.
 *
 * Used as the value of the `Idempotency-Key` header on POSTs that
 * support server-side dedup (today: create-echo and finalize-media).
 * The whole point of a key is that it stays the same across retries
 * — which is why this lives at the service layer, where the same
 * value can survive the BaseApiService 429 retry-with-backoff loop
 * without callers having to thread it themselves.
 *
 * We avoid pulling a uuid lib for this one use: native-side `crypto`
 * isn't reliably present on React Native, and the math-random fallback
 * is sufficient here — UUID collisions across simultaneous requests
 * by the SAME user are vanishingly unlikely at the rates this app
 * operates at, and a collision would harmlessly hit the server's
 * idempotency cache (returning the prior response) rather than cause
 * data loss.
 */
export function uuidV4(): string {
  // Variant template — 8 hex chars / 4 / 4 / 4 / 12. The 13th hex digit
  // is forced to '4' (UUID version), and the 17th to one of 8/9/a/b
  // (RFC 4122 variant bits).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
