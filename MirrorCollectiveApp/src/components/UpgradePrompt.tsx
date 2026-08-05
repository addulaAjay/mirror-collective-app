import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import GlassCard from '@components/_internal/GlassCard';
import Button from '@components/Button/Button';
import {
  fontFamily,
  fontSize,
  lineHeight,
  modalColors,
  palette,
  radius,
  spacing,
} from '@theme';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  reason?: 'quota_exceeded' | 'quota_approaching' | 'trial_expired';
  quotaInfo?: {
    usage_gb: number;
    quota_gb: number;
  };
}

const getMessage = (
  reason: UpgradePromptProps['reason'],
  quotaInfo: UpgradePromptProps['quotaInfo'],
): { title: string; message: string } => {
  switch (reason) {
    case 'quota_exceeded':
      return {
        title: 'Storage Limit Reached',
        // Numbers when we have them, a clean fallback when we don't (the upload
        // 507 doesn't carry usage figures).
        message: quotaInfo
          ? `You've used ${quotaInfo.usage_gb.toFixed(1)} GB of your ${quotaInfo.quota_gb} GB storage. Upgrade to add more space.`
          : "You've reached your storage limit. Upgrade to add more space.",
      };
    case 'quota_approaching':
      return {
        title: 'Running Low on Storage',
        message: quotaInfo
          ? `You've used ${(
              (quotaInfo.usage_gb / (quotaInfo.quota_gb || 1)) *
              100
            ).toFixed(0)}% of your storage. Consider adding more space.`
          : "You're running low on storage. Consider adding more space.",
      };
    case 'trial_expired':
      return {
        title: 'Trial Expired',
        message:
          'Your 14-day trial has ended. Subscribe to continue accessing your Echo Vault.',
      };
    default:
      return {
        title: 'Upgrade Your Plan',
        message: 'Get more features with Mirror Basic.',
      };
  }
};

/**
 * Upgrade / subscribe prompt, following the app's modal design system
 * (GlassCard shell + theme tokens + the shared Button), matching
 * MirrorGptInfoModal. Shown for quota limits and expired trials.
 */
const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  reason = 'quota_exceeded',
  quotaInfo,
}) => {
  const navigation = useNavigation();

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('StartFreeTrial' as never);
  };

  const { title, message } = getMessage(reason, quotaInfo);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Scrim tap dismisses; inner Pressable swallows taps on the card. */}
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityLabel="Dismiss"
      >
        <Pressable onPress={() => {}}>
          <GlassCard
            padding={spacing.l}
            borderRadius={radius.m}
            style={styles.card}
          >
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.actions}>
              <Button
                variant="primary"
                size="L"
                title="UPGRADE NOW"
                onPress={handleUpgrade}
              />
              <Button variant="link" title="Not Now" onPress={onClose} />
            </View>
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default UpgradePrompt;

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: modalColors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  card: {
    width: '100%',
    maxWidth: 329,
    alignItems: 'center',
    // Gold glow — matches MirrorGptInfoModal (Figma "Background Blur" shadow).
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl, // 24
    lineHeight: lineHeight.l, // 28
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  message: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s, // 16
    lineHeight: lineHeight.m, // 24
    color: palette.gold.subtlest,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
