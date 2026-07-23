import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import { echoApiService } from '@services/api/echo';
import { pickProfilePhoto } from '@utils/media/pickProfilePhoto';

import AddNewProfileScreen from './AddNewProfileScreen';

jest.mock('@services/tokenManager', () => ({
  tokenManager: { getValidToken: jest.fn().mockResolvedValue('t') },
}));
jest.mock('@services/api/echo', () => ({
  echoApiService: {
    getUploadUrl: jest.fn(),
    uploadMedia: jest.fn(),
    updateRecipientPhoto: jest.fn(),
    addRecipient: jest.fn(),
    addGuardian: jest.fn(),
  },
}));
jest.mock('@utils/media/pickProfilePhoto', () => ({ pickProfilePhoto: jest.fn() }));
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/BackgroundWrapper', () => {
  const react = require('react');
  return ({ children }: { children: React.ReactNode }) =>
    react.createElement('BackgroundWrapper', null, children);
});

const nav = { navigate: jest.fn(), goBack: jest.fn() };
const editRecipient = {
  recipient_id: 'r-1',
  name: 'James',
  email: 'james@email.com',
  profile_image_url: 'https://cdn.example/existing.jpg',
};

describe('AddNewProfileScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('edit mode renders EDIT PROFILE, SAVE, and the Edit Image overlay', () => {
    const { getByText } = render(
      <AddNewProfileScreen
        navigation={nav as never}
        route={{ params: { editRecipient } } as never}
      />,
    );
    expect(getByText('EDIT PROFILE')).toBeTruthy();
    expect(getByText('SAVE')).toBeTruthy();
    expect(getByText('Edit Image +')).toBeTruthy();
  });

  it('create mode still renders ADD PROFILE / ADD / Add Image', () => {
    const { getByText } = render(
      <AddNewProfileScreen
        navigation={nav as never}
        route={{ params: undefined } as never}
      />,
    );
    expect(getByText('ADD PROFILE')).toBeTruthy();
    expect(getByText('ADD')).toBeTruthy();
    expect(getByText('Add Image +')).toBeTruthy();
  });

  it('on save, uploads the new photo and PATCHes the recipient', async () => {
    (pickProfilePhoto as jest.Mock).mockResolvedValue({ uri: 'file:///new.jpg' });
    (echoApiService.getUploadUrl as jest.Mock).mockResolvedValue({
      success: true,
      data: { upload_url: 'https://put', media_url: 'https://cdn.example/new.jpg' },
    });
    (echoApiService.uploadMedia as jest.Mock).mockResolvedValue(undefined);
    (echoApiService.updateRecipientPhoto as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { getByText, getByLabelText } = render(
      <AddNewProfileScreen
        navigation={nav as never}
        route={{ params: { editRecipient } } as never}
      />,
    );

    // Pick a new photo, then save.
    fireEvent.press(getByLabelText('Add photo from gallery'));
    await waitFor(() => expect(pickProfilePhoto).toHaveBeenCalled());
    fireEvent.press(getByText('SAVE'));

    await waitFor(() =>
      expect(echoApiService.updateRecipientPhoto).toHaveBeenCalledWith(
        'r-1',
        'https://cdn.example/new.jpg',
      ),
    );
    // Name/email are never sent through an update-recipient call.
    expect(echoApiService.addRecipient).not.toHaveBeenCalled();
  });
});
