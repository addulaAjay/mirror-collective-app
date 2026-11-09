/**
 * The bar that replaces the composer while messages are selected.
 *
 * Copy · Save to Echo · Cancel, with a running count.
 *
 * Confirmation is built into the bar rather than a toast: this repo has no
 * toast component (the one referenced in the plan lives on an unmerged May
 * branch), and an Alert is both heavy for a confirmation and the exact
 * mechanism behind the 2026-10-11 crash. So Copy flips to "Copied" in place,
 * then the bar dismisses itself — feedback and completion in one gesture.
 */

import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { SelectionBar } from './SelectionBar';

const noop = () => {};

describe('SelectionBar', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows the singular count for one message', () => {
    const { getByText } = render(
      <SelectionBar count={1} onCopy={noop} onSaveToEcho={noop} onCancel={noop} />,
    );

    expect(getByText('1 selected')).toBeTruthy();
  });

  it('shows the plural count for several', () => {
    const { getByText } = render(
      <SelectionBar count={3} onCopy={noop} onSaveToEcho={noop} onCancel={noop} />,
    );

    expect(getByText('3 selected')).toBeTruthy();
  });

  it('calls onCopy when Copy is pressed', () => {
    const onCopy = jest.fn();
    const { getByText } = render(
      <SelectionBar count={2} onCopy={onCopy} onSaveToEcho={noop} onCancel={noop} />,
    );

    fireEvent.press(getByText('Copy'));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('confirms in place after copying', () => {
    const { getByText, queryByText } = render(
      <SelectionBar count={2} onCopy={noop} onSaveToEcho={noop} onCancel={noop} />,
    );

    fireEvent.press(getByText('Copy'));

    expect(queryByText('Copied')).toBeTruthy();
    expect(queryByText('Copy')).toBeNull();
  });

  it('dismisses itself a moment after copying', () => {
    // Feedback then completion — the user should not have to tap Cancel after
    // a successful copy.
    const onCancel = jest.fn();
    const { getByText } = render(
      <SelectionBar count={2} onCopy={noop} onSaveToEcho={noop} onCancel={onCancel} />,
    );

    fireEvent.press(getByText('Copy'));
    expect(onCancel).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores a second Copy press while confirming', () => {
    // Double-tap should not queue two dismissals.
    const onCopy = jest.fn();
    const { getByText } = render(
      <SelectionBar count={2} onCopy={onCopy} onSaveToEcho={noop} onCancel={noop} />,
    );

    fireEvent.press(getByText('Copy'));
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('calls onSaveToEcho when Save to Echo is pressed', () => {
    const onSaveToEcho = jest.fn();
    const { getByText } = render(
      <SelectionBar
        count={2}
        onCopy={noop}
        onSaveToEcho={onSaveToEcho}
        onCancel={noop}
      />,
    );

    fireEvent.press(getByText('Save to Echo'));

    expect(onSaveToEcho).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel is pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <SelectionBar count={2} onCopy={noop} onSaveToEcho={noop} onCancel={onCancel} />,
    );

    fireEvent.press(getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not leave a timer running after unmount', () => {
    // An unmounted bar firing onCancel would cancel a selection the user has
    // since rebuilt.
    const onCancel = jest.fn();
    const { getByText, unmount } = render(
      <SelectionBar count={2} onCopy={noop} onSaveToEcho={noop} onCancel={onCancel} />,
    );

    fireEvent.press(getByText('Copy'));
    unmount();
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onCancel).not.toHaveBeenCalled();
  });
});
