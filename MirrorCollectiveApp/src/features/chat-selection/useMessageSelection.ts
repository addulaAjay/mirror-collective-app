/**
 * Selection mode for chat messages.
 *
 * Long-press enters and selects; tap toggles. The bar that replaces the
 * composer acts on whatever is selected — Copy, or Save to Echo.
 *
 * Deliberately knows nothing about messages themselves: it holds ids, and
 * `joinMessages` turns ids plus the conversation into text. That keeps
 * ordering out of here, where insertion order would otherwise be tempting and
 * wrong.
 */

import { useCallback, useMemo, useState } from 'react';

export interface MessageSelection {
  isSelecting: boolean;
  selectedIds: ReadonlySet<string>;
  /** Long-press: enter selection mode with this message selected. */
  beginSelection: (id: string) => void;
  /** Tap while selecting: add or remove. No-op otherwise. */
  toggle: (id: string) => void;
  /** Leave selection mode and drop everything. */
  cancel: () => void;
}

export function useMessageSelection(): MessageSelection {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const beginSelection = useCallback((id: string) => {
    // A fresh Set every time: memoized bubbles compare by reference, and
    // mutating in place would leave them stale.
    setSelectedIds(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      // Not selecting yet — a plain tap must not start a selection.
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const cancel = useCallback(() => setSelectedIds(new Set()), []);

  // Selection mode IS a non-empty selection. Deriving it rather than storing a
  // separate boolean makes "selecting with nothing selected" unrepresentable,
  // so deselecting the last message exits on its own.
  const isSelecting = selectedIds.size > 0;

  return useMemo(
    () => ({ isSelecting, selectedIds, beginSelection, toggle, cancel }),
    [isSelecting, selectedIds, beginSelection, toggle, cancel],
  );
}
