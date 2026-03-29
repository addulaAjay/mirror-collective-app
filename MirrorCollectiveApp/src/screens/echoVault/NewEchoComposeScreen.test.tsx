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
}));
jest.mock('react-native-audio-recorder-player', () => ({
  default: jest.fn().mockImplementation(() => ({
    startRecorder: jest.fn(),
    stopRecorder: jest.fn(),
    removeRecordBackListener: jest.fn(),
  })),
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
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));

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
      expect(getByPlaceholderText(/write your message/i)).toBeTruthy();
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

      const { getByPlaceholderText, getByText } = render(
        <NewEchoComposeScreen route={route} navigation={jest.fn() as any} />
      );

      // Fill in echo content
      const textInput = getByPlaceholderText(/write your message/i);
      fireEvent.changeText(textInput, 'This is my echo message');

      // Find and press save button (look for "SAVE" text)
      const saveButton = getByText(/SAVE/i);
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

      const { getByPlaceholderText, getByText } = render(
        <NewEchoComposeScreen route={route} navigation={jest.fn() as any} />
      );

      const textInput = getByPlaceholderText(/write your message/i);
      fireEvent.changeText(textInput, 'Test message without guardian');

      const saveButton = getByText(/SAVE/i);
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
