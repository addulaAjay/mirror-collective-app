/**
 * @deprecated Use `<Button variant="gradient" />` from `@components/Button` instead.
 * This wrapper will be removed in a future cleanup pass.
 */
import React from 'react';
import type { ViewStyle, TextStyle } from 'react-native';

import Button from './Button';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
}

const GradientButton = (props: Props) => (
  <Button variant="gradient" {...props} />
);

export default GradientButton;
