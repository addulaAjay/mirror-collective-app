import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import UpgradePrompt from '@components/UpgradePrompt';
import { useEntitlement } from '@hooks/useEntitlement';
import {
  borderWidth,
  fontFamily,
  fontSize,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  verticalScale,
} from '@theme';

interface StorageMeterProps {
  /**
   * Adds a top-margin / corner-style when used as a banner at the top of a
   * vault screen. Defaults to false (inline indicator).
   */
  banner?: boolean;
}

/**
 * Compact Echo Vault storage indicator: usage / quota with a progress bar.
 *
 * Behaviour:
 *  - Hidden entirely when the user isn't entitled (gates handle that case;
 *    we don't double-prompt).
 *  - Hidden when quota is 0 (loading or unknown).
 *  - At >=90 % usage: amber state + "Running low on space" + tap opens
 *    `UpgradePrompt` with reason='quota_approaching'.
 *  - At >=100 % usage: error state + "Storage full" + tap opens
 *    `UpgradePrompt` with reason='quota_exceeded'.
 *
 * Source of truth is `useEntitlement` (which reads `features.{used_gb,quota_gb}`
 * from SubscriptionContext). Data is refreshed on AppState → active and
 * after every successful purchase / restore.
 */
function StorageMeter({ banner = false }: StorageMeterProps): React.JSX.Element | null {
  const entitlement = useEntitlement();
  const [promptVisible, setPromptVisible] = useState(false);

  if (!entitlement.entitled || entitlement.quotaGb <= 0) {
    return null;
  }

  const isFull = entitlement.quotaExceeded;
  const isApproaching = entitlement.quotaApproaching && !isFull;
  const isInteractive = isFull || isApproaching;

  const barFillStyle: ViewStyle = {
    width: `${Math.max(2, Math.round(entitlement.quotaPercent * 100))}%`,
    backgroundColor: isFull
      ? palette.status?.errorHover ?? '#c4564f'
      : isApproaching
      ? palette.gold.warm
      : palette.gold.DEFAULT,
  };

  const label = isFull
    ? 'Storage full — upgrade for more space'
    : isApproaching
    ? `Running low — ${formatGb(entitlement.usedGb)} of ${formatGb(
        entitlement.quotaGb,
      )} used`
    : `${formatGb(entitlement.usedGb)} of ${formatGb(entitlement.quotaGb)} used`;

  const Container: React.ElementType = isInteractive ? TouchableOpacity : View;
  const containerProps = isInteractive
    ? {
        activeOpacity: 0.85,
        onPress: () => setPromptVisible(true),
        accessibilityRole: 'button' as const,
        accessibilityLabel: label,
      }
    : { accessibilityLabel: label };

  return (
    <>
      <Container
        {...containerProps}
        style={[styles.container, banner && styles.banner]}
      >
        <Text style={[styles.label, isFull && styles.labelError]}>
          {label}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, barFillStyle]} />
        </View>
      </Container>
      <UpgradePrompt
        visible={promptVisible}
        onClose={() => setPromptVisible(false)}
        reason={isFull ? 'quota_exceeded' : 'quota_approaching'}
        quotaInfo={{
          usage_gb: entitlement.usedGb,
          quota_gb: entitlement.quotaGb,
        }}
      />
    </>
  );
}

function formatGb(gb: number): string {
  if (gb >= 10) return `${gb.toFixed(0)} GB`;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(gb * 1024).toFixed(0)} MB`;
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  banner: ViewStyle;
  label: TextStyle;
  labelError: TextStyle;
  track: ViewStyle;
  fill: ViewStyle;
}>({
  container: {
    width: '100%',
    paddingVertical: verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.m),
    borderRadius: radius.s,
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.light,
    backgroundColor: 'rgba(163, 179, 204, 0.05)',
    gap: verticalScale(spacing.xs),
  },
  banner: {
    marginBottom: verticalScale(spacing.m),
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs ?? 13),
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  labelError: {
    color: palette.status?.errorHover ?? '#c4564f',
  },
  track: {
    width: '100%',
    height: verticalScale(4),
    borderRadius: radius.xs ?? 6,
    backgroundColor: 'rgba(163, 179, 204, 0.15)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.xs ?? 6,
  },
});

export default StorageMeter;
