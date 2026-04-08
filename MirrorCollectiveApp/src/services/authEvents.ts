/**
 * Lightweight singleton pub/sub for auth lifecycle events.
 * Decouples the API layer from React context without circular imports.
 */
type Listener = () => void;

class AuthEvents {
  private sessionExpiredListeners: Set<Listener> = new Set();

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
}

export const authEvents = new AuthEvents();
