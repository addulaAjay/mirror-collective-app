/**
 * useAutoReadOnNewMessage — fires ttsService.speak() each time the
 * latest assistant message id changes, IFF the user has the
 * autoRead preference enabled. Pure side-effect hook.
 */

import { renderHook } from '@testing-library/react-native';
import type { Message } from '@types';

const mockSpeak = jest.fn();
const mockStop = jest.fn();

jest.mock('./ttsService', () => ({
  ttsService: {
    speak: (...args: unknown[]) => {
      mockSpeak(...args);
      return Promise.resolve();
    },
    stop: () => mockStop(),
  },
}));

import { useAutoReadOnNewMessage } from './useAutoReadOnNewMessage';

beforeEach(() => {
  mockSpeak.mockClear();
  mockStop.mockClear();
});

function mkMsg(id: string, text: string, sender: 'user' | 'system' = 'system'): Message {
  return { id, text, sender };
}

describe('useAutoReadOnNewMessage', () => {
  it('does nothing when the toggle is off', () => {
    renderHook(() =>
      useAutoReadOnNewMessage([mkMsg('a', 'hello')], false),
    );
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('does nothing when enabled but the latest message is from the user', () => {
    renderHook(() =>
      useAutoReadOnNewMessage([mkMsg('u', 'hi', 'user')], true),
    );
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('does NOT auto-read the FIRST message after toggling on (greeting on screen mount)', () => {
    // Subtle UX rule: a user who just enabled auto-read shouldn't
    // immediately hear the existing greeting. Auto-read only fires
    // for NEW messages that arrive after mount.
    renderHook(() =>
      useAutoReadOnNewMessage([mkMsg('greeting', 'Welcome')], true),
    );
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('speaks the latest assistant message when a NEW one appears', () => {
    const { rerender } = renderHook(
      ({ msgs, on }: { msgs: Message[]; on: boolean }) =>
        useAutoReadOnNewMessage(msgs, on),
      { initialProps: { msgs: [mkMsg('greeting', 'Welcome')], on: true } },
    );
    expect(mockSpeak).not.toHaveBeenCalled();

    rerender({
      msgs: [mkMsg('greeting', 'Welcome'), mkMsg('reply-1', 'New reply')],
      on: true,
    });
    expect(mockSpeak).toHaveBeenCalledWith('New reply', 'reply-1');
  });

  it('skips speaking when the new latest message is from the user', () => {
    const { rerender } = renderHook(
      ({ msgs, on }: { msgs: Message[]; on: boolean }) =>
        useAutoReadOnNewMessage(msgs, on),
      { initialProps: { msgs: [mkMsg('greeting', 'Welcome')], on: true } },
    );
    rerender({
      msgs: [
        mkMsg('greeting', 'Welcome'),
        mkMsg('u-1', 'me typing', 'user'),
      ],
      on: true,
    });
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('stops any in-flight speech on unmount', () => {
    const { unmount } = renderHook(() =>
      useAutoReadOnNewMessage([mkMsg('a', 'hi')], true),
    );
    unmount();
    expect(mockStop).toHaveBeenCalled();
  });
});
