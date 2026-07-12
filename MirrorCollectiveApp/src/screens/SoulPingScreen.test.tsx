import { render } from '@testing-library/react-native';
import React from 'react';

import SoulPingScreen from './SoulPingScreen';

const mockMarkRead = jest.fn().mockResolvedValue({ success: true });
jest.mock('@services/api', () => ({
  soulPingApiService: {
    markRead: (...args: unknown[]) => mockMarkRead(...args),
  },
}));

let mockParams: Record<string, unknown> = {};
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: mockParams }),
  };
});

jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/BackgroundWrapper', () => 'BackgroundWrapper');
jest.mock('@components/Button', () => 'Button');

describe('SoulPingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it('reports the ping as seen on mount when a pingId is present', () => {
    mockParams = { pingId: 'ping-1', category: 'emotional', title: 'Hi', body: 'x' };

    render(<SoulPingScreen />);

    expect(mockMarkRead).toHaveBeenCalledTimes(1);
    expect(mockMarkRead).toHaveBeenCalledWith('ping-1');
  });

  it('does not report when there is no pingId', () => {
    mockParams = { category: 'emotional', title: 'Hi', body: 'x' };

    render(<SoulPingScreen />);

    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('renders the ping copy from params', () => {
    mockParams = { pingId: 'p1', title: 'A pattern', body: 'You keep circling stress.' };

    const { getByText } = render(<SoulPingScreen />);

    expect(getByText('A pattern')).toBeTruthy();
    expect(getByText('You keep circling stress.')).toBeTruthy();
  });
});
