import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AUTO_READ_STORAGE_KEY,
} from '@services/speech';
import { SpeechSettingsRow } from './SpeechSettingsRow';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SpeechSettingsRow', () => {
  it('renders the title and accessible switch', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const { getByText, getByTestId } = render(<SpeechSettingsRow />);
    expect(getByText('Auto-read Mirror replies')).toBeTruthy();
    expect(getByTestId('settings-auto-read-switch')).toBeTruthy();
    await waitFor(() =>
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(AUTO_READ_STORAGE_KEY),
    );
  });

  it('persists toggle change to AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const { getByTestId } = render(<SpeechSettingsRow />);
    const sw = getByTestId('settings-auto-read-switch');
    fireEvent(sw, 'valueChange', true);
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        AUTO_READ_STORAGE_KEY,
        'true',
      ),
    );
  });
});
