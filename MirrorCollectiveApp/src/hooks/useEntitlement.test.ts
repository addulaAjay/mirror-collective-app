/**
 * Tests for the useEntitlement hook — the single predicate every gate
 * in the app reads. Locked entitlement matrix (2026-05-11):
 *
 *   trial / active / grace_period  -> entitled
 *   everything else                 -> locked
 *
 * The global jest.setup.js mocks `@hooks/useEntitlement` so that
 * existing screen tests get a default-entitled value. For THIS file
 * we unmock and exercise the real implementation against a mocked
 * SubscriptionContext.
 */

jest.unmock('@hooks/useEntitlement');

import { renderHook } from '@testing-library/react-native';

import * as SubscriptionContextModule from '@context/SubscriptionContext';
import { useEntitlement } from './useEntitlement';

// Shape of the SubscriptionContext return value the hook reads.
interface MockSubscriptionContext {
  status: string;
  tier: string;
  features: {
    quota_gb: number;
    used_gb: number;
    echo_vault_enabled?: boolean;
    mirror_gpt_enabled?: boolean;
    echo_map_enabled?: boolean;
  };
  loading: boolean;
  hasUsedTrial: boolean;
  refreshSubscriptionStatus: jest.Mock;
}

function mockContext(overrides: Partial<MockSubscriptionContext> = {}): MockSubscriptionContext {
  return {
    status: 'active',
    tier: 'core',
    features: {
      quota_gb: 50,
      used_gb: 5,
      echo_vault_enabled: true,
      mirror_gpt_enabled: true,
      echo_map_enabled: true,
    },
    loading: false,
    hasUsedTrial: false,
    refreshSubscriptionStatus: jest.fn(() => Promise.resolve()),
    ...overrides,
  };
}

function withMockedContext(ctx: MockSubscriptionContext) {
  jest
    .spyOn(SubscriptionContextModule, 'useSubscription')
    .mockReturnValue(ctx as unknown as ReturnType<typeof SubscriptionContextModule.useSubscription>);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useEntitlement — entitled / locked predicate', () => {
  it.each(['trial', 'active', 'grace_period'])(
    'returns entitled=true for status=%s',
    (status) => {
      withMockedContext(mockContext({ status }));
      const { result } = renderHook(() => useEntitlement());
      expect(result.current.entitled).toBe(true);
      expect(result.current.lockReason).toBeNull();
    },
  );

  it.each(['none', 'trial_expired', 'expired', 'cancelled'])(
    'returns entitled=false for status=%s',
    (status) => {
      withMockedContext(mockContext({ status }));
      const { result } = renderHook(() => useEntitlement());
      expect(result.current.entitled).toBe(false);
      expect(result.current.lockReason).not.toBeNull();
    },
  );

  it('maps trial_expired status to lockReason="trial_expired"', () => {
    withMockedContext(mockContext({ status: 'trial_expired' }));
    expect(renderHook(() => useEntitlement()).result.current.lockReason).toBe(
      'trial_expired',
    );
  });

  it('maps expired status to lockReason="expired"', () => {
    withMockedContext(mockContext({ status: 'expired' }));
    expect(renderHook(() => useEntitlement()).result.current.lockReason).toBe(
      'expired',
    );
  });

  it('maps none + hasUsedTrial to lockReason="trial_expired"', () => {
    // User went through their trial and lapsed; status is "none" but
    // we want the prompt to say "your trial ended" not "start a trial".
    withMockedContext(mockContext({ status: 'none', hasUsedTrial: true }));
    expect(renderHook(() => useEntitlement()).result.current.lockReason).toBe(
      'trial_expired',
    );
  });

  it('maps none + !hasUsedTrial to lockReason="free"', () => {
    withMockedContext(mockContext({ status: 'none', hasUsedTrial: false }));
    expect(renderHook(() => useEntitlement()).result.current.lockReason).toBe(
      'free',
    );
  });
});

describe('useEntitlement — quota math', () => {
  it('exposes quotaPercent as used/quota', () => {
    withMockedContext(
      mockContext({ features: { quota_gb: 50, used_gb: 10 } }),
    );
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.quotaPercent).toBeCloseTo(0.2, 5);
    expect(result.current.quotaExceeded).toBe(false);
    expect(result.current.quotaApproaching).toBe(false);
  });

  it('quotaApproaching=true at >=90 %', () => {
    withMockedContext(
      mockContext({ features: { quota_gb: 50, used_gb: 45 } }),
    );
    expect(
      renderHook(() => useEntitlement()).result.current.quotaApproaching,
    ).toBe(true);
  });

  it('quotaExceeded=true at >=100 %', () => {
    withMockedContext(
      mockContext({ features: { quota_gb: 50, used_gb: 50 } }),
    );
    expect(
      renderHook(() => useEntitlement()).result.current.quotaExceeded,
    ).toBe(true);
  });

  it('quotaPercent caps at 1.0 even when over-quota', () => {
    withMockedContext(
      mockContext({ features: { quota_gb: 50, used_gb: 75 } }),
    );
    expect(
      renderHook(() => useEntitlement()).result.current.quotaPercent,
    ).toBe(1);
  });

  it('quotaExceeded=true when not entitled (quota_gb=0)', () => {
    withMockedContext(
      mockContext({
        status: 'expired',
        features: { quota_gb: 0, used_gb: 0 },
      }),
    );
    expect(
      renderHook(() => useEntitlement()).result.current.quotaExceeded,
    ).toBe(true);
  });
});

describe('useEntitlement — canUpload pre-flight', () => {
  it('returns allowed=true when entitled and under quota', () => {
    withMockedContext(
      mockContext({ features: { quota_gb: 50, used_gb: 10 } }),
    );
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.canUpload()).toEqual({ allowed: true, reason: null });
  });

  it('returns reason=quota_exceeded when entitled but at quota', () => {
    withMockedContext(
      mockContext({ features: { quota_gb: 50, used_gb: 50 } }),
    );
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.canUpload()).toEqual({
      allowed: false,
      reason: 'quota_exceeded',
    });
  });

  it('rejects upload when declaredBytes would push over quota', () => {
    withMockedContext(
      mockContext({ features: { quota_gb: 50, used_gb: 49.5 } }),
    );
    const { result } = renderHook(() => useEntitlement());
    // 1 GB declared file — would push to 50.5 > 50.
    const oneGb = 1024 * 1024 * 1024;
    expect(result.current.canUpload(oneGb).allowed).toBe(false);
  });

  it('returns the lockReason as the upload reason when locked', () => {
    withMockedContext(mockContext({ status: 'trial_expired' }));
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.canUpload()).toEqual({
      allowed: false,
      reason: 'trial_expired',
    });
  });
});

describe('useEntitlement — UpgradePrompt reason routing', () => {
  it('returns promptReason=trial_expired for locked users', () => {
    withMockedContext(mockContext({ status: 'expired' }));
    expect(
      renderHook(() => useEntitlement()).result.current.promptReason,
    ).toBe('trial_expired');
  });

  it('returns promptReason=quota_exceeded for entitled but full users', () => {
    withMockedContext(
      mockContext({ features: { quota_gb: 50, used_gb: 50 } }),
    );
    expect(
      renderHook(() => useEntitlement()).result.current.promptReason,
    ).toBe('quota_exceeded');
  });
});
