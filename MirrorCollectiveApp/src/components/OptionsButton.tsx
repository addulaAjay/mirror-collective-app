import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const OptionButton = ({ label, selected, onPress, style }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.button, selected && styles.buttonSelected, style]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default OptionButton;
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', // Match Figma layout horizontal mode
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8, // Exact from Figma CSS
    paddingHorizontal: 8, // Exact padding: 8px from non-selected Figma CSS
    gap: 16, // Exact gap from Figma
    width: Math.min(screenWidth * 0.796, 313), // Exact 313px width from Figma
    height: 64, // Exact 64px height from Figma
    // Exact gradient background from non-selected Figma: linear-gradient(360deg, rgba(253, 253, 249, 0.0355) 0%, rgba(253, 253, 249, 0.005) 100%)
    backgroundColor: 'rgba(253, 253, 249, 0.02)', // Average of non-selected gradient as fallback
    borderWidth: 0.25, // Exact stroke width from Figma
    borderColor: '#9BAAC2', // Exact stroke color from Figma
    borderRadius: 13, // Exact border radius from Figma
    // Exact dual shadow from non-selected Figma: 0px 4px 19px 4px rgba(0, 0, 0, 0.1), 1px 4px 38px 2px rgba(229, 214, 176, 0.17)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    //elevation: 8,
  },

  buttonSelected: {
    // Exact gradient background from selected Figma: linear-gradient(360deg, rgba(253, 253, 249, 0.2485) 0%, rgba(253, 253, 249, 0.035) 100%)
    backgroundColor: 'rgba(253, 253, 249, 0.14)', // Average of gradient as fallback
    borderColor: '#9BAAC2',
    borderWidth: 0.25,
    paddingHorizontal: 16, // Selected state has padding: 8px 16px from Figma CSS
    // Exact dual shadow from selected Figma: 0px 4px 19px 4px rgba(0, 0, 0, 0.1), 1px 4px 38px 2px rgba(229, 214, 176, 0.23)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    //elevation: 15, // Higher elevation for selected state
  },

  label: {
    fontFamily: 'CormorantGaramond-Light', // Match Figma typography
    fontSize: Math.min(screenWidth * 0.051, 20), // Exact 20px from Figma CSS
    fontWeight: '300', // Exact font-weight: 300 from Figma
    lineHeight: Math.min(screenWidth * 0.061, 24), // Exact line-height: 24px from Figma
    color: '#F4EFE4', // Exact color from Figma
    textAlign: 'center', // Exact text-align: center from Figma CSS
    // Exact text-shadow: 0px 0px 8px #E5D6B0 from Figma
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    width: 297, // Exact width: 297px from non-selected Figma CSS
    height: 48, // Exact height: 48px from Figma
    flex: 1, // flex-grow: 1 from Figma CSS
  },

  labelSelected: {
    // Selected text uses exact styling from selected state Figma CSS
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, 20), // Exact 20px
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.061, 24), // Exact 24px
    color: '#F4EFE4',
    textAlign: 'center', // Center align for selected state
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Exact 8px from Figma
    width: 281, // Exact width: 281px from selected Figma CSS
    height: 48,
    flex: 1,
  },
});
