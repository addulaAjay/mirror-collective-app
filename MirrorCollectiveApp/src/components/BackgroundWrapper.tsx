import React from 'react';
import { ImageBackground, StyleSheet, type StyleProp, type ViewStyle, type ImageStyle } from 'react-native';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

/**
 * BackgroundWrapper - Centralized background component
 * 
 * Wraps screen content with the dark shimmer background image.
 * Used across all screens for consistent background styling.
 */
const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({ 
  children, 
  style,
  imageStyle 
}) => {
  return (
    <ImageBackground
      source={require('@assets/45738ceb874e0241ce5245e119810be2790dc491.png')}
      style={[styles.container, style]}
      imageStyle={imageStyle}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BackgroundWrapper;
