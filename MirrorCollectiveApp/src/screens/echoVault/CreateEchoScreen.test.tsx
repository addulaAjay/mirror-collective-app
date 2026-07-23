import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Keyboard } from 'react-native';

import CreateEchoScreen from './CreateEchoScreen';

jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/BackgroundWrapper', () => {
  const react = require('react');
  return ({ children }: { children: React.ReactNode }) =>
    react.createElement('BackgroundWrapper', null, children);
});
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));
jest.mock('react-native-audio-recorder-player', () => ({
  __esModule: true,
  default: {
    startRecorder: jest.fn(() => Promise.resolve('file:///rec.m4a')),
    stopRecorder: jest.fn(() => Promise.resolve()),
    startPlayer: jest.fn(() => Promise.resolve()),
    stopPlayer: jest.fn(() => Promise.resolve()),
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    addPlaybackEndListener: jest.fn(),
    removePlaybackEndListener: jest.fn(),
    setSubscriptionDuration: jest.fn(),
  },
}));
jest.mock('@services/api/echo', () => ({
  echoApiService: {
    getEcho: jest.fn(),
    createEcho: jest.fn(),
    updateEcho: jest.fn(),
    uploadEchoAttachment: jest.fn(),
    releaseEcho: jest.fn(),
    removeAttachment: jest.fn(),
  },
}));

describe('CreateEchoScreen — keyboard dismissal', () => {
  beforeEach(() => jest.clearAllMocks());

  // The Message field is multiline, so its Return key can't dismiss the
  // keyboard. Opening an attachment option must drop the keyboard so the
  // sheet/recorder isn't fighting it for space (and the cards stay reachable).
  it('dismisses the keyboard when opening the photo/video sheet', () => {
    const { getByText } = render(<CreateEchoScreen />);

    fireEvent.press(getByText('Add photo or video'));

    expect(Keyboard.dismiss).toHaveBeenCalled();
  });

  it('dismisses the keyboard when opening the voice recorder', () => {
    const { getByText } = render(<CreateEchoScreen />);

    fireEvent.press(getByText('Add voice recording'));

    expect(Keyboard.dismiss).toHaveBeenCalled();
  });
});
