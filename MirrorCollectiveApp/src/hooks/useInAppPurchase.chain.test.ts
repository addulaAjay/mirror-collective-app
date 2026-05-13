/**
 * Tests for the sequential-sheets helper that drives the paywall
 * Basic + optional storage flow (pricing spec 2026-05-12 §8).
 *
 * The five outcomes from the helper's `storageOutcome` field map to
 * five real user paths through the paywall — pin them so a future
 * refactor can't silently drop one:
 *
 *   skipped_basic_failed  user cancelled Basic sheet
 *   not_requested         toggle off
 *   unavailable           toggle on, storage product still loading
 *   cancelled             toggle on, user backed out of storage sheet
 *   completed             both sheets succeeded
 */

import { purchaseBasicWithOptionalStorage } from './useInAppPurchase.chain';

const BASIC_SKU = 'com.themirrorcollective.mirror.core.monthly';
const STORAGE_SKU = 'com.themirrorcollective.mirror.storage.monthly';

function makeStubs(
  /**
   * Outcomes for sequential `purchaseSubscription` calls. The helper
   * calls Basic first, then (sometimes) Storage. A two-element array
   * covers both; if Storage isn't reached we'll just have a leftover
   * unused stub.
   */
  purchaseResults: boolean[],
) {
  const purchaseSubscription = jest.fn<Promise<boolean>, [string]>();
  // Configure each call to resolve with the next value in the queue.
  purchaseResults.forEach(result => {
    purchaseSubscription.mockResolvedValueOnce(result);
  });
  // Defensive fallback so an unexpected extra call doesn't hang.
  purchaseSubscription.mockResolvedValue(false);

  const refreshSubscriptionStatus = jest.fn<Promise<void>, []>()
    .mockResolvedValue(undefined);
  const showToast = jest.fn();

  return { purchaseSubscription, refreshSubscriptionStatus, showToast };
}

describe('purchaseBasicWithOptionalStorage', () => {
  it('returns skipped_basic_failed when the Basic sheet is cancelled', async () => {
    const stubs = makeStubs([false]);
    const result = await purchaseBasicWithOptionalStorage({
      basicSku: BASIC_SKU,
      storageSku: STORAGE_SKU,
      addStorage: true, // toggle was on but Basic didn't succeed
      storageProductAvailable: true,
      ...stubs,
    });

    expect(result).toEqual({
      basicPurchased: false,
      storagePurchased: false,
      storageOutcome: 'skipped_basic_failed',
    });
    // Storage sheet must NOT be attempted if Basic was cancelled.
    expect(stubs.purchaseSubscription).toHaveBeenCalledTimes(1);
    expect(stubs.purchaseSubscription).toHaveBeenCalledWith(BASIC_SKU);
    // Cancellation should be silent — no toast.
    expect(stubs.showToast).not.toHaveBeenCalled();
  });

  it('returns not_requested when Basic succeeds and the toggle is off', async () => {
    const stubs = makeStubs([true]);
    const result = await purchaseBasicWithOptionalStorage({
      basicSku: BASIC_SKU,
      storageSku: STORAGE_SKU,
      addStorage: false,
      storageProductAvailable: true,
      ...stubs,
    });

    expect(result.basicPurchased).toBe(true);
    expect(result.storagePurchased).toBe(false);
    expect(result.storageOutcome).toBe('not_requested');
    expect(stubs.purchaseSubscription).toHaveBeenCalledTimes(1);
    expect(stubs.showToast).not.toHaveBeenCalled();
  });

  it('returns unavailable + toasts when storage product is still loading', async () => {
    const stubs = makeStubs([true]);
    const result = await purchaseBasicWithOptionalStorage({
      basicSku: BASIC_SKU,
      storageSku: STORAGE_SKU,
      addStorage: true,
      storageProductAvailable: false, // <-- race: product not loaded
      ...stubs,
    });

    expect(result.basicPurchased).toBe(true);
    expect(result.storagePurchased).toBe(false);
    expect(result.storageOutcome).toBe('unavailable');
    // The storage sheet wasn't requested at all.
    expect(stubs.purchaseSubscription).toHaveBeenCalledTimes(1);
    expect(stubs.purchaseSubscription).toHaveBeenCalledWith(BASIC_SKU);
    // User's intent shouldn't be dropped silently — point them at the
    // contextual upsell.
    expect(stubs.showToast).toHaveBeenCalledTimes(1);
    expect(stubs.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'info',
        message: expect.stringContaining('Echo Vault'),
      }),
    );
  });

  it('returns cancelled + toasts when storage sheet is backed out of', async () => {
    const stubs = makeStubs([true, false]);
    const result = await purchaseBasicWithOptionalStorage({
      basicSku: BASIC_SKU,
      storageSku: STORAGE_SKU,
      addStorage: true,
      storageProductAvailable: true,
      ...stubs,
    });

    expect(result.basicPurchased).toBe(true);
    expect(result.storagePurchased).toBe(false);
    expect(result.storageOutcome).toBe('cancelled');
    // Both sheets were attempted in the right order.
    expect(stubs.purchaseSubscription).toHaveBeenCalledTimes(2);
    expect(stubs.purchaseSubscription).toHaveBeenNthCalledWith(1, BASIC_SKU);
    expect(stubs.purchaseSubscription).toHaveBeenNthCalledWith(2, STORAGE_SKU);
    expect(stubs.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'info',
        message: expect.stringContaining('Echo Vault'),
      }),
    );
  });

  it('returns completed when both sheets succeed', async () => {
    const stubs = makeStubs([true, true]);
    const result = await purchaseBasicWithOptionalStorage({
      basicSku: BASIC_SKU,
      storageSku: STORAGE_SKU,
      addStorage: true,
      storageProductAvailable: true,
      ...stubs,
    });

    expect(result).toEqual({
      basicPurchased: true,
      storagePurchased: true,
      storageOutcome: 'completed',
    });
    expect(stubs.purchaseSubscription).toHaveBeenCalledTimes(2);
    // refreshSubscriptionStatus is called after each successful purchase.
    expect(stubs.refreshSubscriptionStatus).toHaveBeenCalledTimes(2);
    // No toast on the success path — the user just bought what they
    // intended, no nudge needed.
    expect(stubs.showToast).not.toHaveBeenCalled();
  });

  it('refreshes subscription status after Basic even when cancelled', async () => {
    // Belt-and-braces: even on cancel the helper should sync state so
    // the UI doesn't show stale entitlement.
    const stubs = makeStubs([false]);
    await purchaseBasicWithOptionalStorage({
      basicSku: BASIC_SKU,
      storageSku: STORAGE_SKU,
      addStorage: false,
      storageProductAvailable: true,
      ...stubs,
    });
    expect(stubs.refreshSubscriptionStatus).toHaveBeenCalledTimes(1);
  });
});
