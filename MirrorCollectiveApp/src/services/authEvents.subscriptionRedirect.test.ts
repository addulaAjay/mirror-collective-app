/**
 * The paywall redirect has to be observable synchronously.
 *
 * Production, 2026-10-11: adding an Echo Vault recipient crashed the app every
 * time for a lapsed-trial user. A 403 carrying `subscription_required` made
 * `base.ts` emit, `App.tsx` call `navigate('StartFreeTrial')`, and — in the
 * same tick — `AddNewProfileScreen` fire `Alert.alert`. Presenting an alert
 * while a navigation transition is in flight is a hard crash on iOS.
 *
 * The shipped mitigation was server-side: stop sending the `subscription_required`
 * code so the emit never happens. That leaves the client race fully intact —
 * flipping `ECHO_VAULT_EMIT_SUBSCRIPTION_CODE` back on re-breaks every shipped
 * client. This is the client-side half: a screen must be able to ask "did a
 * paywall redirect just fire?" and stay quiet if so.
 *
 * It has to be SYNCHRONOUS. `base.ts` emits before returning the response, so
 * by the time the caller inspects `response.success` the flag is already set —
 * but only if reading it doesn't require awaiting anything.
 */

import { authEvents } from './authEvents';

describe('subscription redirect flag', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    authEvents.clearSubscriptionRedirect();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is not in flight before anything happens', () => {
    expect(authEvents.isSubscriptionRedirectInFlight()).toBe(false);
  });

  it('is in flight immediately after emit, with no await', () => {
    // The whole point: readable in the same tick as the emit.
    authEvents.emitSubscriptionRequired();

    expect(authEvents.isSubscriptionRedirectInFlight()).toBe(true);
  });

  it('is still in flight while the transition could plausibly be running', () => {
    authEvents.emitSubscriptionRequired();
    jest.advanceTimersByTime(1000);

    expect(authEvents.isSubscriptionRedirectInFlight()).toBe(true);
  });

  it('expires so a later unrelated error is NOT swallowed', () => {
    // Without expiry, one lapsed-trial 403 would mute every error alert for
    // the rest of the session.
    authEvents.emitSubscriptionRequired();
    jest.advanceTimersByTime(5000);

    expect(authEvents.isSubscriptionRedirectInFlight()).toBe(false);
  });

  it('can be cleared explicitly', () => {
    authEvents.emitSubscriptionRequired();
    authEvents.clearSubscriptionRedirect();

    expect(authEvents.isSubscriptionRedirectInFlight()).toBe(false);
  });

  it('still notifies listeners — the redirect itself must keep working', () => {
    // The flag suppresses a duplicate alert; it must not suppress the paywall.
    const listener = jest.fn();
    const unsubscribe = authEvents.onSubscriptionRequired(listener);

    authEvents.emitSubscriptionRequired();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('a listener that throws does not stop the flag being set', () => {
    authEvents.onSubscriptionRequired(() => {
      throw new Error('navigation blew up');
    });

    authEvents.emitSubscriptionRequired();

    expect(authEvents.isSubscriptionRedirectInFlight()).toBe(true);
  });
});
