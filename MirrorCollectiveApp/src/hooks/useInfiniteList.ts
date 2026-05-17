/**
 * Generic infinite-list hook used by Echo Vault, Inbox, Recipients,
 * and Guardians screens. Wraps a page-fetcher (returning {items,
 * nextCursor}) into a list-of-items + loadMore/refresh API that a
 * FlatList's onEndReached / onRefresh can plug into directly.
 *
 * Why this exists
 * ---------------
 * The backend's pagination contract is `(opts?: { limit, cursor }) =>
 * Promise<ApiResponse<{ items, nextCursor }>>` — see
 * src/services/api/echo.ts. Every list screen needs the same plumbing
 * around it: track items, track cursor, prevent double-fetches, surface
 * empty/error/loading states. Without this hook each screen copies that
 * logic.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApiResponse } from '@types';

import type { Page, PageOpts } from '@services/api/echo';

export interface UseInfiniteListResult<T> {
  /** All items loaded so far (across all pages). */
  items: T[];
  /** True only on the FIRST page load when there are no items yet. */
  loading: boolean;
  /** True while a subsequent page is being fetched (after at least one
   *  page has loaded). Bind this to the FlatList's footer spinner. */
  loadingMore: boolean;
  /** True while a manual refresh is in flight. Bind to RefreshControl.refreshing. */
  refreshing: boolean;
  /** Set if the most recent fetch failed; cleared on the next success. */
  error: string | null;
  /** True when there are still more pages to load. */
  hasMore: boolean;
  /** Call from FlatList's onEndReached. Safe to spam — internally
   *  guarded against concurrent loads. */
  loadMore: () => void;
  /** Call from RefreshControl.onRefresh — drops state and reloads page 1. */
  refresh: () => void;
}

/** Default page size — the backend clamps at 100. */
const DEFAULT_LIMIT = 50;

/**
 * Build an infinite-list state machine over a page-fetcher.
 *
 * @param fetchPage — a function returning ApiResponse<Page<T>>.
 *                    Stable identity expected (memoize via useCallback at
 *                    the call site if it closes over scoped values).
 * @param opts.limit — page size, default 50. Clamped to 1..100 by the
 *                     backend.
 */
export function useInfiniteList<T>(
  fetchPage: (opts: PageOpts) => Promise<ApiResponse<Page<T>>>,
  opts: { limit?: number } = {},
): UseInfiniteListResult<T> {
  const limit = opts.limit ?? DEFAULT_LIMIT;

  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against concurrent fetches. A re-render between an onEndReached
  // fire and state update can otherwise trigger duplicate page loads.
  const inFlight = useRef(false);
  // Tracks the most recent fetch sequence so an in-flight page-1 doesn't
  // overwrite a refresh that started later.
  const sequence = useRef(0);

  const fetchPageInternal = useCallback(
    async (
      pageCursor: string | null,
      mode: 'initial' | 'more' | 'refresh',
    ): Promise<void> => {
      if (inFlight.current) return;
      inFlight.current = true;
      const seq = ++sequence.current;

      if (mode === 'initial') setLoading(true);
      else if (mode === 'more') setLoadingMore(true);
      else if (mode === 'refresh') setRefreshing(true);

      try {
        const response = await fetchPage({ limit, cursor: pageCursor });
        // Drop the result if a newer fetch has started in the meantime.
        if (seq !== sequence.current) return;

        if (response.success && response.data) {
          const { items: pageItems, nextCursor } = response.data;
          setItems(prev =>
            mode === 'more' ? [...prev, ...pageItems] : pageItems,
          );
          setCursor(nextCursor);
          setHasMore(nextCursor !== null);
          setError(null);
        } else {
          setError(response.error || response.message || 'Failed to load');
        }
      } catch (err: any) {
        if (seq !== sequence.current) return;
        setError(err?.message || 'Network error');
      } finally {
        if (seq === sequence.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
        inFlight.current = false;
      }
    },
    [fetchPage, limit],
  );

  // Initial fetch on mount + whenever fetchPage identity changes.
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    fetchPageInternal(null, 'initial');
  }, [fetchPageInternal]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || refreshing || !hasMore || !cursor) return;
    fetchPageInternal(cursor, 'more');
  }, [cursor, fetchPageInternal, hasMore, loading, loadingMore, refreshing]);

  const refresh = useCallback(() => {
    // Reset cursor + items and re-fetch page 1.
    setCursor(null);
    setHasMore(true);
    fetchPageInternal(null, 'refresh');
  }, [fetchPageInternal]);

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
