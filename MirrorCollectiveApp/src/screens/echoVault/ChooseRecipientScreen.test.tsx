import { render } from '@testing-library/react-native';
import React from 'react';

import ChooseRecipientScreen from './ChooseRecipientScreen';

jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/BackgroundWrapper', () => {
  const react = require('react');
  return ({ children }: { children: React.ReactNode }) =>
    react.createElement('BackgroundWrapper', null, children);
});
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: ({ children }: { children: React.ReactNode }) =>
    children,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@services/api/echo', () => ({
  echoApiService: {
    getRecipients: jest.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

const nav = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

describe('ChooseRecipientScreen', () => {
  it('warns that an unset lock date sends the echo immediately', () => {
    const { getByText } = render(
      <ChooseRecipientScreen
        navigation={nav as never}
        route={{ params: {} } as never}
      />,
    );

    expect(
      getByText('(echo is sent immediately if lock date is not set)'),
    ).toBeTruthy();
  });
});
