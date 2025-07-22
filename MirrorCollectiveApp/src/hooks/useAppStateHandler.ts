import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseAppStateHandlerProps {
  onBackground?: () => void;
  onForeground?: () => void;
  onActive?: () => void;
  onInactive?: () => void;
}

export const useAppStateHandler = ({
  onBackground,
  onForeground,
  onActive,
  onInactive,
}: UseAppStateHandlerProps = {}) => {
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (__DEV__) {
        console.log('App state changed to:', nextAppState);
      }

      switch (nextAppState) {
        case 'active':
          onActive?.();
          onForeground?.();
          break;
        case 'background':
          onBackground?.();
          break;
        case 'inactive':
          onInactive?.();
          break;
        default:
          break;
      }
    };

    // Get current app state
    const currentAppState = AppState.currentState;
    if (__DEV__) {
      console.log('Current app state:', currentAppState);
    }

    // Add listener for app state changes
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // Cleanup function
    return () => {
      subscription?.remove();
    };
  }, [onActive, onBackground, onForeground, onInactive]);
};

export default useAppStateHandler;
