import {
  palette,
  spacing,
  radius,
  borderWidth,
  fontFamily,
  fontSize,
  effects,
} from '@theme';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BlurSurface from '@components/_internal/BlurSurface';
import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';

/**
 * DEV-ONLY screen for manual visual QA of the Button component and frosted-glass
 * tuning. Renders:
 *   1. The full Button matrix (variants × sizes × states) over the production
 *      BackgroundWrapper so the blur has real content (the night-sky shimmer)
 *      to work against.
 *   2. A blur-amount tuning row — five identical button-shaped surfaces with
 *      blurAmount values 15/20/25/30/35 so you can compare side-by-side
 *      against the Figma reference and pick the closest match.
 *
 * Wire-up (temporary, for iOS dev sessions only):
 *   1. Add to RootStackParamList: `ButtonShowcase: undefined;`
 *   2. Add `<Stack.Screen name="ButtonShowcase" component={ButtonShowcaseScreen} />`
 *   3. Set initialRouteName="ButtonShowcase" or navigate to it from a debug menu.
 *   4. Once tuned, update `effects.backgroundBlur.amount` in `theme/tokens.ts`
 *      to the chosen value and unwire the screen.
 *
 * Not exported from any screen index — must be imported by absolute path so it
 * never accidentally ships to a production build.
 */

const noop = () => {};

const TUNING_AMOUNTS = [15, 20, 25, 30, 35] as const;

type RowProps = {
  label: string;
  children: React.ReactNode;
};

const Row: React.FC<RowProps> = ({ label, children }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowItems}>{children}</View>
  </View>
);

const TuningCell: React.FC<{ amount: number }> = ({ amount }) => (
  <View style={styles.tuningCell}>
    <BlurSurface amount={amount} />
    <LinearGradient
      colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
    <Text style={styles.tuningCellLabel}>{amount}</Text>
  </View>
);

const ButtonShowcaseScreen: React.FC = () => {
  return (
    <BackgroundWrapper>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Button — Figma node 125:440</Text>
          <Text style={styles.subtitle}>
            Visual QA matrix. Compare with the Figma reference — Cormorant
            font, gold glow on active, frosted-glass behind.
          </Text>

          <Text style={styles.sectionHeader}>Primary</Text>
          <Row label="L · default">
            <Button variant="primary" size="L" title="TEXT" onPress={noop} />
          </Row>
          <Row label="L · active">
            <Button variant="primary" size="L" active title="TEXT" onPress={noop} />
          </Row>
          <Row label="L · disabled">
            <Button variant="primary" size="L" disabled title="TEXT" onPress={noop} />
          </Row>
          <Row label="S · default">
            <Button variant="primary" size="S" title="TEXT" onPress={noop} />
          </Row>
          <Row label="S · active">
            <Button variant="primary" size="S" active title="TEXT" onPress={noop} />
          </Row>
          <Row label="S · disabled">
            <Button variant="primary" size="S" disabled title="TEXT" onPress={noop} />
          </Row>

          <Text style={styles.sectionHeader}>Secondary</Text>
          <Row label="L · default">
            <Button variant="secondary" size="L" title="TEXT" onPress={noop} />
          </Row>
          <Row label="L · active">
            <Button variant="secondary" size="L" active title="TEXT" onPress={noop} />
          </Row>
          <Row label="L · disabled">
            <Button variant="secondary" size="L" disabled title="TEXT" onPress={noop} />
          </Row>
          <Row label="S · default">
            <Button variant="secondary" size="S" title="TEXT" onPress={noop} />
          </Row>
          <Row label="S · active">
            <Button variant="secondary" size="S" active title="TEXT" onPress={noop} />
          </Row>
          <Row label="S · disabled">
            <Button variant="secondary" size="S" disabled title="TEXT" onPress={noop} />
          </Row>

          <Text style={styles.sectionHeader}>Link</Text>
          <Row label="L · default">
            <Button variant="link" size="L" title="TEXT" onPress={noop} />
          </Row>
          <Row label="L · disabled">
            <Button variant="link" size="L" disabled title="TEXT" onPress={noop} />
          </Row>
          <Row label="S · default">
            <Button variant="link" size="S" title="TEXT" onPress={noop} />
          </Row>
          <Row label="S · disabled">
            <Button variant="link" size="S" disabled title="TEXT" onPress={noop} />
          </Row>

          <Text style={styles.sectionHeader}>Blur tuning</Text>
          <Text style={styles.helper}>
            Current token: amount={effects.backgroundBlur.amount}, type=
            {effects.backgroundBlur.type}. Compare against Figma — pick the
            cell that best matches BACKGROUND_BLUR radius:60, then update the
            token in theme/tokens.ts.
          </Text>
          <View style={styles.tuningRow}>
            {TUNING_AMOUNTS.map((amount) => (
              <TuningCell key={amount} amount={amount} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ButtonShowcaseScreen;

const styles = StyleSheet.create<{
  safe: ViewStyle;
  scroll: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  sectionHeader: TextStyle;
  row: ViewStyle;
  rowLabel: TextStyle;
  rowItems: ViewStyle;
  helper: TextStyle;
  tuningRow: ViewStyle;
  tuningCell: ViewStyle;
  tuningCellLabel: TextStyle;
}>({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
    gap: spacing.s,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    color: palette.gold.DEFAULT,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: palette.gold.subtlest,
    marginBottom: spacing.m,
  },
  sectionHeader: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.l,
    color: palette.gold.DEFAULT,
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.s,
  },
  rowLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xxs,
    color: palette.gold.subtlest,
    width: 96,
  },
  rowItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  helper: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xxs,
    color: palette.gold.subtlest,
    marginBottom: spacing.s,
  },
  tuningRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  tuningCell: {
    width: 56,
    height: 52,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    borderRadius: radius.m,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuningCellLabel: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.s,
    color: palette.gold.DEFAULT,
  },
});
