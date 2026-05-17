import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { Message } from '@types';

// Mock the speech service before importing the bubble — the bubble
// reads from @services/speech, and we want call-counting on speak/stop.
const mockSpeak = jest.fn();
const mockStop = jest.fn();
const mockGetActiveUtteranceId = jest.fn(() => null as string | null);
let mockSubscribers: Array<(e: { type: string; utteranceId: string }) => void> = [];

jest.mock('@services/speech', () => {
  // require inside the factory keeps jest from hoisting it outside the
  // module-mock boundary. react is the test-runner's own copy.
  const ReactInner = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    ttsService: {
      speak: (...args: unknown[]) => {
        mockSpeak(...args);
        return Promise.resolve();
      },
      stop: () => mockStop(),
      getActiveUtteranceId: () => mockGetActiveUtteranceId(),
      subscribe: (fn: (e: { type: string; utteranceId: string }) => void) => {
        mockSubscribers.push(fn);
        return () => {
          mockSubscribers = mockSubscribers.filter((s) => s !== fn);
        };
      },
    },
    useTtsActiveId: () => {
      // Re-implement the hook against the mocked subscribe channel so
      // tests can simulate "this bubble is now speaking" by calling
      // notifyActive() below.
      const [id, setId] = ReactInner.useState<string | null>(
        mockGetActiveUtteranceId(),
      );
      ReactInner.useEffect(() => {
        const fn = (e: { type: string; utteranceId: string }) =>
          setId(e.type === 'started' ? e.utteranceId : null);
        mockSubscribers.push(fn);
        return () => {
          mockSubscribers = mockSubscribers.filter((s) => s !== fn);
        };
      }, []);
      return id;
    },
  };
});

function notifyActive(utteranceId: string | null): void {
  // null = stopped/finished; non-null = started.
  mockSubscribers.forEach((fn) =>
    fn({
      type: utteranceId ? 'started' : 'finished',
      utteranceId: utteranceId ?? 'prev',
    }),
  );
}

import { MessageBubble } from './MessageBubble';

beforeEach(() => {
  mockSpeak.mockClear();
  mockStop.mockClear();
  mockGetActiveUtteranceId.mockReturnValue(null);
  mockSubscribers = [];
});

describe('MessageBubble', () => {
  const mockUserMessage: Message = {
    id: '1',
    text: 'Hello, this is a user message',
    sender: 'user',
    timestamp: new Date(),
  };

  const mockSystemMessage: Message = {
    id: '2',
    text: 'Hello, this is a system message',
    sender: 'system',
    timestamp: new Date(),
  };

  it('renders user message correctly', () => {
    const { getByText } = render(<MessageBubble message={mockUserMessage} />);
    expect(getByText('Hello, this is a user message')).toBeTruthy();
  });

  it('renders system message correctly', () => {
    const { getByText } = render(<MessageBubble message={mockSystemMessage} />);
    expect(getByText('Hello, this is a system message')).toBeTruthy();
  });

  it('displays user messages with correct styling', () => {
    const { getByText } = render(<MessageBubble message={mockUserMessage} />);
    const messageElement = getByText('Hello, this is a user message');
    expect(messageElement).toBeTruthy();
  });

  it('displays system messages with correct styling', () => {
    const { getByText } = render(<MessageBubble message={mockSystemMessage} />);
    const messageElement = getByText('Hello, this is a system message');
    expect(messageElement).toBeTruthy();
  });

  it('handles empty message text', () => {
    const emptyMessage: Message = {
      id: '3',
      text: '',
      sender: 'user',
      timestamp: new Date(),
    };
    
    const { getByText } = render(<MessageBubble message={emptyMessage} />);
    expect(getByText('')).toBeTruthy();
  });

  it('handles long message text', () => {
    const longMessage: Message = {
      id: '4',
      text: 'This is a very long message that should wrap properly and not break the layout of the chat interface',
      sender: 'system',
      timestamp: new Date(),
    };

    const { getByText } = render(<MessageBubble message={longMessage} />);
    expect(getByText(longMessage.text)).toBeTruthy();
  });

  describe('speaker button — read-aloud', () => {
    it('renders on assistant bubbles only', () => {
      const { queryByTestId: assistant } = render(
        <MessageBubble message={mockSystemMessage} />,
      );
      expect(assistant(`speaker-button-${mockSystemMessage.id}`)).toBeTruthy();

      const { queryByTestId: user } = render(
        <MessageBubble message={mockUserMessage} />,
      );
      // User bubbles do NOT get a speaker button — only the AI replies.
      expect(user(`speaker-button-${mockUserMessage.id}`)).toBeNull();
    });

    it('calls ttsService.speak(text, id) when tapped on an idle bubble', () => {
      const { getByTestId } = render(<MessageBubble message={mockSystemMessage} />);
      fireEvent.press(getByTestId(`speaker-button-${mockSystemMessage.id}`));
      expect(mockSpeak).toHaveBeenCalledWith(
        mockSystemMessage.text,
        mockSystemMessage.id,
      );
      expect(mockStop).not.toHaveBeenCalled();
    });

    it('calls ttsService.stop() when tapped on the currently-speaking bubble', () => {
      const { getByTestId } = render(<MessageBubble message={mockSystemMessage} />);
      // Simulate the wrapper firing "this bubble started" — wrap in act
      // so the useState in useTtsActiveId flushes before we press.
      act(() => notifyActive(mockSystemMessage.id));
      fireEvent.press(getByTestId(`speaker-button-${mockSystemMessage.id}`));
      expect(mockStop).toHaveBeenCalled();
      expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('uses an accessibility label that reflects the play/stop state', () => {
      const { getByLabelText } = render(
        <MessageBubble message={mockSystemMessage} />,
      );
      expect(getByLabelText('Read reply aloud')).toBeTruthy();

      // Flip to "this bubble is speaking"; the hook's useEffect listener
      // updates state inside act(), so re-querying picks up the new label.
      act(() => notifyActive(mockSystemMessage.id));
      expect(getByLabelText('Stop reading reply aloud')).toBeTruthy();
    });
  });
});