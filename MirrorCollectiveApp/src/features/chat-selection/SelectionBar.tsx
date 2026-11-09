/**
 * The bar that replaces the composer while messages are selected.
 *
 * Copy · Save to Echo · Cancel, with a running count.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { palette, radius, spacing, theme } from '@theme';

/**
 * How long "Copied" shows before the bar dismisses itself.
 *
 * Long enough to register, short enough that it does not feel like a stuck
 * state. Confirmation lives in the bar because this repo has no toast
 * component, and an Alert is both heavy for a confirmation and the mechanism
 * behind the 2026-10-11 crash.
 */
const CONFIRM_MS = 1200;

export interface SelectionBarProps {
  count: number;
  onCopy: () => void;
  onSaveToEcho: () => void;
  onCancel: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  count,
  onCopy,
  onSaveToEcho,
  onCancel,
}) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // An unmounted bar firing onCancel would clear a selection the user has
  // since rebuilt, so the timer is cleared on the way out.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = useCallback(() => {
    if (copied) return; // a second tap must not queue another dismissal
    onCopy();
    setCopied(true);
    timer.current = setTimeout(onCancel, CONFIRM_MS);
  }, [copied, onCopy, onCancel]);

  return (
    <View style={styles.bar} accessibilityRole="toolbar">
      <Text style={styles.count}>{`${count} selected`}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleCopy}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel={copied ? 'Copied' : 'Copy selected messages'}
          testID="selection-copy"
        >
          <Text style={[styles.actionText, copied && styles.actionTextDone]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSaveToEcho}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="Save selected messages to an Echo"
          testID="selection-save"
        >
          <Text style={styles.actionText}>Save to Echo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCancel}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="Cancel selection"
          testID="selection-cancel"
        >
          <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    backgroundColor: 'rgba(253, 253, 249, 0.07)',
  },
  count: {
    ...theme.typography.styles.bodySmall,
    color: palette.gold.subtlest,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  action: { paddingHorizontal: spacing.s, paddingVertical: spacing.xxs },
  actionText: {
    ...theme.typography.styles.bodySmall,
    color: palette.gold.DEFAULT,
  },
  actionTextDone: { color: palette.gold.subtlest },
  cancelText: { color: palette.gold.warm },
});
