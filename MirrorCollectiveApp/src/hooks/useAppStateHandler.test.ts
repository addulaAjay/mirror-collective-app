import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useAppStateHandler } from './useAppStateHandler';

const mockRemove = jest.fn();

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

describe('useAppStateHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AppState.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });
  });

  it('adds event listener on mount', () => {
    renderHook(() => useAppStateHandler({}));
    
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    const { unmount } = renderHook(() => useAppStateHandler({}));
    
    unmount();
    
    expect(mockRemove).toHaveBeenCalled();
  });

  it('calls onActive when app becomes active', () => {
    const onActive = jest.fn();
    const onForeground = jest.fn();
    
    renderHook(() => useAppStateHandler({ onActive, onForeground }));
    
    // Get the handler passed to addEventListener
    const handler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
    
    // Simulate app state change
    handler('active');
    
    expect(onActive).toHaveBeenCalled();
    expect(onForeground).toHaveBeenCalled();
  });

  it('calls onBackground when app goes to background', () => {
    const onBackground = jest.fn();
    
    renderHook(() => useAppStateHandler({ onBackground }));
    
    const handler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
    handler('background');
    
    expect(onBackground).toHaveBeenCalled();
  });

  it('calls onInactive when app becomes inactive', () => {
    const onInactive = jest.fn();
    
    renderHook(() => useAppStateHandler({ onInactive }));
    
    const handler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
    handler('inactive');
    
    expect(onInactive).toHaveBeenCalled();
  });
});
