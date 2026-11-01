import { Alert, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';

import { ensureCameraPermission, ensureMicPermission } from './media';

jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getMicrophonePermissionStatus: jest.fn(),
    requestMicrophonePermission: jest.fn(),
    getCameraPermissionStatus: jest.fn(),
    requestCameraPermission: jest.fn(),
  },
}));

const mockCamera = Camera as unknown as {
  getMicrophonePermissionStatus: jest.Mock;
  requestMicrophonePermission: jest.Mock;
  getCameraPermissionStatus: jest.Mock;
  requestCameraPermission: jest.Mock;
};

/** Pull the button handlers out of the last Alert.alert call. */
const lastAlertButtons = () => {
  const calls = (Alert.alert as jest.Mock).mock.calls;
  return calls[calls.length - 1][2] as Array<{
    text: string;
    onPress?: () => void;
  }>;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ensureMicPermission', () => {
  it('returns true without prompting when permission is already granted', async () => {
    mockCamera.getMicrophonePermissionStatus.mockReturnValue('granted');

    await expect(ensureMicPermission()).resolves.toBe(true);

    expect(mockCamera.requestMicrophonePermission).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('requests permission when undetermined and returns true once granted', async () => {
    // The fresh-install case. audio-recorder-player v4 does NOT auto-prompt on
    // iOS, so startRecorder() throws unless we request explicitly first.
    mockCamera.getMicrophonePermissionStatus.mockReturnValue('not-determined');
    mockCamera.requestMicrophonePermission.mockResolvedValue('granted');

    await expect(ensureMicPermission()).resolves.toBe(true);

    expect(mockCamera.requestMicrophonePermission).toHaveBeenCalledTimes(1);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('returns false and offers Settings when the request is denied', async () => {
    mockCamera.getMicrophonePermissionStatus.mockReturnValue('not-determined');
    mockCamera.requestMicrophonePermission.mockResolvedValue('denied');

    await expect(ensureMicPermission()).resolves.toBe(false);

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const buttons = lastAlertButtons();
    expect(buttons.map(b => b.text)).toEqual(['Cancel', 'Open Settings']);
  });

  it('opens the OS settings screen when the user taps Open Settings', async () => {
    mockCamera.getMicrophonePermissionStatus.mockReturnValue('denied');
    mockCamera.requestMicrophonePermission.mockResolvedValue('denied');

    await ensureMicPermission();
    lastAlertButtons()
      .find(b => b.text === 'Open Settings')
      ?.onPress?.();

    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });

  it('skips the request entirely when permission is restricted', async () => {
    // iOS parental controls / MDM. Requesting cannot succeed, so go straight
    // to the Settings prompt instead of firing a no-op request.
    mockCamera.getMicrophonePermissionStatus.mockReturnValue('restricted');

    await expect(ensureMicPermission()).resolves.toBe(false);

    expect(mockCamera.requestMicrophonePermission).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('suppresses the Settings alert when called with { silent: true }', async () => {
    mockCamera.getMicrophonePermissionStatus.mockReturnValue('not-determined');
    mockCamera.requestMicrophonePermission.mockResolvedValue('denied');

    await expect(ensureMicPermission({ silent: true })).resolves.toBe(false);

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('returns false rather than throwing when the native module rejects', async () => {
    mockCamera.getMicrophonePermissionStatus.mockReturnValue('not-determined');
    mockCamera.requestMicrophonePermission.mockRejectedValue(
      new Error('native module unavailable'),
    );

    await expect(ensureMicPermission()).resolves.toBe(false);
  });

  it('returns false rather than throwing when reading the status throws', async () => {
    mockCamera.getMicrophonePermissionStatus.mockImplementation(() => {
      throw new Error('no native module');
    });

    await expect(ensureMicPermission({ silent: true })).resolves.toBe(false);
  });
});

describe('ensureCameraPermission', () => {
  it('returns true without prompting when already granted', async () => {
    mockCamera.getCameraPermissionStatus.mockReturnValue('granted');

    await expect(ensureCameraPermission()).resolves.toBe(true);

    expect(mockCamera.requestCameraPermission).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('requests and returns true once granted', async () => {
    mockCamera.getCameraPermissionStatus.mockReturnValue('not-determined');
    mockCamera.requestCameraPermission.mockResolvedValue('granted');

    await expect(ensureCameraPermission()).resolves.toBe(true);
    expect(mockCamera.requestCameraPermission).toHaveBeenCalledTimes(1);
  });

  it('offers Settings with camera-specific copy when denied', async () => {
    mockCamera.getCameraPermissionStatus.mockReturnValue('not-determined');
    mockCamera.requestCameraPermission.mockResolvedValue('denied');

    await expect(ensureCameraPermission()).resolves.toBe(false);

    const [title, body] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(`${title} ${body}`.toLowerCase()).toContain('camera');
    expect(`${title} ${body}`.toLowerCase()).not.toContain('microphone');
  });

  it('does not touch the microphone permission', async () => {
    mockCamera.getCameraPermissionStatus.mockReturnValue('granted');

    await ensureCameraPermission();

    expect(mockCamera.getMicrophonePermissionStatus).not.toHaveBeenCalled();
    expect(mockCamera.requestMicrophonePermission).not.toHaveBeenCalled();
  });
});
