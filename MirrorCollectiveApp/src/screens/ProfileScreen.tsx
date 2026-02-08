import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const ProfileScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSave = () => {
    // Handle save logic
    console.log('Save profile:', { name, email, phoneNumber });
  };

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.sectionWrapper}>

            {/* Title Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>YOUR PROFILE</Text>
              <Text style={styles.subtitle}>
                Update your profile and notification {'\n'} preferences
              </Text>
            </View>

            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImageWrapper}>
                <View style={styles.profileImageCircle}>
                  {/* Default Avatar Icon */}
                  <Svg width="120" height="120" viewBox="0 0 60 50" fill="none">
                    <Path
                      d="M30 30C37.18 30 43 24.18 43 17C43 9.82 37.18 4 30 4C22.82 4 17 9.82 17 17C17 24.18 22.82 30 30 30ZM30 37C21.33 37 4 41.34 4 50V56H56V50C56 41.34 38.67 37 30 37Z"
                      fill="#A3B3CC"
                    />
                  </Svg>
                </View>
                {/* Plus Icon Badge */}
                <TouchableOpacity style={styles.editBadge}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path
                      d="M10 4V16M4 10H16"
                      stroke="#0B0F1C"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Name Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInputField
                  size="medium"
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholderAlign="left"
                  placeholderFontFamily="regular"
                  inputTextStyle="gold-regular"
                  placeholderStyle={styles.customPlaceholder}
                />
              </View>

              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInputField
                  size="medium"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderAlign="left"
                  placeholderFontFamily="regular"
                  inputTextStyle="gold-regular"
                  placeholderStyle={styles.customPlaceholder}
                />
              </View>

              {/* Phone Number Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInputField
                  size="medium"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  placeholderAlign="left"
                  placeholderFontFamily="regular"
                  inputTextStyle="gold-regular"
                  placeholderStyle={styles.customPlaceholder}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButtonWrapper}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  'rgba(253, 253, 249, 0.04)',
                  'rgba(253, 253, 249, 0.01)',
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveText}>SAVE</Text>
              </LinearGradient>
            </TouchableOpacity>

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

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
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingTop: 0,
    paddingBottom: Math.max(100, screenHeight * 0.12),
    alignItems: 'center',
  },
  sectionWrapper: {
    gap: 24,
    width: '100%',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    gap: 24,
    marginTop: 30, // Reduced from Math.max(80, screenHeight * 0.1)
  },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.082, 32),
    fontWeight: '400',
    lineHeight: Math.min(screenWidth * 0.082 * 1.3, 41.6),
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: Math.min(screenWidth * 0.041, 16),
    fontWeight: '300',
    lineHeight: 24,
    color: '#FDFDF9',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImageCircle: {
    width: 120,
    height: 120,
    aspectRatio: 1 / 1,
    borderRadius: 100,
    backgroundColor: '#7B8FA6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  editBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A3B3CC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0B0F1C',
  },
  formSection: {
    width: '100%',
    gap: 24,
    maxWidth: 360,
  },
  fieldContainer: {
    width: '100%',
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 20,
    fontWeight: '300',
    color: '#F2E2B1',
    paddingLeft: 4,
  },
  customPlaceholder: {
    color: '#A3B3CC',
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 26,
  },
  saveButtonWrapper: {
    marginTop: 24,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  saveText: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 24,
    fontWeight: '500',
    color: '#E5D6B0',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
});

export default ProfileScreen;
