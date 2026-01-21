import { renderHook, waitFor } from '@testing-library/react-native';

import { tokenManager } from '@services/tokenManager';

import { useAuthGuard, useAuthHeaders } from './useAuthGuard';

// Mocks
jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    isAuthenticated: jest.fn(),
    getValidToken: jest.fn(),
    getAuthHeaders: jest.fn(),
  },
}));

describe('useAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks authentication on mount', async () => {
    (tokenManager.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (tokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');

    const { result } = renderHook(() => useAuthGuard());
    
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasValidToken).toBe(true);
  });

  it('handles unauthenticated state', async () => {
    (tokenManager.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (tokenManager.getValidToken as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuthGuard());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.hasValidToken).toBe(false);
  });

  it('handles errors gracefully', async () => {
    (tokenManager.isAuthenticated as jest.Mock).mockRejectedValue(new Error('Token error'));

    const { result } = renderHook(() => useAuthGuard());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.hasValidToken).toBe(false);
  });

  it('getAuthToken returns token from manager', async () => {
    (tokenManager.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (tokenManager.getValidToken as jest.Mock).mockResolvedValue('test-token');

    const { result } = renderHook(() => useAuthGuard());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const token = await result.current.getAuthToken();
    expect(token).toBe('test-token');
  });
});

describe('useAuthHeaders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns auth headers from token manager', async () => {
    (tokenManager.getAuthHeaders as jest.Mock).mockResolvedValue({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    });

    const { result } = renderHook(() => useAuthHeaders());
    
    const headers = await result.current.getHeaders();
    
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    });
  });

  it('returns default headers on error', async () => {
    (tokenManager.getAuthHeaders as jest.Mock).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useAuthHeaders());
    
    const headers = await result.current.getHeaders();
    
    expect(headers).toEqual({
      'Content-Type': 'application/json',
    });
  });
});
