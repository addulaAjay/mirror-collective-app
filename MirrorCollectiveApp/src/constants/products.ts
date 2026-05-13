import {Platform} from 'react-native';

/**
 * Single source of truth for in-app purchase product IDs.
 *
 * These strings must EXACTLY match what's configured in App Store Connect
 * (iOS) and Google Play Console (Android). Apple and Google use the same
 * IDs for cross-platform consistency, which keeps the backend's product
 * whitelist + receipt parsing simpler.
 *
 * Mirror this file in the Python backend at
 * `src/app/constants/products.py` and keep them in sync.
 */

export type BillingPeriod = 'monthly' | 'yearly';
// Naming aligned to pricing spec 2026-05-12 — launch tier is "Mirror
// Basic" (previously referred to internally as "core" / "Mirror Core").
// External SKU IDs in App Store Connect / Play Console still contain
// the legacy `core` token; renaming those is a store-side migration.
export type ProductKind = 'basic' | 'storage';

export interface ProductDescriptor {
  /** Stable identifier used inside the app to refer to a product. */
  key: string;
  /** SKU registered in App Store Connect + Play Console. */
  sku: string;
  kind: ProductKind;
  billingPeriod: BillingPeriod;
  /** Display name fallback when StoreKit / BillingClient hasn't returned product info yet. */
  displayName: string;
}

// SKU strings still contain `core` because they're the registered
// App Store Connect / Play Console product IDs — renaming those
// requires creating new store products and migrating receipts.
// Internal naming (BASIC_*) is aligned to the launch tier name.
const BASIC_MONTHLY_SKU = Platform.select({
  ios: 'com.themirrorcollective.mirror.core.monthly',
  android: 'com.themirrorcollective.mirror.core.monthly',
})!;
const BASIC_YEARLY_SKU = Platform.select({
  ios: 'com.themirrorcollective.mirror.core.yearly',
  android: 'com.themirrorcollective.mirror.core.yearly',
})!;
const STORAGE_MONTHLY_SKU = Platform.select({
  ios: 'com.themirrorcollective.mirror.storage.monthly',
  android: 'com.themirrorcollective.mirror.storage.monthly',
})!;
const STORAGE_YEARLY_SKU = Platform.select({
  ios: 'com.themirrorcollective.mirror.storage.yearly',
  android: 'com.themirrorcollective.mirror.storage.yearly',
})!;

export const PRODUCTS = {
  BASIC_MONTHLY: {
    key: 'BASIC_MONTHLY',
    sku: BASIC_MONTHLY_SKU,
    kind: 'basic',
    billingPeriod: 'monthly',
    displayName: 'Mirror Basic (Monthly)',
  },
  BASIC_YEARLY: {
    key: 'BASIC_YEARLY',
    sku: BASIC_YEARLY_SKU,
    kind: 'basic',
    billingPeriod: 'yearly',
    displayName: 'Mirror Basic (Yearly)',
  },
  STORAGE_MONTHLY: {
    key: 'STORAGE_MONTHLY',
    sku: STORAGE_MONTHLY_SKU,
    kind: 'storage',
    billingPeriod: 'monthly',
    displayName: 'Echo Vault Storage (Monthly)',
  },
  STORAGE_YEARLY: {
    key: 'STORAGE_YEARLY',
    sku: STORAGE_YEARLY_SKU,
    kind: 'storage',
    billingPeriod: 'yearly',
    displayName: 'Echo Vault Storage (Yearly)',
  },
} as const satisfies Record<string, ProductDescriptor>;

/** All SKUs in a flat array — pass directly to `getSubscriptions`. */
export const ALL_PRODUCT_SKUS: readonly string[] = Object.values(PRODUCTS).map(
  p => p.sku,
);

/** Lookup helper — find a product descriptor by its SKU. */
export function findProductBySku(sku: string): ProductDescriptor | undefined {
  return Object.values(PRODUCTS).find(p => p.sku === sku);
}

/** Deep-link to the OS's subscription-management surface. */
export const STORE_SUBSCRIPTION_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  // Note: needs to be templated with sku + package when used.
  android: 'https://play.google.com/store/account/subscriptions',
})!;
