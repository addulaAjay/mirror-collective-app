import { spacing, radius, shadows, palette } from '@theme';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, AccessibilityInfo } from 'react-native';

/**
 * MirrorGPT "processing" typing indicator — the left-aligned `· · ·` bubble
 * shown while a reply streams in (Figma Dev-Master-File node 7811-2866).
 *
 * The bubble mirrors the assistant MessageBubble (systemBubble) styling; the
 * three gold dots pulse in a staggered loop so the wait feels alive. The loop
 * is built from recursive `Animated.timing().start()` calls (rather than
 * `Animated.loop`/`sequence`) so it drives cleanly under the hand-rolled RN
 * test mock and honours the OS "reduce motion" setting.
 */
const DOT_COUNT = 3;
const MIN_OPACITY = 0.3;
const MAX_OPACITY = 1;
const PULSE_MS = 500;
const STAGGER_MS = 160;

export const TypingIndicator: React.FC = () => {
  const dots = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(MIN_OPACITY)),
  ).current;

  useEffect(() => {
    let mounted = true;

    const pulse = (dot: Animated.Value, delay: number) => {
      Animated.timing(dot, {
        toValue: MAX_OPACITY,
        duration: PULSE_MS,
        delay,
        useNativeDriver: true,
      }).start(() => {
        if (!mounted) return;
        Animated.timing(dot, {
          toValue: MIN_OPACITY,
          duration: PULSE_MS,
          useNativeDriver: true,
        }).start(() => {
          if (mounted) pulse(dot, 0);
        });
      });
    };

    const startAll = () => dots.forEach((dot, i) => pulse(dot, i * STAGGER_MS));

    // Respect the OS "reduce motion" setting when the API is available;
    // otherwise (older RN / test mock) just animate.
    const reduceCheck = AccessibilityInfo?.isReduceMotionEnabled?.();
    if (reduceCheck && typeof reduceCheck.then === 'function') {
      reduceCheck
        .then(reduce => {
          if (!mounted) return;
          if (reduce) {
            dots.forEach(dot => dot.setValue(0.7));
          } else {
            startAll();
          }
        })
        .catch(() => {
          if (mounted) startAll();
        });
    } else {
      startAll();
    }

    return () => {
      mounted = false;
      dots.forEach(dot => dot.stopAnimation?.());
    };
  }, [dots]);

  return (
    <View style={styles.row}>
      <View
        style={styles.bubble}
        testID="typing-indicator"
        accessibilityRole="text"
        accessibilityLabel="MirrorGPT is thinking"
      >
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            testID={`typing-dot-${i}`}
            style={[
              styles.dot,
              i > 0 && styles.dotGap,
              {
                opacity: dot,
                transform: [
                  {
                    scale: dot.interpolate({
                      inputRange: [MIN_OPACITY, MAX_OPACITY],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Full-width row so the bubble left-aligns like an incoming message.
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: spacing.xxs,
  },
  // Mirrors MessageBubble's systemBubble so it reads as an assistant bubble.
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: 'rgba(155, 170, 194, 0.5)',
    backgroundColor: 'rgba(253, 253, 249, 0.05)',
    ...shadows.MEDIUM,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.gold.DEFAULT,
  },
  dotGap: {
    marginLeft: 6,
  },
});
