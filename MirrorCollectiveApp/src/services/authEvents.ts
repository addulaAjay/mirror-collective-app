/**
 * Lightweight singleton pub/sub for auth lifecycle events.
 * Decouples the API layer from React context without circular imports.
 */
type Listener = () => void;

class AuthEvents {
  private sessionExpiredListeners: Set<Listener> = new Set();
  private subscriptionRequiredListeners: Set<Listener> = new Set();

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
    this.subscriptionRequiredListeners.forEach(listener => {
      try {
        listener();
      } catch (_) {}
    });
  }
}

export const authEvents = new AuthEvents();
