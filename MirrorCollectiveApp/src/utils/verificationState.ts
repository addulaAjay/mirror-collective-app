/**
 * Pending email-verification state.
 *
 * Persists a small record after sign-up so the app can recover the user's
 * verification flow if they close the app between sign-up and verify.
 *
 * TTL: 1 hour (matches Cognito's verification-code expiry). Stale records
 * are treated as absent — we don't replay an expired code automatically;
 * the caller path triggers a resend.
 *
 * Password is intentionally NOT persisted. After a recovered verification
 * the user is routed to Login with their email pre-filled.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'PENDING_VERIFICATION';
const TTL_MS = 60 * 60 * 1000; // 1 hour

export interface PendingVerification {
  email: string;
  fullName: string | null;
  termsAcceptedAt: string | null;
  /** ISO 8601 set when sign-up resolved successfully. */
  createdAt: string;
}

/** Persist a pending-verification record. Existing records are overwritten. */
export async function setPendingVerification(
  data: Omit<PendingVerification, 'createdAt'>,
): Promise<void> {
  try {
    const record: PendingVerification = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Non-fatal: recovery path is a fallback, not a hard requirement.
  }
}

/**
 * Returns the persisted pending-verification record, or null if absent
 * or older than TTL_MS. Stale records are removed as a side-effect.
 */
export async function getPendingVerification(): Promise<PendingVerification | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as PendingVerification;
    if (!record?.email || !record?.createdAt) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const ageMs = Date.now() - new Date(record.createdAt).getTime();
    if (Number.isNaN(ageMs) || ageMs < 0 || ageMs > TTL_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export async function clearPendingVerification(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
