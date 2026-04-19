
import { useNavigation } from '@react-navigation/native';
import { palette, spacing, scale, verticalScale } from '@theme';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSession } from '@context/SessionContext';
import { useUser } from '@context/UserContext';

import MirrorSideMenu from '../screens/NavigationMenuScreen';

import CircularLogoMark from './CircularLogoMark';
import HeaderTextSvg from './HeaderTextSvg';
import HomeIcon from './HomeIcon';

type LogoHeaderProps = {
  containerStyle?: StyleProp<ViewStyle>;
  navigation?: any;
  onMenuPress?: () => void;
};

const LogoHeader = ({
  containerStyle,
  navigation: propNavigation,
  onMenuPress,
}: LogoHeaderProps) => {
  const internalNavigation = useNavigation();
  const navigation = propNavigation || internalNavigation;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useUser();
  const { state } = useSession();
  const { isAuthenticated } = state;
  const displayName = user?.fullName  || 'Guest';

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
              hitSlop={spacing.s}
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
          <CircularLogoMark size={scale(52)} />
          <HeaderTextSvg width={scale(93)} color={palette.neutral.white} />
        </View>

        {/* Right side spacer or Home button to keep logo perfectly centered */}
        <View style={styles.rightContainer}>
          {isAuthenticated && (
            <Pressable
              onPress={() => navigation.navigate('TalkToMirror')}
              hitSlop={spacing.s}
              style={styles.homeButton}
            >
              <HomeIcon width={24} height={24} color={palette.gold.warm} />
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    width: '100%',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    minHeight: verticalScale(60),
  },
  leftContainer: {
    width: scale(30),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: scale(30),
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
    width: scale(26),
    height: verticalScale(18),
    justifyContent: 'space-between',
  },
  hamLine: {
    height: verticalScale(2),
    borderRadius: 2,
    backgroundColor: palette.gold.warm,
    opacity: 0.9,
  },
  container: {
    flexDirection: 'row',
    gap: scale(spacing.s),
    alignItems: 'center',
  },
});

export default LogoHeader;
