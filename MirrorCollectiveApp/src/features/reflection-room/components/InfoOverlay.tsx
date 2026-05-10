/**
 * Reusable info overlay rendered when the user taps an "i" icon.
 *
 * Used by Echo Map (§12.9 overlays 1 & 2) and Mirror Moment
 * (§12.10 overlays 1, 2, 3). Single component per §7.2 reuse rule.
 *
 * Each page has a header, optional sub-line, body, and optional italic
 * footer. The overlay paginates via ←/→ arrows and dismisses on the X
 * close (top-right) or scrim tap.
 */

import {
  fontFamily,
  fontSize,
  lineHeight,
  modalColors,
  palette,
  radius,
  spacing,
} from '@theme';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import GlassCard from '@components/_internal/GlassCard';

export interface InfoPage {
  header: string;
  /** Optional small heading shown directly under the header (e.g., "Distance = influence"). */
  subhead?: string;
  /** Body lines — pass `\n` for line breaks. */
  body: string;
  /** Italic footer line at the bottom of the card. */
  footer?: string;
}

interface InfoOverlayProps {
  pages: InfoPage[];
  initialIndex?: number;
  onDismiss: () => void;
}

const InfoOverlay: React.FC<InfoOverlayProps> = ({
  pages,
  initialIndex = 0,
  onDismiss,
}) => {
  const [index, setIndex] = React.useState(initialIndex);
  const page = pages[index];
  const isFirst = index === 0;
  const isLast = index === pages.length - 1;

  return (
    <Pressable
      style={styles.scrim}
      onPress={onDismiss}
      accessibilityLabel="Close info overlay"
    >
      <Pressable onPress={() => {}}>
        <GlassCard padding={spacing.l} borderRadius={radius.m} style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.spacer} />
            <Text
              style={styles.header}
              accessibilityRole="header"
              accessibilityLabel={page.header}
            >
              {page.header}
            </Text>
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {page.subhead && (
            <Text style={styles.subhead}>{page.subhead}</Text>
          )}

          <ScrollView
            contentContainerStyle={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.body}>{page.body}</Text>
            {page.footer && (
              <Text style={styles.footer}>{page.footer}</Text>
            )}
          </ScrollView>

          {pages.length > 1 && (
            <View style={styles.navRow}>
              {!isFirst ? (
                <Pressable
                  onPress={() => setIndex(i => Math.max(0, i - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Previous"
                  hitSlop={8}
                  style={styles.arrowButton}
                >
                  <Image
                    source={require('@assets/back-arrow.png')}
                    style={styles.arrow}
                    resizeMode="contain"
                  />
                </Pressable>
              ) : (
                <View style={styles.arrowPlaceholder} />
              )}
              {!isLast ? (
                <Pressable
                  onPress={() => setIndex(i => Math.min(pages.length - 1, i + 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Next"
                  hitSlop={8}
                  style={styles.arrowButton}
                >
                  <Image
                    source={require('@assets/right-arrow.png')}
                    style={styles.arrow}
                    resizeMode="contain"
                  />
                </Pressable>
              ) : (
                <View style={styles.arrowPlaceholder} />
              )}
            </View>
          )}
        </GlassCard>
      </Pressable>
    </Pressable>
  );
};

export default InfoOverlay;

const ARROW_SIZE = 28;

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: modalColors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    zIndex: 60,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    gap: spacing.s,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: { width: 32, height: 32 },
  header: {
    flex: 1,
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: palette.gold.DEFAULT,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.body,
  },
  subhead: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.m,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
  bodyScroll: {
    paddingVertical: spacing.s,
    gap: spacing.s,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  footer: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.s,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    marginTop: spacing.s,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.s,
  },
  arrowButton: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    tintColor: palette.gold.DEFAULT,
  },
  arrowPlaceholder: { width: ARROW_SIZE, height: ARROW_SIZE },
});
