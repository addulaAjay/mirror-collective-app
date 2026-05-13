/**
 * Tests for the SubscriptionGate wrapper — three branches:
 *
 *   loading        -> spinner / loadingFallback
 *   !entitled      -> UpgradePrompt overlay; children unmounted
 *   entitled       -> children rendered
 *
 * The global jest.setup.js mocks @hooks/useEntitlement with a default
 * entitled value; we override per-test via jest.mocked(...).
 */

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import SubscriptionGate from '@components/SubscriptionGate';
import { useEntitlement } from '@hooks/useEntitlement';

// Re-cast the mocked import so tests can call .mockReturnValue.
const mockedUseEntitlement = useEntitlement as jest.MockedFunction<
  typeof useEntitlement
>;

interface EntitlementOverrides {
  entitled?: boolean;
  loading?: boolean;
  promptReason?: 'trial_expired' | 'quota_exceeded';
  usedGb?: number;
  quotaGb?: number;
}

function setEntitlement(overrides: EntitlementOverrides) {
  mockedUseEntitlement.mockReturnValue({
    entitled: overrides.entitled ?? true,
    loading: overrides.loading ?? false,
    status: 'active',
    tier: 'basic',
    lockReason: null,
    promptReason: overrides.promptReason ?? 'trial_expired',
    quotaGb: overrides.quotaGb ?? 50,
    usedGb: overrides.usedGb ?? 0,
    quotaPercent: 0,
    quotaExceeded: false,
    quotaApproaching: false,
    canUpload: () => ({ allowed: true, reason: null }),
    refresh: jest.fn(() => Promise.resolve()),
  });
}

afterEach(() => {
  // Reset and reinstate the default-entitled return so unrelated
  // tests in the same run don't see leaked state.
  mockedUseEntitlement.mockReset();
  setEntitlement({ entitled: true });
});

describe('SubscriptionGate', () => {
  it('renders children when entitled', () => {
    setEntitlement({ entitled: true });
    const { getByText } = render(
      <SubscriptionGate>
        <Text>secret content</Text>
      </SubscriptionGate>,
    );
    expect(getByText('secret content')).toBeTruthy();
  });

  it('does NOT render children when not entitled', () => {
    setEntitlement({ entitled: false });
    const { queryByText } = render(
      <SubscriptionGate>
        <Text>secret content</Text>
      </SubscriptionGate>,
    );
    // Critical: locked users must NOT see the underlying content.
    expect(queryByText('secret content')).toBeNull();
  });

  it('does NOT render children while loading (fail-closed)', () => {
    setEntitlement({ loading: true });
    const { queryByText } = render(
      <SubscriptionGate>
        <Text>secret content</Text>
      </SubscriptionGate>,
    );
    // While we're still figuring out the entitlement state, hide
    // children — matches the SubscriptionContext fail-closed defaults.
    expect(queryByText('secret content')).toBeNull();
  });

  it('renders custom lockedFallback when provided', () => {
    setEntitlement({ entitled: false });
    const { getByText, queryByText } = render(
      <SubscriptionGate lockedFallback={<Text>custom lock</Text>}>
        <Text>secret content</Text>
      </SubscriptionGate>,
    );
    expect(getByText('custom lock')).toBeTruthy();
    expect(queryByText('secret content')).toBeNull();
  });

  it('renders custom loadingFallback when provided', () => {
    setEntitlement({ loading: true });
    const { getByText } = render(
      <SubscriptionGate loadingFallback={<Text>spinner</Text>}>
        <Text>secret content</Text>
      </SubscriptionGate>,
    );
    expect(getByText('spinner')).toBeTruthy();
  });
});
