import { palette } from '@theme';
import React, { type ReactNode, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import UpgradePrompt from '@components/UpgradePrompt';
import { useEntitlement } from '@hooks/useEntitlement';

interface SubscriptionGateProps {
  /** Content to render when the user is entitled. */
  children: ReactNode;
  /** Override for the lock-screen UI. Defaults to a full-screen UpgradePrompt. */
  lockedFallback?: ReactNode;
  /** Optional override for the loading skeleton. */
  loadingFallback?: ReactNode;
}

/**
 * Wrap any screen whose content must be hidden from non-entitled users.
 *
 * Behaviour (locked entitlement matrix, docs/IAP_SUBSCRIPTION_REVIEW.md):
 *
 *  - `loading`: render a spinner (or `loadingFallback`).
 *  - not entitled: render `lockedFallback` if provided, otherwise a starfield
 *    background with the upgrade modal already open and undismissable.
 *    Children are NOT mounted, so no API calls fire and no cached data
 *    leaks visually.
 *  - entitled: render `children` normally.
 */
function SubscriptionGate({
  children,
  lockedFallback,
  loadingFallback,
}: SubscriptionGateProps): React.JSX.Element {
  const entitlement = useEntitlement();
  // We open the modal on mount when locked, and keep it open — the user
  // can dismiss it but the underlying screen is still hidden, so they
  // just see the gate background. The only way out is the UPGRADE CTA
  // (which navigates to StartFreeTrial) or backing out of the route.
  const [modalVisible, setModalVisible] = useState(true);

  if (entitlement.loading) {
    if (loadingFallback !== undefined) {
      return <View style={styles.fill}>{loadingFallback}</View>;
    }
    return (
      <BackgroundWrapper style={styles.fill}>
        <View style={styles.center}>
          <ActivityIndicator color={palette.gold.DEFAULT} />
        </View>
      </BackgroundWrapper>
    );
  }

  if (!entitlement.entitled) {
    if (lockedFallback !== undefined) {
      return <View style={styles.fill}>{lockedFallback}</View>;
    }
    return (
      <BackgroundWrapper style={styles.fill}>
        <View style={styles.center} />
        <UpgradePrompt
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          reason={entitlement.promptReason}
          quotaInfo={{
            usage_gb: entitlement.usedGb,
            quota_gb: entitlement.quotaGb,
          }}
        />
      </BackgroundWrapper>
    );
  }

  return <View style={styles.fill}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default SubscriptionGate;
