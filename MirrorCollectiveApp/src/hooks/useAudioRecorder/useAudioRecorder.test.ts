/**
 * Voice recorder for chat (Phase 5).
 *
 * The lifecycle here is lifted from NewEchoAudioScreen, which learned several
 * things the hard way. What must survive the extraction:
 *
 * - the 300ms audio-session pre-delay, so a prior video/camera component has
 *   released AVAudioSession before the recorder tries to acquire it;
 * - removeRecordBackListener() BEFORE adding, so retries don't stack
 *   listeners;
 * - a SYNCHRONOUS isRecordingRef guard, because stopRecorder() on an idle
 *   recorder can throw on iOS and state updates land too late to prevent it;
 * - capturing stopRecorder()'s return value — it is the saved file path.
 *
 * New here: a 120s auto-stop, which does not exist anywhere in the app.
 */

import { act, renderHook } from '@testing-library/react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

import { ensureMicPermission } from '@utils/permissions/media';

import { MAX_RECORDING_MS, useAudioRecorder } from './useAudioRecorder';

jest.mock('@utils/permissions/media', () => ({
  ensureMicPermission: jest.fn().mockResolvedValue(true),
}));

const recorder = AudioRecorderPlayer as unknown as {
  startRecorder: jest.Mock;
  stopRecorder: jest.Mock;
  addRecordBackListener: jest.Mock;
  removeRecordBackListener: jest.Mock;
};
const mockPermission = ensureMicPermission as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockPermission.mockResolvedValue(true);
  recorder.startRecorder.mockResolvedValue('file:///cache/rec.m4a');
  recorder.stopRecorder.mockResolvedValue('file:///cache/rec.m4a');
});

afterEach(() => {
  jest.useRealTimers();
});

/**
 * Start recording, advancing past the 300ms audio-session delay.
 *
 * Uses advanceTimersByTimeAsync because start() awaits the permission check
 * BEFORE registering its setTimeout — a synchronous advance would fire
 * against an empty timer queue and the delay would never resolve.
 */
const startRecording = async (result: {
  current: ReturnType<typeof useAudioRecorder>;
}) => {
  await act(async () => {
    const pending = result.current.start();
    await jest.advanceTimersByTimeAsync(400);
    await pending;
  });
};

describe('starting', () => {
  it('requests mic permission before touching the recorder', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await startRecording(result);

    expect(mockPermission).toHaveBeenCalled();
    expect(recorder.startRecorder).toHaveBeenCalled();
  });

  it('does not start when permission is denied', async () => {
    mockPermission.mockResolvedValue(false);
    const { result } = renderHook(() => useAudioRecorder());

    await startRecording(result);

    expect(recorder.startRecorder).not.toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  it('waits for the audio session before starting', async () => {
    // Without the delay, switching from a video screen straight to recording
    // fails with "audio session was hijacked".
    const { result } = renderHook(() => useAudioRecorder());

    let pending: Promise<unknown> | undefined;
    await act(async () => {
      pending = result.current.start();
      // Let the permission promise settle, but do NOT advance timers yet.
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(recorder.startRecorder).not.toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
      await pending;
    });
    expect(recorder.startRecorder).toHaveBeenCalled();
  });

  it('records speech-tuned audio, not Echo Vault archival audio', async () => {
    // Whisper resamples to 16kHz, so 44.1kHz is ~4x the bytes for no
    // accuracy gain.
    const { result } = renderHook(() => useAudioRecorder());

    await startRecording(result);

    const audioSet = recorder.startRecorder.mock.calls[0][1];
    expect(audioSet.AVSampleRateKeyIOS).toBe(16000);
    expect(audioSet.AVNumberOfChannelsKeyIOS).toBe(1);
  });

  it('clears any previous listener before adding one', async () => {
    // Otherwise a retry stacks listeners and the timer jumps in multiples.
    const { result } = renderHook(() => useAudioRecorder());

    await startRecording(result);

    expect(recorder.removeRecordBackListener).toHaveBeenCalled();
    expect(recorder.addRecordBackListener).toHaveBeenCalled();
  });

  it('reports isRecording once started', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await startRecording(result);

    expect(result.current.isRecording).toBe(true);
  });

  it('tracks elapsed time from the recorder callback', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await startRecording(result);

    const listener = recorder.addRecordBackListener.mock.calls[0][0];
    act(() => listener({ currentPosition: 4200 }));

    expect(result.current.elapsedMs).toBe(4200);
  });
});

describe('start failures', () => {
  it('maps a permission error to actionable copy', async () => {
    recorder.startRecorder.mockRejectedValue(new Error('permission denied'));
    const { result } = renderHook(() => useAudioRecorder());

    await startRecording(result);

    expect(result.current.error).toMatch(/settings/i);
    expect(result.current.isRecording).toBe(false);
  });

  it('maps an audio-session conflict to the Bluetooth hint', async () => {
    // The most common real cause on iOS is AirPods holding the session in a
    // routing mode the recorder can't switch out of. Closing other apps
    // doesn't help; disconnecting Bluetooth does.
    recorder.startRecorder.mockRejectedValue(
      new Error('audio session was hijacked'),
    );
    const { result } = renderHook(() => useAudioRecorder());

    await startRecording(result);

    expect(result.current.error).toMatch(/bluetooth|airpods/i);
  });

  it('falls back to a generic message for an unknown failure', async () => {
    recorder.startRecorder.mockRejectedValue(new Error('something odd'));
    const { result } = renderHook(() => useAudioRecorder());

    await startRecording(result);

    expect(result.current.error).toBeTruthy();
    expect(result.current.isRecording).toBe(false);
  });
});

describe('stopping', () => {
  it('returns the saved file path', async () => {
    // stopRecorder()'s return value IS the path — dropping it loses the
    // recording entirely.
    const { result } = renderHook(() => useAudioRecorder());
    await startRecording(result);

    let uri: string | null = null;
    await act(async () => {
      uri = await result.current.stop();
    });

    expect(uri).toBe('file:///cache/rec.m4a');
    expect(result.current.isRecording).toBe(false);
  });

  it('removes the listener on stop', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await startRecording(result);
    recorder.removeRecordBackListener.mockClear();

    await act(async () => {
      await result.current.stop();
    });

    expect(recorder.removeRecordBackListener).toHaveBeenCalled();
  });

  it('does not call stopRecorder when not recording', async () => {
    // stopRecorder() on an idle recorder can throw on iOS, which is why the
    // guard is a synchronous ref rather than state.
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.stop();
    });

    expect(recorder.stopRecorder).not.toHaveBeenCalled();
  });

  it('still clears recording state when stopRecorder throws', async () => {
    recorder.stopRecorder.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAudioRecorder());
    await startRecording(result);

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.isRecording).toBe(false);
  });
});

describe('the 120s cap', () => {
  it('caps at two minutes', () => {
    expect(MAX_RECORDING_MS).toBe(120_000);
  });

  it('auto-stops when the cap is reached', async () => {
    // No duration cap exists anywhere in this app today. It is both a UX
    // guard and a cost control — transcription bills per minute.
    const { result } = renderHook(() => useAudioRecorder());
    await startRecording(result);

    const listener = recorder.addRecordBackListener.mock.calls[0][0];
    await act(async () => {
      listener({ currentPosition: MAX_RECORDING_MS });
    });

    expect(recorder.stopRecorder).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  it('does not auto-stop below the cap', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await startRecording(result);

    const listener = recorder.addRecordBackListener.mock.calls[0][0];
    act(() => listener({ currentPosition: MAX_RECORDING_MS - 1000 }));

    expect(recorder.stopRecorder).not.toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });

  it('surfaces the auto-stopped recording through onAutoStop', async () => {
    const onAutoStop = jest.fn();
    const { result } = renderHook(() => useAudioRecorder({ onAutoStop }));
    await startRecording(result);

    const listener = recorder.addRecordBackListener.mock.calls[0][0];
    await act(async () => {
      listener({ currentPosition: MAX_RECORDING_MS });
    });

    expect(onAutoStop).toHaveBeenCalledWith('file:///cache/rec.m4a');
  });
});

describe('cancelling', () => {
  it('stops without returning a uri', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await startRecording(result);

    await act(async () => {
      await result.current.cancel();
    });

    expect(recorder.stopRecorder).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.elapsedMs).toBe(0);
  });
});

describe('cleanup', () => {
  it('stops an in-flight recording on unmount', async () => {
    // Otherwise the mic stays hot after the user navigates away, and on iOS
    // the orange recording indicator stays lit.
    const { result, unmount } = renderHook(() => useAudioRecorder());
    await startRecording(result);

    unmount();

    expect(recorder.stopRecorder).toHaveBeenCalled();
    expect(recorder.removeRecordBackListener).toHaveBeenCalled();
  });

  it('does not call stopRecorder on unmount when idle', async () => {
    const { unmount } = renderHook(() => useAudioRecorder());

    unmount();

    expect(recorder.stopRecorder).not.toHaveBeenCalled();
  });
});
