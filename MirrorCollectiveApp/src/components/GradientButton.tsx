import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  View,
  Dimensions,
} from 'react-native';
    import Svg, { LinearGradient, Stop, Defs, Rect } from 'react-native-svg';

    const { width: screenWidth, height: screenHeight } =
      Dimensions.get('window');

    interface Props {
      title: string;
      onPress: () => void;
      disabled?: boolean;
      style?: ViewStyle;
    }

    const GradientButton = ({ title, onPress, disabled, style }: Props) => {
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          disabled={disabled}
          style={[styles.container, style, disabled && styles.disabled]}
        >
          <Svg
            width={Math.max(screenWidth * 0.3, 120)}
            height={Math.max(screenHeight * 0.056, 48)}
            style={styles.svgBackground}
          >
            <Defs>
              <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#54565B" stopOpacity="1" />
                <Stop offset="100%" stopColor="#161B24" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              rx="13" // rounded corners
              fill="url(#grad)"
              stroke="#9BAAC2"
              strokeWidth="0.25"
            />
          </Svg>

          <View style={styles.absoluteCenter}>
            <Text style={styles.text} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

    const styles = StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      button: {
        minWidth: Math.max(screenWidth * 0.3, 120), // Increased width for "Finish" text
        minHeight: Math.max(screenHeight * 0.056, 48), // Minimum height for touch target
        borderRadius: 13, // Exact 13px from Figma
        paddingHorizontal: Math.max(20, screenWidth * 0.051), // Exact 20px padding from Figma layout9
        paddingVertical: Math.max(8, screenHeight * 0.009), // Exact 8px padding from Figma layout9
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',

        // Only keep the outer border from Figma - remove conflicting borders
        borderWidth: 0.25, // Exact stroke width from Figma
        borderColor: '#9BAAC2', // Exact stroke2 color from Figma

        // Primary shadow effect (golden glow)
        shadowColor: 'rgba(229, 214, 176, 0.23)',
        shadowOffset: { width: 1, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 38,
        elevation: 15,

        // Simple background
        backgroundColor: 'rgba(253, 253, 249, 0.15)',
      },
      text: {
        fontFamily: 'CormorantGaramond-light', // Exact font from Figma
        fontSize: Math.min(screenWidth * 0.051, 20), // Proportional to 32px height in Figma (20px text)
        fontWeight: '500', // Medium weight from Figma
        lineHeight: Math.min(screenWidth * 0.061, 24), // Tight line height for button text
        color: '#F2E2B1', // Exact fill6 color from Figma
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.25)', // Exact effect3 shadow from Figma
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5, // Slight letter spacing for better readability
        includeFontPadding: false, // Remove extra padding that might cause clipping
        textAlignVertical: 'center', // Ensure vertical centering
        flexShrink: 0, // Prevent text shrinking
      },
      disabled: {
        opacity: 0.6,
      },
      absoluteCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
      },
      svgBackground: {
        borderRadius: 13, // to keep clipping consistent
        shadowColor: 'rgba(229, 214, 176, 0.23)',
        shadowOffset: { width: 1, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 38,
        elevation: 15,
      },
    });

export default GradientButton;
