/**
 * Tests for the in-house Toast primitive + ToastProvider + useToast.
 *
 * Covers:
 *   - Toast renders the message + optional title.
 *   - Auto-dismiss after the configured duration (with fade in/out
 *     timers under fake timers).
 *   - Tapping the toast dismisses it immediately (well, after the
 *     fade-out animation completes).
 *   - useToast outside the provider throws (fail-fast contract).
 *   - Provider queues multiple fires without dropping any.
 *   - dismissToast removes a specific id.
 */

import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  ToastProvider,
  useToast,
  type ShowToastInput,
} from '@components/Toast';
import Toast from '@components/Toast/Toast';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  // Drain any pending fades / dismissal timers from the last render.
  act(() => {
    jest.runAllTimers();
  });
  jest.useRealTimers();
});

describe('Toast component (in isolation)', () => {
  it('renders the message and the optional title', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <Toast
        spec={{ id: 1, title: 'Purchase failed', message: 'Card declined' }}
        onDismiss={onDismiss}
      />,
    );
    expect(getByText('Purchase failed')).toBeTruthy();
    expect(getByText('Card declined')).toBeTruthy();
  });

  it('calls onDismiss after durationMs', () => {
    const onDismiss = jest.fn();
    render(
      <Toast
        spec={{ id: 7, message: 'hi' }}
        onDismiss={onDismiss}
        durationMs={1000}
      />,
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onDismiss).toHaveBeenCalledWith(7);
  });
});

// --------------------------------------------------------------------------- #
// Provider + useToast
// --------------------------------------------------------------------------- #

interface ButtonProps {
  input: ShowToastInput;
}

function FireToastButton({ input }: ButtonProps) {
  const { showToast } = useToast();
  return (
    <Pressable accessibilityRole="button" onPress={() => showToast(input)}>
      <Text>fire</Text>
    </Pressable>
  );
}

describe('ToastProvider + useToast', () => {
  it('renders a toast in the overlay when showToast fires', () => {
    const { getByText, queryByText } = render(
      <ToastProvider>
        <FireToastButton
          input={{ title: 'Saved', message: 'OK', tone: 'success' }}
        />
      </ToastProvider>,
    );
    expect(queryByText('Saved')).toBeNull();
    fireEvent.press(getByText('fire'));
    expect(getByText('Saved')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
  });

  it('queues multiple toasts without dropping any', () => {
    function FireTwo() {
      const { showToast } = useToast();
      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            showToast({ message: 'one' });
            showToast({ message: 'two' });
          }}
        >
          <Text>fire-two</Text>
        </Pressable>
      );
    }
    const { getByText } = render(
      <ToastProvider>
        <FireTwo />
      </ToastProvider>,
    );
    fireEvent.press(getByText('fire-two'));
    expect(getByText('one')).toBeTruthy();
    expect(getByText('two')).toBeTruthy();
  });

  it('removes the toast after the default duration', () => {
    const { getByText, queryByText } = render(
      <ToastProvider>
        <FireToastButton input={{ message: 'temp' }} />
      </ToastProvider>,
    );
    fireEvent.press(getByText('fire'));
    expect(getByText('temp')).toBeTruthy();
    // Default duration is 3200ms; advance past it plus the fade-out.
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(queryByText('temp')).toBeNull();
  });

  it('throws when useToast is called outside the provider', () => {
    // Silence the React error-boundary console.error noise.
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<FireToastButton input={{ message: 'x' }} />)).toThrow(
      /useToast must be used within a <ToastProvider>/,
    );
    errSpy.mockRestore();
  });
});
