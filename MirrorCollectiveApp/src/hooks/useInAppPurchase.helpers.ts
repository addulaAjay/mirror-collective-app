/**
 * Pure helpers used by `useInAppPurchase`. Extracted here so they can
 * be tested in isolation without dragging in the full module's import
 * chain (react-native-iap native modules + subscriptionApi + ...).
 *
 * Keep these dependency-free — only the lib's TS types.
 */

import type {Subscription} from 'react-native-iap';

/**
 * Android-only field shape on Subscription. The lib's union omits
 * pricing phases at the public type level — see useInAppPurchase.ts
 * for context.
 */
interface AndroidSubscriptionMeta {
  subscriptionOfferDetails?: Array<{
    pricingPhases?: {
      pricingPhaseList?: Array<{formattedPrice?: string}>;
    };
  }>;
}

/**
 * Return a store-localized display price for a Subscription.
 *
 * iOS:
 *   - `localizedPrice` is the formatted string from StoreKit.
 *
 * Android:
 *   - For one-time products `localizedPrice` exists.
 *   - For subscriptions (the case here) the price lives inside
 *     `subscriptionOfferDetails[].pricingPhases.pricingPhaseList[]` —
 *     we read the LAST phase (the recurring/converted price after any
 *     intro offer or free trial).
 *
 * Falls back to a string that's safe to render — never an empty string,
 * never `undefined`.
 */
export function formatLocalizedPrice(
  sub: Subscription | undefined,
  fallback = '',
): string {
  if (!sub) return fallback;

  // iOS shape
  if ('localizedPrice' in sub && sub.localizedPrice) {
    return String(sub.localizedPrice);
  }

  // Android shape — pick the LAST pricing phase, which is the
  // recurring price after any intro / trial phase.
  const offers = (sub as AndroidSubscriptionMeta).subscriptionOfferDetails;
  if (Array.isArray(offers) && offers.length > 0) {
    const phases = offers[0]?.pricingPhases?.pricingPhaseList;
    if (Array.isArray(phases) && phases.length > 0) {
      const last = phases[phases.length - 1];
      if (last?.formattedPrice) return String(last.formattedPrice);
    }
  }

  return fallback;
}

/**
 * Does this Subscription carry an introductory offer (free trial /
 * discounted intro period)?
 *
 * iOS exposes `introductoryPrice` on the Subscription. Android exposes
 * multiple pricing phases — anything beyond a single phase indicates
 * an intro offer (the first phase is the promo, the last phase is the
 * recurring price).
 */
export function hasIntroductoryOffer(sub: Subscription | undefined): boolean {
  if (!sub) return false;
  const iosSub = sub as Subscription & {introductoryPrice?: string};
  if (iosSub.introductoryPrice) return true;
  const offers = (sub as AndroidSubscriptionMeta).subscriptionOfferDetails;
  const phases = offers?.[0]?.pricingPhases?.pricingPhaseList;
  return Array.isArray(phases) && phases.length > 1;
}
