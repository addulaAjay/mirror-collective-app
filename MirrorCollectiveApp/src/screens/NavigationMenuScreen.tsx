import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
  ScrollView,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = Math.round(SCREEN_WIDTH * 0.78); 

type MirrorSideMenuProps = {
  isOpen: boolean;
  userName?: string;
  onClose: () => void;
  onNavigate: (route: string) => void;
  logoSource?: ImageSourcePropType;
};

const GOLD = '#E5D6B0';
const PANEL = '#1E2741'; 
const PILL_BG = '#1A2239';

const MirrorSideMenu: React.FC<MirrorSideMenuProps> = ({
  isOpen,
  userName = 'Guest',
  onClose,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  const primaryItems = [
    { label: 'MirrorGPT', route: 'TalkToMirror' },
    { label: 'Echo Vault', route: 'MirrorEchoVaultHome' },
    { label: 'Reflection Room', route: 'ReflectionRoom' },
    { label: 'Code Library', route: 'MirrorCodeLibrary' },
    { label: 'Pledge', route: 'TheMirrorPledge' },
  ];

  const secondaryItems = [
    { label: 'Settings', route: 'Profile' },
    { label: 'About Us', route: 'About' },
    { label: 'FAQ', route: 'FAQ' },
  ];

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.45)" />

      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Drawer starts EXACTLY top-left */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Panel */}
        <View style={[styles.panel, { paddingBottom: insets.bottom }]}>
          {/* Top controls */}
          <View style={[styles.topRow, { paddingTop: Math.max(insets.top, 20) }]}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {}}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.icon}>≡</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onClose}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.icon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* User */}
          <View style={styles.userRow}>
            <Image
              source={require('@assets/Mirror_Collective_Logo_RGB.png')}
              style={[styles.logo]}
              resizeMode="contain"
            />
            <Text style={styles.userName}>{userName}</Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Primary pills */}
            <View style={styles.pillList}>
              {primaryItems.map(item => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.85}
                  onPress={() => {
                    onClose();
                    onNavigate(item.route);
                  }}
                  style={styles.pillHit}
                >
                  <View style={styles.pill}>
                    <LinearGradient
                      colors={[
                        'rgba(255,255,255,0.00)',
                        'rgba(255,255,255,0.10)',
                        'rgba(255,255,255,0.00)',
                      ]}
                      locations={[0, 0.5, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.pillText}>{item.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Big empty space */}
            <View style={{ height: 34 }} />

            {/* Secondary links */}
            <View style={styles.secondary}>
              {secondaryItems.map(item => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.85}
                  onPress={() => {
                    onClose();
                    onNavigate(item.route);
                  }}
                  style={styles.secondaryItem}
                >
                  <Text style={styles.secondaryText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: SCREEN_HEIGHT,
  },

  panel: {
    flex: 1,
    backgroundColor: PANEL,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },

  topRow: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 30,
    color: GOLD,
    opacity: 0.95,
    fontFamily: 'CormorantGaramond-SemiBold',
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },

  logo: {
    width: 38,
    height: 38,
  },

  userName: {
    fontSize: 24,
    color: GOLD,
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    letterSpacing: 0.5,
  },

  scroll: { flex: 1 },

  scrollContent: {
    paddingTop: 6,
    paddingBottom: 18,
  },

  pillList: {
    paddingTop: 6,
  },

  pillHit: {
    paddingHorizontal: 18,
    marginBottom: 10,
    paddingTop: 10,
  },

  pill: {
    height: 40,
    borderRadius: 10,
    backgroundColor: PILL_BG,
    justifyContent: 'center',
    paddingHorizontal: 0,
    overflow: 'hidden',
  },

  pillText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'CormorantGaramond-Italic',
    letterSpacing: 0.8,
  },

  secondary: {
    position: 'relative',
    bottom: 0,
    left: 0,
    paddingHorizontal: 18,
    marginBottom: 10,
  },

  secondaryItem: {
    paddingVertical: 16,
  },

  secondaryText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'CormorantGaramond-Italic',
    letterSpacing: 0.7,
  },
});

export default MirrorSideMenu;
