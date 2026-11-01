/**
 * Adding a recipient must not race the paywall redirect.
 *
 * Production, 2026-10-11: this screen crashed the app every time for a user
 * whose trial had lapsed. The sequence:
 *
 *   1. addRecipient() -> 403 carrying `subscription_required`
 *   2. base.ts emits -> App.tsx calls navigate('StartFreeTrial')
 *   3. this screen, same tick, calls Alert.alert('Error', ...)
 *
 * Presenting an alert while a navigation transition is in flight is a hard
 * crash on iOS. Deterministic, hence "every time".
 *
 * The mitigation that shipped was server-side — stop sending the code, so step
 * 2 never happens. That leaves this race fully intact: flipping
 * ECHO_VAULT_EMIT_SUBSCRIPTION_CODE back on re-breaks every shipped client.
 * These tests pin the client half.
 *
 * Note the alert is SUPPRESSED, not deferred. Deferring would pop an
 * "Error: ..." alert on top of the paywall the user was just sent to, which
 * explains the situation perfectly well on its own.
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, TextInput } from 'react-native';

import { echoApiService } from '@services/api/echo';
import { authEvents } from '@services/authEvents';

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
const mockAddRecipient = echoApiService.addRecipient as jest.Mock;

/**
 * Fill the form and submit.
 *
 * Inputs are addressed by type, not placeholder: `TextInputField` renders its
 * placeholder as a custom <Text> overlay rather than the native prop, so
 * getByPlaceholderText cannot see it. Order is [name, email].
 */
const submitForm = (utils: ReturnType<typeof render>) => {
  const inputs = utils.UNSAFE_getAllByType(TextInput);
  fireEvent.changeText(inputs[0], 'Caroline');
  fireEvent.changeText(inputs[1], 'caroline@example.com');
  fireEvent.press(utils.getByText('ADD'));
};

describe('AddNewProfileScreen — paywall redirect race', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    authEvents.clearSubscriptionRedirect();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
    authEvents.clearSubscriptionRedirect();
  });

  it('does NOT alert when a paywall redirect is in flight', async () => {
    // What base.ts does on a subscription_required 403, before returning.
    mockAddRecipient.mockImplementation(async () => {
      authEvents.emitSubscriptionRequired();
      return { success: false, error: 'An active trial or subscription is required.' };
    });

    const utils = render(
      <AddNewProfileScreen navigation={nav as never} route={{ params: {} } as never} />,
    );
    submitForm(utils);

    await waitFor(() => expect(mockAddRecipient).toHaveBeenCalled());
    const errorAlerts = alertSpy.mock.calls.filter(c => c[0] === 'Error');
    expect(errorAlerts).toHaveLength(0);
  });

  it('DOES alert for an ordinary failure with no redirect', async () => {
    // The guard must not swallow unrelated errors.
    mockAddRecipient.mockResolvedValue({
      success: false,
      error: 'Recipient already exists',
    });

    const utils = render(
      <AddNewProfileScreen navigation={nav as never} route={{ params: {} } as never} />,
    );
    submitForm(utils);

    await waitFor(() => {
      const errorAlerts = alertSpy.mock.calls.filter(c => c[0] === 'Error');
      expect(errorAlerts).toHaveLength(1);
    });
  });

  it('does NOT alert when a thrown error coincides with a redirect', async () => {
    // The catch branch raced too — same crash, different line.
    mockAddRecipient.mockImplementation(async () => {
      authEvents.emitSubscriptionRequired();
      throw new Error('Request failed with status 403');
    });

    const utils = render(
      <AddNewProfileScreen navigation={nav as never} route={{ params: {} } as never} />,
    );
    submitForm(utils);

    await waitFor(() => expect(mockAddRecipient).toHaveBeenCalled());
    const errorAlerts = alertSpy.mock.calls.filter(c => c[0] === 'Error');
    expect(errorAlerts).toHaveLength(0);
  });

  it('still alerts on a thrown error with no redirect', async () => {
    mockAddRecipient.mockRejectedValue(new Error('Network unreachable'));

    const utils = render(
      <AddNewProfileScreen navigation={nav as never} route={{ params: {} } as never} />,
    );
    submitForm(utils);

    await waitFor(() => {
      const errorAlerts = alertSpy.mock.calls.filter(c => c[0] === 'Error');
      expect(errorAlerts).toHaveLength(1);
    });
  });

  it('a successful add is unaffected', async () => {
    mockAddRecipient.mockResolvedValue({ success: true, data: {} });

    const utils = render(
      <AddNewProfileScreen navigation={nav as never} route={{ params: {} } as never} />,
    );
    submitForm(utils);

    await waitFor(() => {
      const successAlerts = alertSpy.mock.calls.filter(c => c[0] === 'Success');
      expect(successAlerts).toHaveLength(1);
    });
  });
});
