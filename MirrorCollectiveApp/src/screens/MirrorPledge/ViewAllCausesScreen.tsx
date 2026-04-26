import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textShadow,
  scale,
  verticalScale,
  spacing,
  radius,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import CauseIcon from '@components/CauseIcon';
import GlassCard from '@components/_internal/GlassCard';
import LogoHeader from '@components/LogoHeader';

import { CAUSES } from './causes';

/**
 * Screen 3: View All Causes
 * Figma reference: Design-Master-File node 2169:3153
 *
 * 7 full-width row cards, each glassmorphism (Radius/S 12, Border/Subtle):
 *   icon (~28px) + label (Cormorant Heading S 24px, gold).
 * Tap a row to open the carousel positioned on that cause.
 */

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ViewAllCauses'>;

const ICON_SIZE = scale(32);

const ViewAllCausesScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>VIEW ALL CAUSES</Text>

          <View testID="causes-grid" style={styles.list}>
            {CAUSES.map((cause, index) => (
              <TouchableOpacity
                key={cause.id}
                testID={`cause-row-${cause.id}`}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('CausesCarousel', { initialCauseId: cause.id })
                }
              >
                <GlassCard
                  borderRadius={radius.s}
                  padding={spacing.s}
                  style={styles.row}
                >
                  <View style={styles.rowInner}>
                    <CauseIcon
                      testID={`cause-icon-${cause.id}`}
                      type={cause.id}
                      size={ICON_SIZE}
                    />
                    <Text style={styles.label}>{cause.name}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  scrollContent: ViewStyle;
  title: TextStyle;
  list: ViewStyle;
  row: ViewStyle;
  rowInner: ViewStyle;
  label: TextStyle;
}>({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: palette.neutral.transparent },
  scrollContent: {
    paddingHorizontal: scale(spacing.l),
    paddingTop: verticalScale(spacing.l),
    paddingBottom: verticalScale(spacing.xl),
    gap: verticalScale(spacing.l),
  },

  // Figma: Heading L (Cormorant) — 32px / 40 lh, gold.DEFAULT, Glow Drop Shadow
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight.xxl,
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },

  // Vertical stack of cause rows with consistent spacing
  list: {
    gap: verticalScale(spacing.s),
  },

  // GlassCard wrapper — keeps card style overrides separate from inner row layout
  row: {
    width: '100%',
  },

  // Figma: row layout — icon left, label, gap = Spacing/S (12px)
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.xs,
  },

  // Figma: Heading XS Bold (Cormorant Medium) — 20px / 24 lh, gold.DEFAULT
  label: {
    flex: 1,
    fontFamily: fontFamily.headingMedium,
    fontSize: fontSize.l,
    lineHeight: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: palette.gold.DEFAULT,
  },
});

export default ViewAllCausesScreen;
