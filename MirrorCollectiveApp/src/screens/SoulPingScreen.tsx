/**
 * SoulPingScreen — the in-app landing surface for a tapped Soul Ping.
 *
 * Opened via deep link from a Soul Ping push (see services/notificationRouting).
 * The ping's copy is passed through navigation params (carried on the push
 * payload), so this renders immediately with no fetch. A richer feed-backed
 * version (GET /api/notifications) + the full Figma echo-map-ring is tracked in
 * docs/SOUL_PINGS_PRD.md (Phase 2/3).
 */
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  palette,
  spacing,
  radius,
  fontFamily,
  fontSize,
  lineHeight,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';

const CATEGORY_LABEL: Record<string, string> = {
  emotional: 'A gentle check-in',
  progress: 'Keep your momentum',
  systemic: 'A pattern worth noticing',
};

const SoulPingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'SoulPing'>>();
  const { category, title, body } = route.params ?? {};

  const eyebrow =
    (category && CATEGORY_LABEL[category]) || 'A message from your Mirror';
  const heading = title || 'Just checking in';
  const message =
    body || 'Take a breath. Whenever you’re ready, your Mirror is here.';

  return (
    <BackgroundWrapper>
      <LogoHeader />
      <View style={styles.content}>
        {/* Gold glowing ring — the Soul Ping motif (Figma 1687:915). */}
        <View style={styles.ring} />

        <Text style={styles.eyebrow} numberOfLines={2}>
          {eyebrow.toUpperCase()}
        </Text>
        <Text style={styles.heading} numberOfLines={3}>
          {heading}
        </Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actions}>
          <Button
            variant="primary"
            size="L"
            title="REFLECT NOW"
            onPress={() => navigation.navigate('TalkToMirror' as never)}
          />
          <Button
            variant="secondary"
            size="L"
            title="Not now"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </BackgroundWrapper>
  );
};

export default SoulPingScreen;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(spacing.l),
    gap: verticalScale(spacing.m),
  },
  ring: {
    width: scale(150),
    height: scale(150),
    borderRadius: scale(75),
    borderWidth: 1.5,
    borderColor: palette.gold.DEFAULT,
    backgroundColor: 'rgba(197,158,95,0.05)',
    boxShadow: '0px 0px 24px 4px rgba(240, 212, 168, 0.35)',
    marginBottom: verticalScale(spacing.m),
  },
  eyebrow: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    letterSpacing: 2,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
  heading: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    lineHeight: moderateScale(34),
    color: palette.gold.subtlest,
    textAlign: 'center',
    textShadowColor: 'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  message: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.m),
    lineHeight: lineHeight.l,
    color: palette.neutral.white,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: scale(spacing.s),
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: verticalScale(spacing.l),
    gap: verticalScale(spacing.s),
    borderRadius: radius.m,
  },
});
