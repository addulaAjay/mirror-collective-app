/**
 * Attachment handling in useChat (Phase 3).
 *
 * Kept in its own file rather than bolted onto useChat.test.ts: that suite
 * pins the existing text-only behaviour and is worth leaving undisturbed, and
 * the mock surface here is different (picker, prepare, base64 read).
 */

import { act, renderHook } from '@testing-library/react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { prepareChatPhoto, readPhotoAsBase64 } from '@features/chat-media';
import { chatApiService } from '@services/api';
import { ensureCameraPermission } from '@utils/permissions/media';

import { useChat } from './useChat';

jest.mock('../../services/api', () => ({
  chatApiService: { sendMessage: jest.fn() },
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

jest.mock('@context/UserContext', () => ({
  useUser: () => ({ user: undefined }),
}));

jest.mock('@features/chat-media', () => ({
  prepareChatPhoto: jest.fn(),
  readPhotoAsBase64: jest.fn(),
  CHAT_PHOTO_ENABLED: true,
}));

jest.mock('@utils/permissions/media', () => ({
  ensureCameraPermission: jest.fn().mockResolvedValue(true),
  ensureMicPermission: jest.fn().mockResolvedValue(true),
}));

const mockSend = chatApiService.sendMessage as jest.Mock;
const mockPrepare = prepareChatPhoto as jest.Mock;
const mockReadBase64 = readPhotoAsBase64 as jest.Mock;
const mockLibrary = launchImageLibrary as jest.Mock;
const mockCamera = launchCamera as jest.Mock;
const mockCameraPermission = ensureCameraPermission as jest.Mock;

const PREPARED = {
  kind: 'image' as const,
  localUri: 'file:///tmp/small.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 300_000,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLibrary.mockResolvedValue({
    assets: [{ uri: 'file:///pick.jpg', type: 'image/jpeg', fileName: 'p.jpg' }],
  });
  mockCamera.mockResolvedValue({
    assets: [{ uri: 'file:///shot.jpg', type: 'image/jpeg' }],
  });
  mockPrepare.mockResolvedValue(PREPARED);
  mockReadBase64.mockResolvedValue('QUJD');
  mockCameraPermission.mockResolvedValue(true);
  mockSend.mockResolvedValue({
    success: true,
    data: {
      response: 'A still surface.',
      session_metadata: { conversation_id: 'conv-1' },
    },
  });
});

const setup = () => renderHook(() => useChat());

describe('staging a photo', () => {
  it('stages a picked photo', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].localUri).toBe('file:///tmp/small.jpg');
  });

  it('prepares the photo at PICK time, not send time', async () => {
    // Doing the HEIC decode + compress on pick is what keeps the send tap
    // responsive now that there is no background upload to hide it behind.
    const { result } = setup();

    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    expect(mockPrepare).toHaveBeenCalledTimes(1);
    expect(mockReadBase64).not.toHaveBeenCalled();
  });

  it('exposes a preparing flag while the photo is being processed', async () => {
    // The flag can only flip AFTER the picker promise resolves, so this waits
    // for that rather than asserting synchronously after the call.
    let resolvePrepare: (v: unknown) => void = () => {};
    mockPrepare.mockReturnValue(
      new Promise(res => {
        resolvePrepare = res;
      }),
    );

    const { result } = setup();

    let pending: Promise<void> | undefined;
    await act(async () => {
      pending = result.current.pickPhotoFromLibrary();
      // Let the picker's own await settle so stagePickedAsset is entered.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.preparing).toBe(true);

    await act(async () => {
      resolvePrepare(PREPARED);
      await pending;
    });

    expect(result.current.preparing).toBe(false);
    expect(result.current.attachments).toHaveLength(1);
  });

  it('replaces the staged photo when a second one is picked (V1 allows one)', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });
    mockPrepare.mockResolvedValue({ ...PREPARED, localUri: 'file:///second.jpg' });
    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].localUri).toBe('file:///second.jpg');
  });

  it('does nothing when the user cancels the picker', async () => {
    mockLibrary.mockResolvedValue({ didCancel: true });
    const { result } = setup();

    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    expect(result.current.attachments).toHaveLength(0);
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  it('surfaces a prepare failure as a system message rather than throwing', async () => {
    mockPrepare.mockRejectedValue(new Error('too large to share'));
    const { result } = setup();

    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    expect(result.current.attachments).toHaveLength(0);
    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.sender).toBe('system');
    expect(last.text).toMatch(/too large/i);
  });

  it('removes a staged photo', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    act(() => {
      result.current.removeAttachment();
    });

    expect(result.current.attachments).toHaveLength(0);
  });
});

describe('taking a photo with the camera', () => {
  it('requests camera permission first', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.takePhoto();
    });

    expect(mockCameraPermission).toHaveBeenCalled();
    expect(mockCamera).toHaveBeenCalled();
  });

  it('does not launch the camera when permission is denied', async () => {
    mockCameraPermission.mockResolvedValue(false);
    const { result } = setup();

    await act(async () => {
      await result.current.takePhoto();
    });

    expect(mockCamera).not.toHaveBeenCalled();
    expect(result.current.attachments).toHaveLength(0);
  });

  it('does NOT request permission for the library (system picker grants implicitly)', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    expect(mockCameraPermission).not.toHaveBeenCalled();
  });
});

describe('sending a photo', () => {
  it('reads base64 at SEND time and includes it in the request', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });
    act(() => result.current.setDraft('what do you see?'));

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(mockReadBase64).toHaveBeenCalledWith('file:///tmp/small.jpg');
    const payload = mockSend.mock.calls[0][0];
    expect(payload.attachments).toEqual([
      { kind: 'image', mime_type: 'image/jpeg', data_base64: 'QUJD' },
    ]);
  });

  it('sends a photo with no caption', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].message).toBe('');
  });

  it('still refuses to send when there is neither text nor a photo', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('omits the attachments field entirely for a text-only turn', async () => {
    // Sending `attachments: []` would be a needless schema edge for the
    // backend to special-case.
    const { result } = setup();
    act(() => result.current.setDraft('just words'));

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(mockSend.mock.calls[0][0].attachments).toBeUndefined();
  });

  it('attaches the photo to the optimistic user message so it renders', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    const userMsg = result.current.messages.find(m => m.sender === 'user');
    expect(userMsg?.attachments).toHaveLength(1);
  });

  it('clears the staged photo after a successful send', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.attachments).toHaveLength(0);
  });

  it('KEEPS the staged photo when the send fails, so retry does not lose it', async () => {
    mockSend.mockResolvedValue({ success: false, error: 'boom' });
    const { result } = setup();
    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.attachments).toHaveLength(1);
  });

  it('keeps the staged photo when reading its bytes fails', async () => {
    mockReadBase64.mockRejectedValue(new Error('ENOENT'));
    const { result } = setup();
    await act(async () => {
      await result.current.pickPhotoFromLibrary();
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
