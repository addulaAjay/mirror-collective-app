/**
 * Tests for the StorageMeter — three visual states:
 *
 *   not entitled   -> null (hidden; SubscriptionGate handles paywall)
 *   under 90 %     -> "X of Y used"
 *   90-99 %        -> "Running low — X of Y used" + tappable
 *   100 %          -> "Storage full — upgrade for more space" + tappable
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import StorageMeter from '@components/StorageMeter';
import { useEntitlement } from '@hooks/useEntitlement';

const mockedUseEntitlement = useEntitlement as jest.MockedFunction<
  typeof useEntitlement
>;

function setEntitlement(overrides: {
  entitled?: boolean;
  quotaGb?: number;
  usedGb?: number;
  quotaPercent?: number;
  quotaApproaching?: boolean;
  quotaExceeded?: boolean;
}) {
  mockedUseEntitlement.mockReturnValue({
    entitled: overrides.entitled ?? true,
    loading: false,
    status: 'active',
    tier: 'basic',
    lockReason: null,
    promptReason: 'trial_expired',
    quotaGb: overrides.quotaGb ?? 50,
    usedGb: overrides.usedGb ?? 0,
    quotaPercent: overrides.quotaPercent ?? 0,
    quotaExceeded: overrides.quotaExceeded ?? false,
    quotaApproaching: overrides.quotaApproaching ?? false,
    canUpload: () => ({ allowed: true, reason: null }),
    refresh: jest.fn(() => Promise.resolve()),
  });
}

afterEach(() => {
  mockedUseEntitlement.mockReset();
  setEntitlement({ entitled: true });
});

describe('StorageMeter', () => {
  it('renders nothing when user is not entitled', () => {
    setEntitlement({ entitled: false, quotaGb: 0 });
    const { toJSON } = render(<StorageMeter />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when quota is 0 (loading / unknown)', () => {
    setEntitlement({ entitled: true, quotaGb: 0 });
    const { toJSON } = render(<StorageMeter />);
    expect(toJSON()).toBeNull();
  });

  it('renders the neutral state under 90 %', () => {
    setEntitlement({
      entitled: true,
      quotaGb: 50,
      usedGb: 10,
      quotaPercent: 0.2,
    });
    const { getByText } = render(<StorageMeter />);
    // "10 GB of 50 GB used" — exact formatting depends on formatGb,
    // so just assert the boundary numbers are present.
    expect(getByText(/of 50 GB used/)).toBeTruthy();
  });

  it('renders the "Running low" state at >=90 %', () => {
    setEntitlement({
      entitled: true,
      quotaGb: 50,
      usedGb: 46,
      quotaPercent: 0.92,
      quotaApproaching: true,
    });
    const { getAllByText } = render(<StorageMeter />);
    // Label string is mirrored on the accessibilityLabel of the
    // wrapper, so it matches twice. Just confirm at least one.
    expect(getAllByText(/Running low/i).length).toBeGreaterThan(0);
  });

  it('renders the "Storage full" state at 100 %', () => {
    setEntitlement({
      entitled: true,
      quotaGb: 50,
      usedGb: 50,
      quotaPercent: 1,
      quotaExceeded: true,
      // approaching is computed from quotaApproaching elsewhere; the
      // meter prioritises exceeded over approaching.
    });
    const { getAllByText } = render(<StorageMeter />);
    expect(getAllByText(/Storage full/i).length).toBeGreaterThan(0);
  });
});
