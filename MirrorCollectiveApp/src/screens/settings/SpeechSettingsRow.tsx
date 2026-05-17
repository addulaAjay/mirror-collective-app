/**
 * A single Settings row with a label + native Switch for the
 * "Auto-read Mirror replies" preference. Lives in screens/settings/
 * so future settings rows have a place to grow into.
 *
 * The row is host-agnostic — it doesn't know it's currently embedded in
 * ProfileScreen. When a dedicated Settings screen lands, drop this in
 * unchanged.
 */

import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  moderateScale,
  palette,
  spacing,
  verticalScale,
} from '@theme';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useAutoReadPreference } from '@services/speech';

export const SpeechSettingsRow: React.FC = () => {
  const { enabled, setEnabled, loaded } = useAutoReadPreference();

  return (
    <View style={styles.row}>
      <View style={styles.labels}>
        <Text style={styles.title}>Auto-read Mirror replies</Text>
        <Text style={styles.subtitle}>
          Speaks every new Mirror reply aloud as it arrives.
        </Text>
      </View>
      <Switch
        value={loaded ? enabled : false}
        onValueChange={(next) => {
          void setEnabled(next);
        }}
        disabled={!loaded}
        thumbColor={palette.gold.DEFAULT}
        trackColor={{
          true: palette.gold.warm,
          false: palette.navy.light,
        }}
        accessibilityRole="switch"
        accessibilityLabel="Auto-read Mirror replies"
        accessibilityState={{ checked: enabled, disabled: !loaded }}
        testID="settings-auto-read-switch"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(spacing.m),
    gap: spacing.m,
  },
  labels: {
    flex: 1,
    paddingRight: spacing.s,
  },
  title: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.m),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(lineHeight.m),
    color: palette.gold.DEFAULT,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(lineHeight.s),
    color: palette.navy.light,
  },
});
