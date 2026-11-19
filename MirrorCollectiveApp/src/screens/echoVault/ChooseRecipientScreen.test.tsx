import { fireEvent, render, waitFor } from '@testing-library/react-native';
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
const RECIPIENTS = [
  { recipient_id: 'r1', user_id: 'u', name: 'Caroline', email: 'c@x.com', created_at: '' },
  { recipient_id: 'r2', user_id: 'u', name: 'Sam', email: 's@x.com', created_at: '' },
  { recipient_id: 'r3', user_id: 'u', name: 'Ali', email: 'a@x.com', created_at: '' },
];

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
      getByText('(Echo is sent immediately if lock date is not set)'),
    ).toBeTruthy();
  });
});

describe('ChooseRecipientScreen — multiple recipients', () => {
  // An echo can now go to several people at once. The backend fans out to one
  // row per recipient sharing a group_id; this screen just has to collect more
  // than one and hand the list on.
  const { echoApiService } = require('@services/api/echo');

  const openPicker = async () => {
    echoApiService.getRecipients.mockResolvedValue({
      success: true,
      data: RECIPIENTS,
    });
    const utils = render(
      <ChooseRecipientScreen
        navigation={nav as never}
        route={{ params: { title: 'T', category: 'C' } } as never}
      />,
    );
    await waitFor(() => utils.getByText('Choose from list'));
    fireEvent.press(utils.getByText('Choose from list'));
    await waitFor(() => utils.getByText('Caroline'));
    return utils;
  };

  beforeEach(() => jest.clearAllMocks());

  it('shows a single name when one is chosen', async () => {
    const { getByText, getAllByText, queryByText } = await openPicker();

    fireEvent.press(getByText('Caroline'));

    // The trigger shows the name itself - "1 recipient" would read worse.
    // Both the row and the trigger carry it, hence getAllByText.
    await waitFor(() => {
      expect(queryByText('1 recipient')).toBeNull();
      expect(getAllByText(/Caroline/).length).toBeGreaterThan(0);
    });
  });

  it('shows a count once more than one is chosen', async () => {
    const { getByText } = await openPicker();

    fireEvent.press(getByText('Caroline'));
    fireEvent.press(getByText('Sam'));

    await waitFor(() => expect(getByText('2 recipients')).toBeTruthy());
  });

  it('keeps the list open so several can be picked in a row', async () => {
    // Closing after each tap would turn picking five into a five-tap-reopen
    // chore.
    const { getByText } = await openPicker();

    fireEvent.press(getByText('Caroline'));

    await waitFor(() => expect(getByText('Sam')).toBeTruthy());
  });

  it('deselects on a second tap', async () => {
    const { getByText, getAllByText, queryByText } = await openPicker();

    fireEvent.press(getByText('Caroline'));
    fireEvent.press(getByText('Sam'));
    await waitFor(() => getByText('2 recipients'));
    fireEvent.press(getAllByText(/Sam/)[0]);

    // Back to one, so the trigger stops showing a count.
    await waitFor(() => expect(queryByText('2 recipients')).toBeNull());
  });

  it('passes the full list onward when several are chosen', async () => {
    const { getByText } = await openPicker();

    fireEvent.press(getByText('Caroline'));
    fireEvent.press(getByText('Sam'));
    await waitFor(() => getByText('2 recipients'));
    fireEvent.press(getByText('NEXT'));

    await waitFor(() => {
      const params = nav.navigate.mock.calls.at(-1)[1];
      expect(params.recipientIds).toEqual(['r1', 'r2']);
      expect(params.recipientNames).toEqual(['Caroline', 'Sam']);
    });
  });

  it('still sends the singular params for one recipient', async () => {
    // The compose screen's header and labels read these; a single-recipient
    // send must look exactly as it always did.
    const { getByText } = await openPicker();

    fireEvent.press(getByText('Caroline'));
    fireEvent.press(getByText('NEXT'));

    await waitFor(() => {
      const params = nav.navigate.mock.calls.at(-1)[1];
      expect(params.recipientId).toBe('r1');
      expect(params.recipientName).toBe('Caroline');
      expect(params.recipientIds).toBeUndefined();
    });
  });
});
