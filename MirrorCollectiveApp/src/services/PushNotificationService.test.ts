/**
 * Tests for the payment-failure routing logic in PushNotificationService.
 *
 * We don't exercise the full FCM lifecycle (token registration, token
 * refresh) — that's covered by the existing infra. The new behavior
 * worth pinning down is:
 *   - Foreground `payment_failed` messages show an Alert with an
 *     "Update Payment" action that navigates to YourSubscription.
 *   - Background-tap and cold-start of a `payment_failed` notification
 *     navigates immediately.
 *   - Non-payment-failure messages still hit the legacy code path.
 */

/**
 * Override the global FCM mock from jest.setup.js with a jest.fn() so
 * each test can swap in the listener overrides it cares about. Hoisted
 * automatically by jest before module evaluation.
 */
jest.mock('@react-native-firebase/messaging', () => {
  const messagingFn: any = jest.fn(() => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    getToken: jest.fn(() => Promise.resolve('test-token')),
    onTokenRefresh: jest.fn(),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
  }));
  messagingFn.AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };
  return { __esModule: true, default: messagingFn, firebase: { messaging: messagingFn } };
});

jest.mock('@services/navigationRef', () => ({
  safeNavigate: jest.fn(() => true),
  navigationRef: { isReady: () => true, navigate: jest.fn() },
}));

jest.mock('@services/api/register-device', () => ({
  registerDeviceApiService: {
    registerDevice: jest.fn(() => Promise.resolve()),
    unregisterDevice: jest.fn(() => Promise.resolve()),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

import { safeNavigate } from '@services/navigationRef';

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * The default mock from jest.setup returns a fresh object each call,
 * which means the same `onMessage`/`getInitialNotification` jest.fn()s
 * aren't shared between calls. Override per-test with a stable object.
 */
function installMessagingMock(overrides: {
  onMessage?: jest.Mock;
  onNotificationOpenedApp?: jest.Mock;
  getInitialNotification?: jest.Mock;
} = {}) {
  const stub = {
    requestPermission: jest.fn(() => Promise.resolve(1)),
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    getToken: jest.fn(() => Promise.resolve('test-token')),
    onTokenRefresh: jest.fn(),
    onMessage: overrides.onMessage ?? jest.fn(),
    onNotificationOpenedApp: overrides.onNotificationOpenedApp ?? jest.fn(),
    getInitialNotification:
      overrides.getInitialNotification ?? jest.fn(() => Promise.resolve(null)),
  };
  (messaging as unknown as jest.Mock).mockImplementation(() => stub);
  return stub;
}

describe('PushNotificationService — payment-failure routing', () => {
  it('shows an action-bearing alert in foreground for payment_failed', async () => {
    const onMessage = jest.fn();
    installMessagingMock({ onMessage });

    // Re-import to pick up the messaging mock; the service is a
    // module-level singleton so we use require with module reset.
    jest.isolateModules(() => {
      const svc = require('./PushNotificationService').default;
      svc.initializeForegroundHandler();
    });

    // The registered handler is the first arg of onMessage.
    expect(onMessage).toHaveBeenCalledTimes(1);
    const handler = onMessage.mock.calls[0][0];

    // Realistic backend payload: generic lock-screen copy in the
    // visible notification, detailed in-app copy in data.
    await handler({
      notification: { title: 'Mirror Collective', body: 'Tap to open Mirror Collective' },
      data: {
        type: 'payment_failed',
        subscription_id: 'sub-1',
        in_app_title: "Payment couldn't be processed",
        in_app_body: "We couldn't renew your Mirror Collective subscription. Update your payment method to keep your subscription.",
      },
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    // Foreground alert should use the detailed in_app_* copy.
    const alertTitle = alertSpy.mock.calls[0][0];
    const alertBody = alertSpy.mock.calls[0][1];
    expect(alertTitle).toBe("Payment couldn't be processed");
    expect(alertBody).toContain('Update your payment method');

    const buttons = alertSpy.mock.calls[0][2];
    expect(Array.isArray(buttons)).toBe(true);
    const labels = (buttons as any[]).map(b => b.text);
    expect(labels).toContain('Update Payment');
    expect(labels).toContain('Later');

    // Tap "Update Payment" → navigates.
    const updateBtn = (buttons as any[]).find(b => b.text === 'Update Payment');
    updateBtn.onPress();
    expect(safeNavigate).toHaveBeenCalledWith('YourSubscription');
  });

  it('falls back to visible copy when data.in_app_* is missing (legacy payload)', async () => {
    // Defends against an old backend or third-party push with no
    // in_app_title/body. The alert still renders something usable.
    const onMessage = jest.fn();
    installMessagingMock({ onMessage });

    jest.isolateModules(() => {
      const svc = require('./PushNotificationService').default;
      svc.initializeForegroundHandler();
    });
    const handler = onMessage.mock.calls[0][0];

    await handler({
      notification: { title: 'Payment failed', body: 'tap to fix' },
      data: { type: 'payment_failed', subscription_id: 'sub-1' },
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe('Payment failed');
    expect(alertSpy.mock.calls[0][1]).toBe('tap to fix');
  });

  it('falls back to default alert for non-payment messages', async () => {
    const onMessage = jest.fn();
    installMessagingMock({ onMessage });

    jest.isolateModules(() => {
      const svc = require('./PushNotificationService').default;
      svc.initializeForegroundHandler();
    });

    const handler = onMessage.mock.calls[0][0];
    await handler({
      notification: { title: 'Hi', body: 'something else' },
      data: { type: 'insight_available' },
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    // No action buttons — single "View".
    const buttons = alertSpy.mock.calls[0][2];
    expect((buttons as any[]).length).toBe(1);
    expect((buttons as any[])[0].text).toBe('View');
    expect(safeNavigate).not.toHaveBeenCalled();
  });

  it('navigates on background tap of payment_failed notification', async () => {
    const onNotificationOpenedApp = jest.fn();
    installMessagingMock({ onNotificationOpenedApp });

    let svc: any;
    jest.isolateModules(() => {
      svc = require('./PushNotificationService').default;
    });
    // Force the private initializer; the public one is async/coupled
    // with token registration which isn't relevant here.
    (svc as any).initializeBackgroundTapHandler();

    expect(onNotificationOpenedApp).toHaveBeenCalledTimes(1);
    const handler = onNotificationOpenedApp.mock.calls[0][0];

    handler({ data: { type: 'payment_failed' } });
    expect(safeNavigate).toHaveBeenCalledWith('YourSubscription');
  });

  it('navigates on cold-start when initial notification is payment_failed', async () => {
    const getInitialNotification = jest.fn(() =>
      Promise.resolve({ data: { type: 'payment_failed' } }),
    );
    installMessagingMock({ getInitialNotification });

    let svc: any;
    jest.isolateModules(() => {
      svc = require('./PushNotificationService').default;
    });
    await (svc as any).handleColdStartNotification();

    expect(getInitialNotification).toHaveBeenCalledTimes(1);
    expect(safeNavigate).toHaveBeenCalledWith('YourSubscription');
  });

  it('cold-start handler is idempotent within a session', async () => {
    const getInitialNotification = jest.fn(() =>
      Promise.resolve({ data: { type: 'payment_failed' } }),
    );
    installMessagingMock({ getInitialNotification });

    let svc: any;
    jest.isolateModules(() => {
      svc = require('./PushNotificationService').default;
    });
    await (svc as any).handleColdStartNotification();
    await (svc as any).handleColdStartNotification();

    expect(getInitialNotification).toHaveBeenCalledTimes(1);
  });
});
