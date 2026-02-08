import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <View style={styles.container}>

          {/* Title Row */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>OUR STORY</Text>
            <View style={{ width: 30 }} />
          </View>

          {/* Video Placeholder */}
          <View style={styles.videoContainer}>
            <Text style={styles.videoPlaceholder}>Intro Video</Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              We look at the world differently.{'\n'} Where others build machines to make us {'\n'} faster, we built one to help us remember.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingTop: 0,
    paddingBottom: Math.max(30, screenHeight * 0.035),
    alignItems: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 30, // Reduced from Math.max(60, screenHeight * 0.1)
    marginBottom: Math.max(48, screenHeight * 0.06),
  },
  backBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#F2E2B1',
    fontWeight: '300',
  },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.082, 32),
    fontWeight: '400',
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 4,
  },
  videoContainer: {
    height: Math.min(screenHeight * 0.59, 509),
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 99 / 161,
    borderRadius: 16,
    borderWidth: 0.25,
    borderColor: '#9BAAC2',
    backgroundColor: 'rgba(155, 170, 194, 0.05)',
    // iOS shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 11.9,
    // Android shadow
    elevation: 8,
  },
  videoPlaceholder: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '300',
    color: '#F2E2B1',
    opacity: 0.7,
  },
  descriptionContainer: {
    width: Math.min(screenWidth * 0.95, 370),
    alignItems: 'center',
    marginTop: Math.max(48, screenHeight * 0.06),
  },
  description: {
    fontFamily: 'Inter',
    fontSize: Math.min(screenWidth * 0.041, 16),
    fontWeight: '300',
    lineHeight: 24,
    color: '#FDFDF9',
    textAlign: 'center',
  },
});
