import { act, renderHook } from '@testing-library/react-native';

import { useInAppPurchase } from './useInAppPurchase';

// Control requestSubscription per-test; stub the rest of the IAP surface so the
// hook mounts cleanly.
const mockRequestSubscription = jest.fn();

jest.mock('react-native-iap', () => ({
  initConnection: jest.fn().mockResolvedValue(true),
  endConnection: jest.fn().mockResolvedValue(undefined),
  getSubscriptions: jest.fn().mockResolvedValue([]),
  getAvailablePurchases: jest.fn().mockResolvedValue([]),
  requestSubscription: (...args: unknown[]) => mockRequestSubscription(...args),
  finishTransaction: jest.fn().mockResolvedValue(undefined),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
  ErrorCode: { E_USER_CANCELLED: 'E_USER_CANCELLED' },
}));

jest.mock('@/services/api/subscriptionApi', () => ({
  subscriptionApiService: {
    verifyPurchase: jest.fn(),
    restorePurchases: jest.fn(),
  },
}));

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
