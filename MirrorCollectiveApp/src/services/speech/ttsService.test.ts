/**
 * TTS service wrapper tests.
 *
 * The service is a thin façade over react-native-tts that adds:
 *   - "only one utterance speaks at a time" semantics
 *   - "currently-speaking" state surfaced via subscribers (the chat UI
 *     uses this to render a stop icon on the playing bubble)
 *   - graceful no-op when the native module isn't available (jest)
 *
 * These tests pin the contract, not the underlying library. The mock is
 * minimal on purpose — the goal is to verify our wrapper, not RN-TTS.
 */

import { ttsService } from './ttsService';

// Mock react-native-tts. The lib exports a default object with imperative
// methods (speak/stop/setDefaultRate/etc) AND an EventEmitter-ish surface
// (addEventListener). We capture handlers in a map so individual tests
// can fire events synchronously.
const eventHandlers: Record<string, Array<(payload: unknown) => void>> = {};
const mockSpeak = jest.fn();
const mockStop = jest.fn();
const mockSetDefaultRate = jest.fn();
const mockSetDefaultLanguage = jest.fn();
const mockGetInitStatus = jest.fn(() => Promise.resolve('success'));

jest.mock('react-native-tts', () => ({
  __esModule: true,
  default: {
    speak: (...args: unknown[]) => mockSpeak(...args),
    stop: () => mockStop(),
    setDefaultRate: (rate: number) => mockSetDefaultRate(rate),
    setDefaultLanguage: (lang: string) => mockSetDefaultLanguage(lang),
    getInitStatus: () => mockGetInitStatus(),
    addEventListener: (event: string, handler: (p: unknown) => void) => {
      eventHandlers[event] = eventHandlers[event] ?? [];
      eventHandlers[event].push(handler);
      // Real RN-TTS returns a subscription with .remove(); mirror that.
      return {
        remove: () => {
          eventHandlers[event] = (eventHandlers[event] ?? []).filter(
            (h) => h !== handler,
          );
        },
      };
    },
    removeAllListeners: (event: string) => {
      delete eventHandlers[event];
    },
  },
}));

function fireEvent(event: string, payload: unknown = {}): void {
  (eventHandlers[event] ?? []).forEach((h) => h(payload));
}

beforeEach(() => {
  jest.clearAllMocks();
  for (const k of Object.keys(eventHandlers)) delete eventHandlers[k];
  ttsService.reset();
});

describe('ttsService.speak', () => {
  it('forwards text to native TTS and marks the utterance active', async () => {
    await ttsService.speak('hello world', 'msg-1');
    expect(mockSpeak).toHaveBeenCalledWith('hello world');
    expect(ttsService.getActiveUtteranceId()).toBe('msg-1');
  });

  it('stops any in-flight utterance before starting a new one', async () => {
    await ttsService.speak('first', 'msg-1');
    await ttsService.speak('second', 'msg-2');
    expect(mockStop).toHaveBeenCalled();
    expect(ttsService.getActiveUtteranceId()).toBe('msg-2');
  });

  it('no-ops on empty/whitespace text without calling native', async () => {
    await ttsService.speak('   ', 'msg-1');
    expect(mockSpeak).not.toHaveBeenCalled();
    expect(ttsService.getActiveUtteranceId()).toBeNull();
  });
});

describe('ttsService.stop', () => {
  it('forwards stop to native and clears the active id', async () => {
    await ttsService.speak('text', 'msg-1');
    ttsService.stop();
    expect(mockStop).toHaveBeenCalled();
    expect(ttsService.getActiveUtteranceId()).toBeNull();
  });
});

describe('ttsService events → subscribers', () => {
  it('notifies subscribers on speak-start with the active id', async () => {
    const sub = jest.fn();
    ttsService.subscribe(sub);
    await ttsService.speak('text', 'msg-1');
    fireEvent('tts-start');
    expect(sub).toHaveBeenLastCalledWith({
      type: 'started',
      utteranceId: 'msg-1',
    });
  });

  it('notifies subscribers and clears active id on tts-finish', async () => {
    const sub = jest.fn();
    ttsService.subscribe(sub);
    await ttsService.speak('text', 'msg-1');
    fireEvent('tts-finish');
    expect(sub).toHaveBeenLastCalledWith({
      type: 'finished',
      utteranceId: 'msg-1',
    });
    expect(ttsService.getActiveUtteranceId()).toBeNull();
  });

  it('notifies subscribers on tts-cancel and clears active id', async () => {
    const sub = jest.fn();
    ttsService.subscribe(sub);
    await ttsService.speak('text', 'msg-1');
    fireEvent('tts-cancel');
    expect(sub).toHaveBeenLastCalledWith({
      type: 'cancelled',
      utteranceId: 'msg-1',
    });
    expect(ttsService.getActiveUtteranceId()).toBeNull();
  });

  it('subscribe returns an unsubscribe function', async () => {
    const sub = jest.fn();
    const unsub = ttsService.subscribe(sub);
    unsub();
    await ttsService.speak('text', 'msg-1');
    fireEvent('tts-start');
    expect(sub).not.toHaveBeenCalled();
  });
});

describe('ttsService resilience', () => {
  it('catches a thrown native speak() — does not propagate to caller', async () => {
    mockSpeak.mockImplementationOnce(() => {
      throw new Error('native module not linked');
    });
    await expect(ttsService.speak('hi', 'msg-1')).resolves.toBeUndefined();
    // Active id stays null because the speak failed before establishing it.
    expect(ttsService.getActiveUtteranceId()).toBeNull();
  });
});
