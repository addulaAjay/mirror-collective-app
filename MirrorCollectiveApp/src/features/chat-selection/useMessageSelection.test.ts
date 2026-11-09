/**
 * Selection mode for chat messages.
 *
 * Long-press a bubble to enter and select it; tap others to toggle. The bar
 * that replaces the composer offers Copy and Save to Echo over whatever is
 * selected.
 *
 * The invariant that matters: selection mode and an empty selection must never
 * coexist. A bar showing "0 selected" with no way back is a dead end, so
 * deselecting the last message exits automatically.
 */

import { act, renderHook } from '@testing-library/react-native';

import { useMessageSelection } from './useMessageSelection';

describe('useMessageSelection', () => {
  it('starts inactive with nothing selected', () => {
    const { result } = renderHook(() => useMessageSelection());

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('enters selection mode with the long-pressed message selected', () => {
    const { result } = renderHook(() => useMessageSelection());

    act(() => result.current.beginSelection('m1'));

    expect(result.current.isSelecting).toBe(true);
    expect(result.current.selectedIds.has('m1')).toBe(true);
  });

  it('toggles another message on', () => {
    const { result } = renderHook(() => useMessageSelection());
    act(() => result.current.beginSelection('m1'));

    act(() => result.current.toggle('m2'));

    expect(result.current.selectedIds.size).toBe(2);
  });

  it('toggles a message back off', () => {
    const { result } = renderHook(() => useMessageSelection());
    act(() => result.current.beginSelection('m1'));
    act(() => result.current.toggle('m2'));

    act(() => result.current.toggle('m2'));

    expect(result.current.selectedIds.has('m2')).toBe(false);
    expect(result.current.isSelecting).toBe(true);
  });

  it('exits when the last selected message is deselected', () => {
    // Otherwise the bar sits there reading "0 selected" with nothing to act on.
    const { result } = renderHook(() => useMessageSelection());
    act(() => result.current.beginSelection('m1'));

    act(() => result.current.toggle('m1'));

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('cancel clears everything', () => {
    const { result } = renderHook(() => useMessageSelection());
    act(() => result.current.beginSelection('m1'));
    act(() => result.current.toggle('m2'));

    act(() => result.current.cancel());

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('ignores a toggle while not in selection mode', () => {
    // A plain tap outside selection mode must not silently start selecting.
    const { result } = renderHook(() => useMessageSelection());

    act(() => result.current.toggle('m1'));

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('beginSelection on an already-selected message keeps it selected', () => {
    const { result } = renderHook(() => useMessageSelection());
    act(() => result.current.beginSelection('m1'));

    act(() => result.current.beginSelection('m1'));

    expect(result.current.isSelecting).toBe(true);
    expect(result.current.selectedIds.has('m1')).toBe(true);
  });

  it('reports the count for the bar', () => {
    const { result } = renderHook(() => useMessageSelection());
    act(() => result.current.beginSelection('m1'));
    act(() => result.current.toggle('m2'));
    act(() => result.current.toggle('m3'));

    expect(result.current.selectedIds.size).toBe(3);
  });

  it('hands back a new Set each change so memoized bubbles re-render', () => {
    const { result } = renderHook(() => useMessageSelection());
    act(() => result.current.beginSelection('m1'));
    const first = result.current.selectedIds;

    act(() => result.current.toggle('m2'));

    expect(result.current.selectedIds).not.toBe(first);
  });
});
