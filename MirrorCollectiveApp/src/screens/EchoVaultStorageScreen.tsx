import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EchoVaultStorage'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

const outerContainerPaddingHorizontal = Math.max(24, (24 * screenWidth) / DESIGN_WIDTH);
const outerContainerPaddingTop = Math.max(48, (48 * screenHeight) / DESIGN_HEIGHT);
const outerContainerPaddingBottom = Math.max(53, (53 * screenHeight) / DESIGN_HEIGHT);

const availableHeight = Math.max(0, screenHeight - outerContainerPaddingTop - outerContainerPaddingBottom);

// Reserve vertical space for the absolutely-positioned LogoHeader.
// In Figma, the main content frame starts at y=164.
const contentStartY = Math.max(164, (164 * screenHeight) / DESIGN_HEIGHT);
const outerBoxMarginTop = Math.max(0, contentStartY - outerContainerPaddingTop);

const outerBoxWidth = (345 * screenWidth) / DESIGN_WIDTH;
const outerBoxHeight = Math.min((751 * screenHeight) / DESIGN_HEIGHT, Math.max(0, availableHeight - outerBoxMarginTop));

// Figma uses a 19px vertical gap in this layout
const figmaSectionGap = Math.max(19, (19 * screenHeight) / DESIGN_HEIGHT);

// Figma card sits inside a 20px horizontal padding container
const figmaCardOuterPaddingX = Math.max(20, (20 * screenWidth) / DESIGN_WIDTH);

// Figma Continue component is 155 x 55
const figmaContinueButtonWidth = (155 * screenWidth) / DESIGN_WIDTH;

// Figma segmented toggle is 159 x 42
const figmaToggleWidth = (159 * screenWidth) / DESIGN_WIDTH;
const figmaToggleHeight = Math.max(42, (42 * screenHeight) / DESIGN_HEIGHT);

// Figma header block (Frame 640) is 345 x 69 with column widths: 20 | 267 | 20 and 19px gaps.
const figmaHeaderHeight = Math.max(69, (69 * screenHeight) / DESIGN_HEIGHT);
const figmaHeaderSideWidth = (20 * screenWidth) / DESIGN_WIDTH;
const figmaHeaderTitleWidth = (267 * screenWidth) / DESIGN_WIDTH;
const figmaHeaderGapX = Math.max(19, (19 * screenWidth) / DESIGN_WIDTH);
// Back icon sits 24px from the top inside the 69px header.
const figmaBackIconTop = Math.max(24, (24 * screenHeight) / DESIGN_HEIGHT);

const EchoVaultStorageScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedOption, setSelectedOption] = useState<'add' | 'notNow'>('add');

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <View style={styles.outerBoxContainer}>
        <LogoHeader />

        <View style={styles.outerBox}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }
                navigation.navigate('StartFreeTrial');
              }}
              style={styles.backButton}
            >
              <Image
                source={require('../assets/back-arrow.png')}
                style={styles.backArrow}
                accessibilityIgnoresInvertColors
              />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.optionalLabel}>Optional Add On</Text>
              <Text style={styles.title}>Echo Vault Storage</Text>
            </View>

            <View style={styles.headerRightSpacer} />
          </View>

          <Text style={styles.subtitle}>
            Save voice notes, videos, photos, {'\n'} reflections, letters, and life moments.
          </Text>

          <View style={styles.innerBox}>
            <View style={styles.cardOuter}>
              <View style={styles.cardWrapper}>
                <View style={styles.cardContent}>
                  <Text style={styles.storageTitle}>+100 GB Storage</Text>

                <View style={styles.priceLine}>
                  <Text style={styles.priceLineText}>
                    <Text style={styles.priceAmount}>$4.99</Text>
                    <Text style={styles.pricePerMonth}> /month </Text>
                    <Text style={styles.priceOr}>or </Text>
                    <Text style={styles.priceYearAmount}>$49</Text>
                    <Text style={styles.priceYearSuffix}> /year</Text>
                  </Text>
                </View>

                <View style={styles.segmentedRow}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedOption === 'add' }}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedOption('add');
                    }}
                    testID="echo-vault-add"
                    style={styles.segmentedTouch}
                  >
                    <LinearGradient
                      colors={
                        selectedOption === 'add'
                          ? ['#F2E2B1', '#CFA64F']
                          : ['rgba(253, 253, 249, 0.03)', 'rgba(253, 253, 249, 0.20)']
                      }
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={[
                        styles.segmentLeft,
                        selectedOption === 'add' && styles.segmentLeftSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentLeftText,
                          selectedOption === 'add' && styles.segmentLeftTextSelected,
                        ]}
                      >
                        ADD
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedOption === 'notNow' }}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedOption('notNow');
                    }}
                    testID="echo-vault-not-now"
                    style={styles.segmentedTouch}
                  >
                    <LinearGradient
                      colors={
                        selectedOption === 'notNow'
                          ? ['#F2E2B1', '#CFA64F']
                          : ['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']
                      }
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={[
                        styles.segmentRight,
                        selectedOption === 'notNow' && styles.segmentRightSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentRightText,
                          selectedOption === 'notNow' && styles.segmentRightTextSelected,
                        ]}
                      >
                        Not now
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.starDividerRow}>
                  <LinearGradient
                    colors={['#F2E2B1', '#CFA64F']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.starDividerLine}
                  />
                  <StarIcon width={18} height={18} color="#F2E2B1" />
                  <LinearGradient
                    colors={['#CFA64F', '#F2E2B1']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.starDividerLine}
                  />
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  onPress={() => {
                    // TODO: Continue to next step
                  }}
                  testID="echo-vault-continue"
                  style={styles.continueButtonHitSlop}
                >
                  <LinearGradient
                    colors={['rgba(253, 253, 249, 0.03)', 'rgba(253, 253, 249, 0.20)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.continueButton}
                  >
                    <Text style={styles.continueButtonText}>CONTINUE</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.helperText}>You can change this anytime.</Text>

                  <Text style={styles.footerLinkText}>
                    Terms • Privacy • Restore Purchase
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </BackgroundWrapper>
  );
};

export default EchoVaultStorageScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  outerBoxContainer: ViewStyle;
  outerBox: ViewStyle;
  headerRow: ViewStyle;
  backButton: ViewStyle;
  backArrow: ImageStyle;
  titleContainer: ViewStyle;
  headerRightSpacer: ViewStyle;
  optionalLabel: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  innerBox: ViewStyle;
  cardOuter: ViewStyle;
  cardWrapper: ViewStyle;
  cardContent: ViewStyle;
  storageTitle: TextStyle;
  priceLine: ViewStyle;
  priceLineText: TextStyle;
  priceAmount: TextStyle;
  pricePerMonth: TextStyle;
  priceOrContainer: ViewStyle;
  priceOr: TextStyle;
  priceYearAmount: TextStyle;
  priceYearSuffix: TextStyle;
  segmentedRow: ViewStyle;
  segmentedTouch: ViewStyle;
  segmentLeft: ViewStyle;
  segmentLeftSelected: ViewStyle;
  segmentLeftText: TextStyle;
  segmentLeftTextSelected: TextStyle;
  segmentRight: ViewStyle;
  segmentRightSelected: ViewStyle;
  segmentRightText: TextStyle;
  segmentRightTextSelected: TextStyle;
  starDividerRow: ViewStyle;
  starDividerLine: ViewStyle;
  continueButtonHitSlop: ViewStyle;
  continueButton: ViewStyle;
  continueButtonText: TextStyle;
  helperText: TextStyle;
  footerLinkText: TextStyle;
}>(
  {
    bg: {
      flex: 1,
      backgroundColor: '#0B0F1C',
    },
    bgImage: {
      resizeMode: 'cover',
    },

    outerBoxContainer: {
      flex: 1,
      paddingHorizontal: outerContainerPaddingHorizontal,
      paddingTop: outerContainerPaddingTop,
      paddingBottom: outerContainerPaddingBottom,
    },

    outerBox: {
      width: outerBoxWidth,
      height: outerBoxHeight,
      flexDirection: 'column',
      alignItems: 'center',
      gap: figmaSectionGap,
      marginTop: outerBoxMarginTop,
    },

    headerRow: {
      width: '100%',
      height: figmaHeaderHeight,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      gap: figmaHeaderGapX,
      position: 'relative',
    },
    backButton: {
      width: figmaHeaderSideWidth,
      height: figmaHeaderHeight,
      paddingTop: figmaBackIconTop,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    backArrow: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
      tintColor: '#E5D6B0',
    },
    headerRightSpacer: {
      width: figmaHeaderSideWidth,
      height: figmaHeaderHeight,
    },

    titleContainer: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: figmaHeaderTitleWidth,
      height: figmaHeaderHeight,
      gap: 19,
    },
    optionalLabel: {
      color: '#F2E2B1',
      textAlign: 'center',
      textShadowColor: '#F0D4A8',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 16,
      fontFamily: 'CormorantGaramond-Italic',
      fontSize: 24,
      fontWeight: '400',
      lineHeight: 31.2,
      includeFontPadding: false,
    },
    title: {
      alignSelf: 'stretch',
      color: '#F2E2B1',
      textAlign: 'center',
      textShadowColor: '#F0D4A8',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 16,
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 32,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 41.6,
      includeFontPadding: false,
    },
    subtitle: {
      width: 335,
      maxWidth: '100%',
      alignSelf: 'center',
      fontFamily: 'Inter',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 24,
      color: '#FDFDF9',
      textAlign: 'center',
      includeFontPadding: false,
    },

    innerBox: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: figmaSectionGap,
      alignSelf: 'stretch',
      justifyContent: 'flex-start',
    },

    cardOuter: {
      alignSelf: 'stretch',
      paddingHorizontal: figmaCardOuterPaddingX,
    },

    cardWrapper: {
      flexGrow: 0,
      flexShrink: 0,
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 0.3,
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(197, 158, 95, 0.05)',
      overflow: 'hidden',
      shadowColor: 'rgba(163, 179, 204, 0.30)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 25,
      boxShadow: '0 0 25px 0 rgba(163, 179, 204, 0.30)',
    },
    cardContent: {
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'flex-start',
      gap: 16,
    },

    storageTitle: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 32,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 41.6,
      color: '#F2E2B1',
      textAlign: 'center',
      includeFontPadding: false,
    },

    priceLine: {
      alignSelf: 'stretch',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceLineText: {
      flexShrink: 1,
      textAlign: 'center',
      includeFontPadding: false,
    },
    priceAmount: {
      color: '#FDFDF9',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 24,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 31.2,
      includeFontPadding: false,
    },
    pricePerMonth: {
      color: '#FDFDF9',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 20,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 26,
      includeFontPadding: false,
    },
    priceOrContainer: {
      width: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceOr: {
      color: '#FDFDF9',
      textAlign: 'center',
      fontFamily: 'Inter',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 24,
      includeFontPadding: false,
    },
    priceYearAmount: {
      color: '#F2E2B1',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 24,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 31.2,
      includeFontPadding: false,
    },
    priceYearSuffix: {
      color: '#F2E2B1',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Italic',
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 26,
      includeFontPadding: false,
    },

    segmentedRow: {
      flexDirection: 'row',
      width: figmaToggleWidth,
      height: figmaToggleHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentedTouch: {
      flex: 1,
    },
    segmentLeft: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
      borderWidth: 0.5,
      borderColor: '#F2E2B1',
      borderRightWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentLeftSelected: {
      borderColor: '#F2E2B1',
    },
    segmentLeftText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 21,
      color: '#F2E2B1',
      textAlign: 'center',
      includeFontPadding: false,
    },
    segmentLeftTextSelected: {
      color: '#0B0F1C',
    },
    segmentRight: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
      borderWidth: 0.5,
      borderColor: '#F2E2B1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentRightSelected: {
      borderColor: '#F2E2B1',
    },
    segmentRightText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 21,
      color: '#FDFDF9',
      textAlign: 'center',
      includeFontPadding: false,
    },
    segmentRightTextSelected: {
      color: '#0B0F1C',
    },

    starDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 4,
      marginBottom: 4,
      alignSelf: 'stretch',
    },
    starDividerLine: {
      width: 70,
      height: 0.5,
      borderRadius: 1,
    },

    continueButtonHitSlop: {
      alignSelf: 'center',
      width: figmaContinueButtonWidth,
    },
    continueButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: '#A3B3CC',
      paddingVertical: 12,
      paddingHorizontal: 16,
      width: '100%',
      height: 55,
      shadowColor: '#F2E2B1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      boxShadow: '0 0 16px 0 rgba(242, 226, 177, 0.25)',
    },
    continueButtonText: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 24,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 31.2,
      color: '#F2E2B1',
      textAlign: 'center',
      textShadowColor: 'rgba(229, 214, 176, 0.50)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 9,
      includeFontPadding: false,
    },

    helperText: {
      marginTop: 2,
      fontFamily: 'Inter',
      fontSize: 14,
      fontStyle: 'italic',
      fontWeight: '200',
      lineHeight: 19.6,
      color: '#FDFDF9',
      textAlign: 'center',
      includeFontPadding: false,
    },
    footerLinkText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '300',
      lineHeight: 13.2,
      color: '#A3B3CC',
      textAlign: 'center',
      includeFontPadding: false,
    },
  },
);
