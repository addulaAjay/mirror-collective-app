import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
  type StyleProp,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeIcon from './HomeIcon';

import MirrorSideMenu from '../screens/NavigationMenuScreen';
import { useUser } from '@context/UserContext';
import { useSession } from '@context/SessionContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type LogoHeaderProps = {
  containerStyle?: StyleProp<ViewStyle>;
  logoStyle?: StyleProp<ImageStyle>;
  textContainerStyle?: StyleProp<ViewStyle>;
  navigation?: any;
  onMenuPress?: () => void;
};

const LogoHeader = ({
  containerStyle,
  logoStyle,
  textContainerStyle,
  navigation: propNavigation,
  onMenuPress,
}: LogoHeaderProps) => {
  const internalNavigation = useNavigation();
  const navigation = propNavigation || internalNavigation;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useUser();
  const { state } = useSession();
  const { isAuthenticated } = state;
  const displayName = user?.fullName || 'Guest';

  // If onMenuPress is provided, use it. Otherwise, use internal drawer state.
  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setDrawerOpen(true);
    }
  };

  return (
    <>
      {isAuthenticated && (
        <MirrorSideMenu
          isOpen={drawerOpen}
          userName={displayName}
          onClose={() => setDrawerOpen(false)}
          onNavigate={route => {
            setDrawerOpen(false);
            if (navigation) {
              navigation.navigate(route as never);
            }
          }}
        />
      )}
      <View style={styles.wrapper}>
        <View style={styles.leftContainer}>
          {isAuthenticated && (
            <Pressable
              onPress={handleMenuPress}
              hitSlop={12}
              style={styles.hamburgerButton}
            >
              <View style={styles.hamburger}>
                <View style={styles.hamLine} />
                <View style={styles.hamLine} />
                <View style={styles.hamLine} />
              </View>
            </Pressable>
          )}
        </View>

        {/* Centered Logo + Text */}
        <View style={[styles.container, containerStyle]}>
          <Image
            source={require('@assets/Mirror_Collective_Logo_RGB.png')}
            style={[styles.logo, logoStyle]}
            resizeMode="contain"
          />
          <View style={[styles.textContainer, textContainerStyle]}>
            <Text style={textStyles.textItalic}>
              The <Text style={textStyles.textNormal}>MIRROR</Text>
            </Text>
            <Text style={textStyles.textNormal}>COLLECTIVE</Text>
          </View>
        </View>

        {/* Right side spacer or Home button to keep logo perfectly centered */}
        <View style={styles.rightContainer}>
          {isAuthenticated && (
            <Pressable
              onPress={() => navigation.navigate('TalkToMirror')}
              hitSlop={12}
              style={styles.homeButton}
            >
              <HomeIcon width={24} height={24} color="#E5D6B0" />
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
};

const fs = Math.min(Math.max(screenWidth * 0.04, 16), 18);
const lhItalic = Math.min(Math.max(screenWidth * 0.048, 20), 24);
const lhNormal = Math.min(Math.max(screenWidth * 0.045, 16), 18);

const baseText = {
  fontSize: fs,
  textAlign: 'center',
  color: '#E5D6B0',
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 9,
  textShadowColor: 'rgba(0,0,0,0.25)',
  textTransform: 'none',
  ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
} as const;

const textStyles = StyleSheet.create({
  textItalic: {
    ...baseText,
    fontFamily: 'CormorantGaramond-Italic',
    lineHeight: lhItalic,
  },
  textNormal: {
    ...baseText,
    fontFamily: 'CormorantGaramond-Regular',
    lineHeight: lhNormal,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    width: '100%',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 60, // Ensure consistent height
  },
  leftContainer: {
    width: 30, // Fixed width for alignment
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 30, // Matches leftContainer for centering
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  homeButton: {
    zIndex: 11,
  },
  hamburgerButton: {
    zIndex: 11,
  },
  hamburger: {
    width: 26,
    height: 18,
    justifyContent: 'space-between',
  },
  hamLine: {
    height: 2,
    borderRadius: 2,
    backgroundColor: '#E5D6B0',
    opacity: 0.9,
  },
  container: {
    flexDirection: 'row',
    gap: Math.max(8, screenWidth * 0.02),
    alignItems: 'center',
  },
  logo: {
    width: Math.min(Math.max(screenWidth * 0.117, 36), 46),
    height: Math.min(Math.max(screenWidth * 0.117, 36), 46),
  },
  textContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

export default LogoHeader;
