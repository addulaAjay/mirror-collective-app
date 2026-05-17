/**
 * Tests for the pure helpers exported alongside the useInAppPurchase
 * hook. The hook itself is intentionally NOT exercised end-to-end here
 * — it integrates with the native react-native-iap module which would
 * require platform fixtures we don't currently have. The two helpers
 * (formatLocalizedPrice, hasIntroductoryOffer) are pure functions that
 * cover the iOS + Android shape differences and are worth testing on
 * their own.
 */

import {
  formatLocalizedPrice,
  hasIntroductoryOffer,
} from './useInAppPurchase.helpers';

describe('formatLocalizedPrice', () => {
  it('returns the fallback when sub is undefined', () => {
    expect(formatLocalizedPrice(undefined, '$1.99')).toBe('$1.99');
    expect(formatLocalizedPrice(undefined)).toBe('');
  });

  it('returns localizedPrice on iOS shape', () => {
    // Cast through unknown — the lib's Subscription union is the
    // intersection of platforms, so localizedPrice is on iOS only.
    const iosSub = { localizedPrice: '$15.99' } as unknown as Parameters<
      typeof formatLocalizedPrice
    >[0];
    expect(formatLocalizedPrice(iosSub, 'fallback')).toBe('$15.99');
  });

  it('falls through to Android pricingPhaseList when localizedPrice missing', () => {
    const androidSub = {
      subscriptionOfferDetails: [
        {
          pricingPhases: {
            pricingPhaseList: [
              { formattedPrice: '$0.00' }, // intro phase
              { formattedPrice: '$15.99' }, // recurring phase (LAST = the one we want)
            ],
          },
        },
      ],
    } as unknown as Parameters<typeof formatLocalizedPrice>[0];
    expect(formatLocalizedPrice(androidSub, 'fallback')).toBe('$15.99');
  });

  it('uses the LAST pricing phase, not the first (intro)', () => {
    // Critical: the first phase is the trial / intro discount, the
    // last is the recurring price. Showing the intro price as the
    // headline would mislead the user.
    const androidSub = {
      subscriptionOfferDetails: [
        {
          pricingPhases: {
            pricingPhaseList: [
              { formattedPrice: 'Free' },
              { formattedPrice: '$139.00' },
            ],
          },
        },
      ],
    } as unknown as Parameters<typeof formatLocalizedPrice>[0];
    expect(formatLocalizedPrice(androidSub)).toBe('$139.00');
  });

  it('returns the fallback when neither shape has pricing info', () => {
    const emptyAndroid = {
      subscriptionOfferDetails: [{ pricingPhases: { pricingPhaseList: [] } }],
    } as unknown as Parameters<typeof formatLocalizedPrice>[0];
    expect(formatLocalizedPrice(emptyAndroid, '€4.99')).toBe('€4.99');
  });
});

describe('hasIntroductoryOffer', () => {
  it('returns false for undefined', () => {
    expect(hasIntroductoryOffer(undefined)).toBe(false);
  });

  it('returns true when iOS introductoryPrice is present', () => {
    const iosSub = { introductoryPrice: '$0.00' } as unknown as Parameters<
      typeof hasIntroductoryOffer
    >[0];
    expect(hasIntroductoryOffer(iosSub)).toBe(true);
  });

  it('returns true when Android has multiple pricing phases', () => {
    // Multiple phases = intro/trial + recurring.
    const androidSub = {
      subscriptionOfferDetails: [
        {
          pricingPhases: {
            pricingPhaseList: [{ formattedPrice: 'Free' }, { formattedPrice: '$15.99' }],
          },
        },
      ],
    } as unknown as Parameters<typeof hasIntroductoryOffer>[0];
    expect(hasIntroductoryOffer(androidSub)).toBe(true);
  });

  it('returns false when Android has only one pricing phase', () => {
    // Single phase = no intro offer.
    const androidSub = {
      subscriptionOfferDetails: [
        { pricingPhases: { pricingPhaseList: [{ formattedPrice: '$15.99' }] } },
      ],
    } as unknown as Parameters<typeof hasIntroductoryOffer>[0];
    expect(hasIntroductoryOffer(androidSub)).toBe(false);
  });
});
