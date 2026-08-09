import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useInAppPurchase } from './useInAppPurchase';

// Control requestSubscription per-test; stub the rest of the IAP surface so the
// hook mounts cleanly.
const mockRequestSubscription = jest.fn();
const mockInitConnection = jest.fn().mockResolvedValue(true);
const mockGetSubscriptions = jest.fn().mockResolvedValue([]);
const mockPurchaseUpdatedListener = jest.fn(() => ({ remove: jest.fn() }));
const mockPurchaseErrorListener = jest.fn(() => ({ remove: jest.fn() }));

jest.mock('react-native-iap', () => ({
  initConnection: (...args: unknown[]) => mockInitConnection(...args),
  endConnection: jest.fn().mockResolvedValue(undefined),
  getSubscriptions: (...args: unknown[]) => mockGetSubscriptions(...args),
  getAvailablePurchases: jest.fn().mockResolvedValue([]),
  requestSubscription: (...args: unknown[]) => mockRequestSubscription(...args),
  finishTransaction: jest.fn().mockResolvedValue(undefined),
  purchaseUpdatedListener: (...args: unknown[]) =>
    mockPurchaseUpdatedListener(...(args as [])),
  purchaseErrorListener: (...args: unknown[]) =>
    mockPurchaseErrorListener(...(args as [])),
  ErrorCode: { E_USER_CANCELLED: 'E_USER_CANCELLED' },
}));

jest.mock('@/services/api/subscriptionApi', () => ({
  subscriptionApiService: {
    verifyPurchase: jest.fn(),
    restorePurchases: jest.fn(),
  },
}));

describe('useInAppPurchase — init resilience (paywall wedge fix)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitConnection.mockResolvedValue(true);
    mockGetSubscriptions.mockResolvedValue([]);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('registers purchase listeners BEFORE loading products', async () => {
    renderHook(() => useInAppPurchase());

    await waitFor(() => expect(mockGetSubscriptions).toHaveBeenCalled());

    // A queued StoreKit transaction can arrive the instant the connection
    // opens; if getSubscriptions ran first (and hung) the listener would miss
    // it. Assert the listener was wired up first via invocation order.
    const listenerOrder =
      mockPurchaseUpdatedListener.mock.invocationCallOrder[0];
    const getSubsOrder = mockGetSubscriptions.mock.invocationCallOrder[0];
    expect(listenerOrder).toBeLessThan(getSubsOrder);
  });

  it('clears loading even when getSubscriptions hangs forever', async () => {
    jest.useFakeTimers();
    // Native StoreKit can hang without ever resolving OR rejecting — the exact
    // wedge seen in production. Simulate with a promise that never settles.
    mockGetSubscriptions.mockReturnValue(new Promise(() => {}));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useInAppPurchase());
    expect(result.current.loading).toBe(true);

    // Advance past the init timeout; the timeout wrapper rejects, the catch
    // runs, and loading is cleared so the paywall renders instead of wedging.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });

    expect(result.current.loading).toBe(false);
  });

  it('clears loading when getSubscriptions rejects', async () => {
    mockGetSubscriptions.mockRejectedValueOnce(new Error('store down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useInAppPurchase());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to initialize store connection');
  });
});

describe('useInAppPurchase — user cancel handling', () => {
  afterEach(() => jest.restoreAllMocks());

  it('treats a Cancel on the Apple sheet as a silent no-op', async () => {
    const cancel = Object.assign(new Error('cancelled'), {
      code: 'E_USER_CANCELLED',
    });
    mockRequestSubscription.mockRejectedValueOnce(cancel);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useInAppPurchase());
    await act(async () => {
      await result.current.purchaseSubscription('sku');
    });

    // No error surfaced, flag reset, and no "Purchase error" logged.
    expect(result.current.purchasing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(errSpy).not.toHaveBeenCalledWith(
      'Purchase error:',
      expect.anything(),
    );
  });

  it('still surfaces a genuine (non-cancel) purchase failure', async () => {
    const fail = Object.assign(new Error('network down'), { code: 'E_UNKNOWN' });
    mockRequestSubscription.mockRejectedValueOnce(fail);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useInAppPurchase());
    await act(async () => {
      await result.current.purchaseSubscription('sku');
    });

    expect(result.current.error).toBe('network down');
    expect(result.current.purchasing).toBe(false);
  });
});
