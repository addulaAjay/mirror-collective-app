import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import {
  StyleSheet,
  Text,
  View,
  Image,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

const MirrorEchoCommingsoonScreen: React.FC = () => {
  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>MIRROR ECHO</Text>

          {/* Illustration */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@assets/mirror-echo-map.png')}
              style={styles.image}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Preserve your legacy in the Echo Vault — a secure space to create and save your most meaningful memories, reflections, and moments that matter. A living record, kept for yourself or gifted to someone you love
            </Text>
          </View>

          <View style={styles.spacer} />

          {/* Coming soon footer */}
          <View style={styles.footerContainer}>
            <StarIcon width={20} height={20} />
            <Text style={styles.footerText}>COMING SOON</Text>
            <StarIcon width={20} height={20} />
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default MirrorEchoCommingsoonScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  safe: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  imageContainer: ViewStyle;
  image: ImageStyle;
  descriptionContainer: ViewStyle;
  description: TextStyle;
  spacer: ViewStyle;
  footerContainer: ViewStyle;
  footerText: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: scale(345),
    alignSelf: 'center',
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
    alignItems: 'center',
    gap: verticalScale(32),
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    lineHeight: lineHeight.l,
    textShadowColor: palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  imageContainer: {
    width: scale(275),
    height: verticalScale(320),
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  descriptionContainer: {
    width: '100%',
    maxWidth: scale(313),
    alignItems: 'center',
  },
  description: {
    fontFamily: fontFamily.bodyLight,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.light,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(16),
  },
  footerText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['3xl']),
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    lineHeight: lineHeight.xxl,
    textShadowColor: palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
