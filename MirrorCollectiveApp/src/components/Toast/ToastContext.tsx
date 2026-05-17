/**
 * Toast context + provider + `useToast` hook.
 *
 * Mount `<ToastProvider>` once near the root (App.tsx) so the overlay
 * always renders above whichever screen is active. Anywhere inside the
 * provider tree:
 *
 *   const { showToast } = useToast();
 *   showToast({ message: 'Subscription Activated', tone: 'success' });
 *
 * Stacked toasts queue vertically — the most recent at the bottom of
 * the stack — so two quick fires don't clobber each other. Each toast
 * owns its own auto-dismiss timer and removes itself when done.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scale, verticalScale } from '@theme';

import Toast, { type ToastSpec, type ToastTone } from './Toast';

export interface ShowToastInput {
  message: string;
  tone?: ToastTone;
  title?: string;
}

interface ToastContextValue {
  showToast: (input: ShowToastInput) => number;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastSpec[]>([]);
  // Monotonically increasing id — `Date.now()` collides under rapid
  // fires (same-ms double tap); incrementing counter guarantees
  // uniqueness for the React key.
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((input: ShowToastInput): number => {
    const id = ++nextId.current;
    setToasts(prev => [...prev, { id, ...input }]);
    return id;
  }, []);

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  const overlayStyle: ViewStyle = {
    ...styles.overlay,
    top: insets.top + verticalScale(8),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 ? (
        <View pointerEvents="box-none" style={overlayStyle}>
          {toasts.map(spec => (
            <Toast key={spec.id} spec={spec} onDismiss={dismissToast} />
          ))}
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

/**
 * Hook for firing toasts from any descendant of `<ToastProvider>`.
 *
 * Throws if called outside the provider — prefer a fast crash in dev
 * over silently swallowing a failure-feedback signal in production.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

const styles = StyleSheet.create<{ overlay: ViewStyle }>({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: scale(0),
    zIndex: 9999,
    elevation: 9999,
  },
});
