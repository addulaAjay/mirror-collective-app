/**
 * Voice input in useChat (Phase 5).
 *
 * Under D1 the transcript IS the message: record -> transcribe -> drop the
 * text into the draft so the user can read and edit it -> they send it as an
 * ordinary text turn. Nothing about sendMessage changes for voice.
 */

import { act, renderHook } from '@testing-library/react-native';

import { readPhotoAsBase64 } from '@features/chat-media';
import { transcribeApiService } from '@services/api';

import { useChat } from './useChat';

const mockStart = jest.fn();
const mockStop = jest.fn();
const mockCancel = jest.fn();
let mockRecorderState = { isRecording: false, elapsedMs: 0, error: null as string | null };

jest.mock('@hooks/useAudioRecorder', () => ({
  MAX_RECORDING_MS: 120_000,
  useAudioRecorder: () => ({
    ...mockRecorderState,
    start: mockStart,
    stop: mockStop,
    cancel: mockCancel,
    clearError: jest.fn(),
  }),
}));

jest.mock('../../services/api', () => ({
  chatApiService: { sendMessage: jest.fn() },
  transcribeApiService: { transcribe: jest.fn() },
  sessionApiService: {
    getGreeting: jest
      .fn()
      .mockResolvedValue({ success: true, data: { greeting_message: 'hi' } }),
  },
}));

jest.mock('../../services/sessionManager', () => ({
  SessionManager: {
    generateNewSession: jest.fn(),
    getCurrentSessionId: jest.fn().mockResolvedValue('sess-1'),
    getConversationId: jest.fn().mockResolvedValue('conv-1'),
    setConversationId: jest.fn(),
    clearConversation: jest.fn(),
  },
}));

jest.mock('@context/UserContext', () => ({ useUser: () => ({ user: undefined }) }));

jest.mock('@features/chat-media', () => ({
  prepareChatPhoto: jest.fn(),
  readPhotoAsBase64: jest.fn(),
  CHAT_PHOTO_ENABLED: true,
  CHAT_VOICE_ENABLED: true,
}));

jest.mock('@utils/permissions/media', () => ({
  ensureCameraPermission: jest.fn().mockResolvedValue(true),
  ensureMicPermission: jest.fn().mockResolvedValue(true),
}));

const mockTranscribe = transcribeApiService.transcribe as jest.Mock;
const mockReadBase64 = readPhotoAsBase64 as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRecorderState = { isRecording: false, elapsedMs: 0, error: null };
  mockStop.mockResolvedValue('file:///cache/rec.m4a');
  mockReadBase64.mockResolvedValue('QUJD');
  mockTranscribe.mockResolvedValue({
    success: true,
    data: { text: 'I keep circling the same door.', duration_ms: 12000 },
  });
});

const setup = () => renderHook(() => useChat());

describe('recording', () => {
  it('starts the recorder', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('exposes recorder state for the UI', () => {
    mockRecorderState = { isRecording: true, elapsedMs: 4200, error: null };
    const { result } = setup();

    expect(result.current.isRecording).toBe(true);
    expect(result.current.recordingMs).toBe(4200);
  });

  it('cancelling discards without transcribing', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.cancelRecording();
    });

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockTranscribe).not.toHaveBeenCalled();
  });
});

describe('stop and transcribe', () => {
  it('reads the recording and posts it for transcription', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.stopAndTranscribe();
    });

    expect(mockReadBase64).toHaveBeenCalledWith('file:///cache/rec.m4a');
    expect(mockTranscribe).toHaveBeenCalledWith({
      mime_type: 'audio/m4a',
      data_base64: 'QUJD',
    });
  });

  it('puts the transcript in the draft for the user to review', async () => {
    // D1: the user reads and edits before sending. It must NOT auto-send.
    const { result } = setup();

    await act(async () => {
      await result.current.stopAndTranscribe();
    });

    expect(result.current.draft).toBe('I keep circling the same door.');
  });

  it('does not send the message itself', async () => {
    const { chatApiService } = jest.requireMock('../../services/api');
    const { result } = setup();

    await act(async () => {
      await result.current.stopAndTranscribe();
    });

    expect(chatApiService.sendMessage).not.toHaveBeenCalled();
  });

  it('appends to an existing draft rather than clobbering it', async () => {
    // The user may have typed something before deciding to speak.
    const { result } = setup();
    act(() => result.current.setDraft('Earlier thought.'));

    await act(async () => {
      await result.current.stopAndTranscribe();
    });

    expect(result.current.draft).toContain('Earlier thought.');
    expect(result.current.draft).toContain('I keep circling the same door.');
  });

  it('exposes a transcribing flag while in flight', async () => {
    let resolveTranscribe: (v: unknown) => void = () => {};
    mockTranscribe.mockReturnValue(
      new Promise(res => {
        resolveTranscribe = res;
      }),
    );
    const { result } = setup();

    let pending: Promise<void> | undefined;
    await act(async () => {
      pending = result.current.stopAndTranscribe();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.transcribing).toBe(true);

    await act(async () => {
      resolveTranscribe({ success: true, data: { text: 'done' } });
      await pending;
    });
    expect(result.current.transcribing).toBe(false);
  });

  it('does nothing when the recorder yields no file', async () => {
    mockStop.mockResolvedValue(null);
    const { result } = setup();

    await act(async () => {
      await result.current.stopAndTranscribe();
    });

    expect(mockTranscribe).not.toHaveBeenCalled();
  });

  it('reports an empty transcript as a system message rather than silence', async () => {
    mockTranscribe.mockResolvedValue({ success: true, data: { text: '' } });
    const { result } = setup();

    await act(async () => {
      await result.current.stopAndTranscribe();
    });

    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.sender).toBe('system');
    expect(last.text).toMatch(/didn't catch|couldn't hear/i);
    expect(result.current.draft).toBe('');
  });

  it('surfaces a transcription failure as a system message', async () => {
    mockTranscribe.mockResolvedValue({ success: false, error: 'boom' });
    const { result } = setup();

    await act(async () => {
      await result.current.stopAndTranscribe();
    });

    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.sender).toBe('system');
    expect(result.current.draft).toBe('');
  });

  it('surfaces a read failure without losing the draft', async () => {
    mockReadBase64.mockRejectedValue(new Error('ENOENT'));
    const { result } = setup();
    act(() => result.current.setDraft('typed'));

    await act(async () => {
      await result.current.stopAndTranscribe();
    });

    expect(result.current.draft).toBe('typed');
    expect(mockTranscribe).not.toHaveBeenCalled();
  });
});

describe('recorder errors', () => {
  it('surfaces a recorder error as a system message', () => {
    mockRecorderState = {
      isRecording: false,
      elapsedMs: 0,
      error: 'Disconnecting AirPods usually frees it.',
    };
    const { result } = setup();

    const texts = result.current.messages.map(m => m.text);
    expect(texts.some(t => t.includes('AirPods'))).toBe(true);
  });
});
