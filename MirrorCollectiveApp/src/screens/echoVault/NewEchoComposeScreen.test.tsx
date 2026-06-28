import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import { echoApiService } from '@services/api/echo';

import NewEchoComposeScreen from './NewEchoComposeScreen';

// Mock token manager first (before any API imports)
jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    storeTokens: jest.fn(),
    clearTokens: jest.fn(),
    isAuthenticated: jest.fn().mockResolvedValue(true),
    getValidToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

// Mock dependencies
jest.mock('@services/api/echo');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  // navigationRef.ts (imported transitively) calls this at module load.
  createNavigationContainerRef: () => ({
    isReady: jest.fn(() => false),
    navigate: jest.fn(),
    current: null,
  }),
}));
// The screen uses the default export directly as a singleton player
// (React.useRef(AudioRecorderPlayer).current), so default must be an object
// exposing the player methods — not a constructor.
jest.mock('react-native-audio-recorder-player', () => ({
  __esModule: true,
  default: {
    startRecorder: jest.fn().mockResolvedValue(undefined),
    stopRecorder: jest.fn().mockResolvedValue(undefined),
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    startPlayer: jest.fn().mockResolvedValue(undefined),
    stopPlayer: jest.fn().mockResolvedValue(undefined),
    addPlayBackListener: jest.fn(),
    removePlayBackListener: jest.fn(),
  },
}));
jest.mock('react-native-vision-camera', () => ({
  useCameraDevice: jest.fn(() => null),
  useCameraPermission: jest.fn(() => ({ hasPermission: true })),
  useMicrophonePermission: jest.fn(() => ({ hasPermission: true })),
  Camera: 'Camera',
}));
jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  types: {
    audio: 'audio',
    video: 'video',
    allFiles: 'allFiles',
  },
}));
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
// LogoHeader reads UserContext via useUser(); stub it so the screen renders
// without a UserProvider wrapper in the test.
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));

// The shared react-native mock (src/__tests__/jest.setup.js) omits Modal and
// Pressable, which this screen renders unconditionally (the upload/voice/video
// bottom sheets). Patch them in locally so render() doesn't hit an undefined
// element type.
const RN = jest.requireMock('react-native') as Record<string, unknown>;
RN.Modal = 'Modal';
RN.Pressable = 'Pressable';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('NewEchoComposeScreen - Guardian Support (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RED Phase - guardian_id parameter handling', () => {
    it('should receive guardian_id from route params', () => {
      const route = {
        params: {
          mode: 'text' as const,
          title: 'Test Echo',
          category: 'Memory',
          recipientId: 'r-001',
          recipientName: 'John',
          guardianId: 'g-001', // NEW: Guardian ID should be supported
        },
      };

      const { getByPlaceholderText } = render(
        <NewEchoComposeScreen route={route} navigation={jest.fn() as any} />
      );

      // Component should render without errors when guardianId is present
      expect(getByPlaceholderText(/write what you want to remember/i)).toBeTruthy();
    });

    it('should include guardian_id in createEcho API call when saving echo', async () => {
      const mockCreateEcho = jest.fn().mockResolvedValue({
        success: true,
        data: { echo_id: 'echo-001' },
      });
      (echoApiService.createEcho as jest.Mock) = mockCreateEcho;

      const route = {
        params: {
          mode: 'text' as const,
          title: 'Test Echo',
          category: 'Memory',
          recipientId: 'r-001',
          recipientName: 'John',
          guardianId: 'g-001',
        },
      };

      const { getByPlaceholderText, getAllByText } = render(
        <NewEchoComposeScreen route={route} navigation={jest.fn() as any} />
      );

      // Fill in echo content
      const textInput = getByPlaceholderText(/write what you want to remember/i);
      fireEvent.changeText(textInput, 'This is my echo message');

      // The voice/video bottom-sheets each render their own SAVE button, so
      // /SAVE/i matches several. The first match is the main compose SAVE.
      const saveButton = getAllByText(/SAVE/i)[0];
      fireEvent.press(saveButton);

      // Wait for API call
      await waitFor(() => {
        expect(mockCreateEcho).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Echo',
            category: 'Memory',
            echo_type: 'TEXT',
            recipient_id: 'r-001',
            guardian_id: 'g-001', // ✅ Must include guardian_id
            content: 'This is my echo message',
          })
        );
      });
    });

    it('should work without guardian_id for backward compatibility', async () => {
      const mockCreateEcho = jest.fn().mockResolvedValue({
        success: true,
        data: { echo_id: 'echo-002' },
      });
      (echoApiService.createEcho as jest.Mock) = mockCreateEcho;

      const route = {
        params: {
          mode: 'text' as const,
          title: 'Test Echo No Guardian',
          category: 'Gratitude',
          recipientId: 'r-002',
          recipientName: 'Jane',
          // No guardianId - should still work
        },
      };

      const { getByPlaceholderText, getAllByText } = render(
        <NewEchoComposeScreen route={route} navigation={jest.fn() as any} />
      );

      const textInput = getByPlaceholderText(/write what you want to remember/i);
      fireEvent.changeText(textInput, 'Test message without guardian');

      // The voice/video bottom-sheets each render their own SAVE button, so
      // /SAVE/i matches several. The first match is the main compose SAVE.
      const saveButton = getAllByText(/SAVE/i)[0];
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockCreateEcho).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Echo No Guardian',
            category: 'Gratitude',
            recipient_id: 'r-002',
            content: 'Test message without guardian',
          })
        );
        
        // Should NOT include guardian_id when not provided
        const callArgs = mockCreateEcho.mock.calls[0][0];
        expect(callArgs.guardian_id).toBeUndefined();
      });
    });
  });
});
