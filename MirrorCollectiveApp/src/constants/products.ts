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
export type ProductKind = 'core' | 'storage';

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

const CORE_MONTHLY_SKU = Platform.select({
  ios: 'com.themirrorcollective.mirror.core.monthly',
  android: 'com.themirrorcollective.mirror.core.monthly',
})!;
const CORE_YEARLY_SKU = Platform.select({
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
  CORE_MONTHLY: {
    key: 'CORE_MONTHLY',
    sku: CORE_MONTHLY_SKU,
    kind: 'core',
    billingPeriod: 'monthly',
    displayName: 'Mirror Core (Monthly)',
  },
  CORE_YEARLY: {
    key: 'CORE_YEARLY',
    sku: CORE_YEARLY_SKU,
    kind: 'core',
    billingPeriod: 'yearly',
    displayName: 'Mirror Core (Yearly)',
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
