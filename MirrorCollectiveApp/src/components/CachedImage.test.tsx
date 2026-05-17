/**
 * Tests for CachedImage — verifies the cache-key normalization that lets
 * us hit the on-disk cache across presigned-URL rotation.
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { CachedImage } from './CachedImage';

describe('CachedImage', () => {
  function getExpoImageProps(component: ReturnType<typeof render>) {
    // jest.setup.js mocks expo-image's `Image` as the string 'Image' so
    // the rendered tree includes the props we passed through. Walk the
    // tree for the first 'Image' host node and return its props.
    return component.UNSAFE_root.findByType('Image' as never).props as Record<
      string,
      unknown
    >;
  }

  it('strips the query string for the cache key (presigned-URL rotation)', () => {
    const c = render(
      <CachedImage
        source={{
          uri:
            'https://b.s3.amazonaws.com/p/u-1.jpg' +
            '?X-Amz-Signature=deadbeef&X-Amz-Expires=21600',
        }}
        style={{ width: 40, height: 40 }}
      />,
    );

    const props = getExpoImageProps(c);
    const src = props.source as { uri: string; cacheKey: string };
    expect(src.cacheKey).toBe('https://b.s3.amazonaws.com/p/u-1.jpg');
    // The URL forwarded to expo-image is still the full presigned URL —
    // the server needs the signature to validate the GET.
    expect(src.uri).toContain('X-Amz-Signature');
  });

  it('passes through URLs without a query string unchanged', () => {
    const c = render(
      <CachedImage
        source={{ uri: 'https://b.example.com/avatar.jpg' }}
        style={{ width: 40, height: 40 }}
      />,
    );
    const props = getExpoImageProps(c);
    const src = props.source as { uri: string; cacheKey: string };
    expect(src.cacheKey).toBe('https://b.example.com/avatar.jpg');
  });

  it('renders with a null source when uri is missing', () => {
    const c = render(
      <CachedImage source={undefined} style={{ width: 40, height: 40 }} />,
    );
    const props = getExpoImageProps(c);
    expect(props.source).toBeNull();
  });

  it('uses the default blurhash placeholder when none is supplied', () => {
    const c = render(
      <CachedImage
        source={{ uri: 'https://b.example.com/x.jpg' }}
        style={{ width: 40, height: 40 }}
      />,
    );
    const props = getExpoImageProps(c);
    expect(props.placeholder).toBeTruthy();
    // A blurhash string is typically ~20-40 ASCII chars.
    expect(typeof props.placeholder).toBe('string');
  });

  it('respects a caller-supplied blurhash', () => {
    const c = render(
      <CachedImage
        source={{ uri: 'https://b.example.com/x.jpg' }}
        blurhash="L9~$$M9F00xu~q-;_3WC00WB-;Rj"
        style={{ width: 40, height: 40 }}
      />,
    );
    const props = getExpoImageProps(c);
    expect(props.placeholder).toBe('L9~$$M9F00xu~q-;_3WC00WB-;Rj');
  });

  it('suppresses the placeholder when blurhash is explicitly null', () => {
    const c = render(
      <CachedImage
        source={{ uri: 'https://b.example.com/x.jpg' }}
        blurhash={null}
        style={{ width: 40, height: 40 }}
      />,
    );
    const props = getExpoImageProps(c);
    expect(props.placeholder).toBeNull();
  });

  it('strips fragments as well as query strings from the cache key', () => {
    const c = render(
      <CachedImage
        source={{ uri: 'https://cdn.example.com/file.jpg#v2' }}
        style={{ width: 40, height: 40 }}
      />,
    );
    const props = getExpoImageProps(c);
    const src = props.source as { uri: string; cacheKey: string };
    expect(src.cacheKey).toBe('https://cdn.example.com/file.jpg');
  });

  it('handles URLs with both fragment and query', () => {
    const c = render(
      <CachedImage
        source={{ uri: 'https://cdn.example.com/file.jpg?v=2#tab=meta' }}
        style={{ width: 40, height: 40 }}
      />,
    );
    const props = getExpoImageProps(c);
    const src = props.source as { uri: string; cacheKey: string };
    expect(src.cacheKey).toBe('https://cdn.example.com/file.jpg');
  });

  it('uses memory-disk cache policy by default', () => {
    const c = render(
      <CachedImage
        source={{ uri: 'https://b.example.com/x.jpg' }}
        style={{ width: 40, height: 40 }}
      />,
    );
    const props = getExpoImageProps(c);
    expect(props.cachePolicy).toBe('memory-disk');
  });
});
