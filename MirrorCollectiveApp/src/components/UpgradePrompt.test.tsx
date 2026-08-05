import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

import UpgradePrompt from './UpgradePrompt';

describe('UpgradePrompt', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the trial_expired copy and both actions', () => {
    const { getByText } = render(
      <UpgradePrompt visible onClose={jest.fn()} reason="trial_expired" />,
    );
    expect(getByText('Trial Expired')).toBeTruthy();
    expect(getByText(/14-day trial has ended/)).toBeTruthy();
    expect(getByText('UPGRADE NOW')).toBeTruthy();
    expect(getByText('Not Now')).toBeTruthy();
  });

  it('routes to the paywall and closes on UPGRADE NOW', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <UpgradePrompt visible onClose={onClose} reason="trial_expired" />,
    );
    fireEvent.press(getByText('UPGRADE NOW'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('StartFreeTrial');
  });

  it('closes without navigating on Not Now', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <UpgradePrompt visible onClose={onClose} reason="trial_expired" />,
    );
    fireEvent.press(getByText('Not Now'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
