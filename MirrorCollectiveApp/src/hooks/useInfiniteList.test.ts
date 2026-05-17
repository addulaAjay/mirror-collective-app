/**
 * Tests for useInfiniteList — the FlatList-onEndReached state machine.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { ApiResponse } from '@types';
import type { Page, PageOpts } from '@services/api/echo';

import { useInfiniteList } from './useInfiniteList';

type Row = { id: string };

function makeResponse(
  items: Row[],
  nextCursor: string | null,
): ApiResponse<Page<Row>> {
  return {
    success: true,
    data: { items, nextCursor },
  } as ApiResponse<Page<Row>>;
}

function makeFailure(message: string): ApiResponse<Page<Row>> {
  return {
    success: false,
    error: message,
  } as ApiResponse<Page<Row>>;
}

describe('useInfiniteList', () => {
  it('fetches page 1 on mount and surfaces the items', async () => {
    const fetchPage = jest.fn(async () =>
      makeResponse([{ id: 'a' }, { id: 'b' }], null),
    );

    const { result } = renderHook(() => useInfiniteList(fetchPage));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith({ limit: 50, cursor: null });
    expect(result.current.items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loadMore appends the next page using the cursor', async () => {
    const fetchPage = jest.fn(
      async (opts: PageOpts): Promise<ApiResponse<Page<Row>>> => {
        if (opts.cursor === null || opts.cursor === undefined) {
          return makeResponse([{ id: 'a' }], 'cursor-2');
        }
        return makeResponse([{ id: 'b' }], null);
      },
    );

    const { result } = renderHook(() => useInfiniteList(fetchPage));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 'a' }]);
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenLastCalledWith({
      limit: 50,
      cursor: 'cursor-2',
    });
    expect(result.current.items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(result.current.hasMore).toBe(false);
  });

  it('loadMore is a no-op when hasMore is false', async () => {
    const fetchPage = jest.fn(async () =>
      makeResponse([{ id: 'a' }], null),
    );

    const { result } = renderHook(() => useInfiniteList(fetchPage));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.loadMore());
    act(() => result.current.loadMore());

    // No further fetches — even after multiple loadMore calls.
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('loadMore deduplicates concurrent calls', async () => {
    let resolveSecond: (v: ApiResponse<Page<Row>>) => void = () => {};
    const fetchPage = jest.fn(
      (opts: PageOpts): Promise<ApiResponse<Page<Row>>> => {
        if (opts.cursor === null || opts.cursor === undefined) {
          return Promise.resolve(makeResponse([{ id: 'a' }], 'cur'));
        }
        // Hold the second page open so we can verify two loadMore
        // calls don't both fire.
        return new Promise(resolve => {
          resolveSecond = resolve;
        });
      },
    );

    const { result } = renderHook(() => useInfiniteList(fetchPage));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.loadMore());
    act(() => result.current.loadMore());
    act(() => result.current.loadMore());

    // Only the first loadMore actually started a fetch — the others
    // saw loadingMore=true and bailed.
    expect(fetchPage).toHaveBeenCalledTimes(2); // 1 initial + 1 loadMore

    // Resolve and clean up.
    resolveSecond(makeResponse([{ id: 'b' }], null));
    await waitFor(() => expect(result.current.loadingMore).toBe(false));
  });

  it('refresh resets the list and re-fetches page 1', async () => {
    let callCount = 0;
    const fetchPage = jest.fn(
      async (): Promise<ApiResponse<Page<Row>>> => {
        callCount += 1;
        return makeResponse([{ id: `call-${callCount}` }], null);
      },
    );

    const { result } = renderHook(() => useInfiniteList(fetchPage));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 'call-1' }]);

    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshing).toBe(false));

    expect(result.current.items).toEqual([{ id: 'call-2' }]);
  });

  it('surfaces error from the fetch and clears it on next success', async () => {
    let shouldFail = true;
    const fetchPage = jest.fn(async (): Promise<ApiResponse<Page<Row>>> => {
      if (shouldFail) return makeFailure('boom');
      return makeResponse([{ id: 'ok' }], null);
    });

    const { result } = renderHook(() => useInfiniteList(fetchPage));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');

    shouldFail = false;
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.items).toEqual([{ id: 'ok' }]);
  });

  it('honors a custom limit', async () => {
    const fetchPage = jest.fn(async () =>
      makeResponse([], null),
    );

    renderHook(() => useInfiniteList(fetchPage, { limit: 10 }));

    await waitFor(() => expect(fetchPage).toHaveBeenCalled());
    expect(fetchPage).toHaveBeenCalledWith({ limit: 10, cursor: null });
  });
});
