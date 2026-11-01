/**
 * Lightweight singleton pub/sub for auth lifecycle events.
 * Decouples the API layer from React context without circular imports.
 */
type Listener = () => void;

/**
 * How long after a paywall redirect fires we treat a navigation transition as
 * potentially still running.
 *
 * Long enough to cover the push animation (~350ms) with generous margin, short
 * enough that one lapsed-trial 403 doesn't mute unrelated error alerts for the
 * rest of the session.
 */
const SUBSCRIPTION_REDIRECT_WINDOW_MS = 3000;

class AuthEvents {
  private sessionExpiredListeners: Set<Listener> = new Set();
  private subscriptionRequiredListeners: Set<Listener> = new Set();
  /** When the last paywall redirect fired. See `isSubscriptionRedirectInFlight`. */
  private subscriptionRedirectAt: number | null = null;

  /** Register a callback for when the session expires. Returns an unsubscribe fn. */
  onSessionExpired(listener: Listener): () => void {
    this.sessionExpiredListeners.add(listener);
    return () => this.sessionExpiredListeners.delete(listener);
  }

  /** Called by BaseApiService when a 401 is detected or token refresh fails. */
  emitSessionExpired(): void {
    this.sessionExpiredListeners.forEach(listener => {
      try {
        listener();
      } catch (_) {}
    });
  }

  /**
   * Register a callback for when the server rejects a request with a
   * `subscription_required` entitlement error (403). The app uses this to route
   * the user to the paywall so they can subscribe. Returns an unsubscribe fn.
   */
  onSubscriptionRequired(listener: Listener): () => void {
    this.subscriptionRequiredListeners.add(listener);
    return () => this.subscriptionRequiredListeners.delete(listener);
  }

  /** Called by BaseApiService on a 403 whose body carries the
   *  `subscription_required` code (trial expired / never subscribed). */
  emitSubscriptionRequired(): void {
    // Stamped BEFORE notifying, so a listener that throws can't leave the flag
    // unset — the alert suppression below is a crash guard and must not depend
    // on navigation succeeding.
    this.subscriptionRedirectAt = Date.now();
    this.subscriptionRequiredListeners.forEach(listener => {
      try {
        listener();
      } catch (_) {}
    });
  }

  /**
   * Did a paywall redirect just fire?
   *
   * Screens use this to stay quiet instead of racing the redirect with their
   * own `Alert.alert`. Presenting an alert while a navigation transition is in
   * flight is a hard crash on iOS — that is the production crash of
   * 2026-10-11, where adding an Echo Vault recipient on a lapsed trial killed
   * the app every time.
   *
   * Synchronous by design: `BaseApiService` emits before it returns the
   * response, so a caller inspecting `response.success` can read this in the
   * same tick with nothing to await.
   */
  isSubscriptionRedirectInFlight(): boolean {
    if (this.subscriptionRedirectAt === null) return false;
    return Date.now() - this.subscriptionRedirectAt < SUBSCRIPTION_REDIRECT_WINDOW_MS;
  }

  /** Forget any in-flight redirect. Mainly for tests and explicit resets. */
  clearSubscriptionRedirect(): void {
    this.subscriptionRedirectAt = null;
  }
}

export const authEvents = new AuthEvents();
