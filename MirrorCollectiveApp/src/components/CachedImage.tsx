/**
 * CachedImage — drop-in replacement for `<Image source={{ uri }}>` backed by
 * expo-image's native on-disk LRU cache (SDWebImage on iOS, Glide on Android).
 *
 * Why this exists
 * ---------------
 * React Native's stock `<Image>` has notoriously weak HTTP caching:
 *   - No on-disk persistence between cold starts.
 *   - The in-memory cache is keyed on raw URL, so the presigned-URL
 *     refresh on every list response invalidates the cache on each
 *     paint — every avatar re-downloads when the user pages back.
 *   - No placeholder system; flashes empty / undefined-bg on load.
 *
 * expo-image solves all three. Wrapping it in CachedImage centralizes
 * the defaults (cache policy, fade-in transition, blurhash placeholder)
 * so callers only need to pass `source` + `style`. The wrapper accepts
 * a superset of `<Image>` props so swapping is a one-line change.
 *
 * Cache-key handling
 * ------------------
 * Profile-image URLs are presigned and rotate every list fetch (6 h
 * TTL, but a fresh signature on every response). The default
 * cache-policy keys on full URL, so the rotation would defeat
 * caching. We work around this by deriving a stable cache key from
 * the URL's path (everything before the query string) so the SAME
 * underlying S3 object always hits the cache.
 */

import { Image, ImageContentFit, ImageProps } from 'expo-image';
import React from 'react';

// Single neutral blurhash used as the universal placeholder when the
// caller doesn't supply a more specific one. Decoded ~6×4 px gold-tinted
// gradient — visually matches the Mirror Collective palette and decodes
// instantly without a network hit.
const DEFAULT_BLURHASH = 'L3I1=}A^00WB00ay~qj]00fQ?aof';

export interface CachedImageProps
  extends Omit<ImageProps, 'source' | 'placeholder'> {
  /** Remote URI to render. Pass `null`/`undefined` and the placeholder shows. */
  source: { uri?: string | null } | undefined;
  /**
   * Blurhash for a per-image placeholder.
   *
   *   - `undefined` (or omitted) → fall back to `DEFAULT_BLURHASH`.
   *   - explicit `null` → suppress the placeholder entirely (use this
   *     when the surrounding container has its own loading visual that
   *     would clash with a gold-tinted smear).
   *   - any string → use this blurhash literally.
   */
  blurhash?: string | null;
  /**
   * How to fit the image inside its frame. Mirrors RN Image's
   * `resizeMode`; defaults to 'cover' for avatar-style use.
   */
  contentFit?: ImageContentFit;
  // NOTE: cachePolicy is inherited from ImageProps. Defaults to
  // 'memory-disk' here, but callers can override for e.g. a one-time
  // preview where on-disk caching would be wasted writes. The earlier
  // version Omit'd this from the interface, which silently rejected
  // any caller override at the type level — the review surfaced it.
}

/**
 * Strip the query string AND fragment from a URL to produce a stable
 * cache key. Presigned URLs rotate the signature on every fetch — without
 * this, the LRU cache would never hit on re-fetches of the same object.
 * Fragments (`#…`) aren't part of the bytes either, so they're also
 * dropped from the key.
 */
function stableCacheKey(uri: string): string {
  const qIdx = uri.indexOf('?');
  const fIdx = uri.indexOf('#');
  const cutAt = Math.min(
    qIdx >= 0 ? qIdx : Infinity,
    fIdx >= 0 ? fIdx : Infinity,
  );
  return Number.isFinite(cutAt) ? uri.slice(0, cutAt as number) : uri;
}

export function CachedImage({
  source,
  blurhash,
  contentFit = 'cover',
  transition = 250,
  cachePolicy = 'memory-disk',
  ...rest
}: CachedImageProps) {
  const uri = source?.uri ?? null;
  // expo-image takes the cacheKey *inside* the ImageSource object, not as
  // a top-level prop. Without this nesting it falls back to the full URI
  // (including signature) for cache keying, which defeats caching for
  // presigned URLs.
  const expoSource = uri ? { uri, cacheKey: stableCacheKey(uri) } : null;

  // Placeholder resolution:
  //   - blurhash === null → explicit suppression (no placeholder).
  //   - blurhash === undefined → caller didn't decide, use the default.
  //   - blurhash is a string → use it.
  // Note: `??` would conflate undefined and null; the explicit check keeps
  // the null-means-suppress contract from the prop docs.
  const placeholder =
    blurhash === undefined ? DEFAULT_BLURHASH : blurhash;

  return (
    <Image
      {...rest}
      source={expoSource}
      cachePolicy={cachePolicy}
      contentFit={contentFit}
      transition={transition}
      placeholder={placeholder}
      placeholderContentFit="cover"
    />
  );
}
