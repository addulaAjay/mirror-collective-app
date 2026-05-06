import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  palette, fontFamily, fontSize, fontWeight, lineHeight,
  spacing, radius, borderWidth, textShadow,
  scale, verticalScale, moderateScale,
} from '@theme';
import { RootStackParamList } from '@types';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { VideoRef } from 'react-native-video';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, EchoResponse } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'EchoVideoPlaybackScreen'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = palette.gold.mid;
const OFFWHITE = 'rgba(253,253,249,0.92)';
const BORDER = 'rgba(253,253,249,0.16)';
const BORDER_SOFT = 'rgba(253,253,249,0.08)';
const SURFACE = 'rgba(7,9,14,0.40)';

const EchoVideoPlaybackScreen: React.FC<Props> = ({ navigation, route }) => {
  const { echoId, title } = route.params; // Expect echoId passed in params
  const [echo, setEcho] = useState<EchoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const isRecipient = !!echo?.sender;
  const [vaulting, setVaulting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const videoRef = useRef<VideoRef>(null);

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);
  const videoHeight = useMemo(() => Math.min(H * 0.55, 460), []);

  useEffect(() => {
    fetchEchoDetails();
  }, [echoId]);

  const fetchEchoDetails = async () => {
    try {
      setLoading(true);
      const response = await echoApiService.getEcho(echoId);
      if (response.data) {
        setEcho(response.data);
      } else {
        Alert.alert('Error', 'Echo not found');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Failed to fetch echo details:', error);
      Alert.alert('Error', error.message || 'Failed to load echo details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!echo) return;
    try {
      await Share.share({ url: echo.media_url ?? '', message: echo.title });
    } catch { /* dismissed */ }
  };

  const handleVault = async () => {
    if (!echo || vaulting) return;
    setVaulting(true);
    try {
      const res = await echoApiService.createEcho({
        title: echo.title,
        category: echo.category,
        echo_type: 'VIDEO',
      });
      if (!res.success || !res.data) throw new Error('Failed to save to vault.');
      if (echo.media_url) {
        await echoApiService.updateEcho(res.data.echo_id, { media_url: echo.media_url });
      }
      Alert.alert('Saved', 'Echo added to your vault.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add to vault.');
    } finally {
      setVaulting(false);
    }
  };

  const handleEdit = () => {
    if (!echo) return;
    navigation.navigate('NewEchoComposeScreen', {
      mode: 'video',
      title: echo.title,
      category: echo.category,
      editEchoId: echo.echo_id,
      recipientId: echo.recipient?.recipient_id,
      recipientName: echo.recipient?.name,
    });
  };

  const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    setBuffering(isBuffering);
  };

  const onError = (error: any) => {
    console.error('Video error:', error);
    Alert.alert('Playback Error', 'Failed to play video');
  };

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header */}
        <LogoHeader navigation={navigation} />

        {/* Back + Title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
          </TouchableOpacity>

          <Text style={styles.screenTitle} numberOfLines={1}>
            {echo?.title || title || 'Echo Video'}
          </Text>

          <View style={styles.titleRightSpacer} />
        </View>

        {/* Video container */}
        <View
          style={[
            styles.videoShell,
            { width: contentWidth, height: videoHeight },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="large" color={GOLD} />
          ) : echo?.media_url ? (
            <>
              <Video
                source={{ uri: echo.media_url }}
                ref={videoRef}
                style={StyleSheet.absoluteFill}
                paused={paused}
                onBuffer={onBuffer}
                onError={onError}
                resizeMode="cover"
                repeat
              />
              
              {/* Overlay controls */}
              <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
                onPress={() => setPaused(!paused)}
              >
                {paused && (
                  <View style={styles.playOverlay}>
                    <View style={styles.playOuter}>
                      <View style={styles.playInner}>
                        <Text style={styles.playIcon}>▶</Text>
                      </View>
                    </View>
                  </View>
                )}
                {buffering && (
                   <View style={styles.playOverlay}>
                     <ActivityIndicator size="large" color={GOLD} />
                   </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
             <View style={styles.errorContainer}>
               <Text style={styles.errorText}>No video available</Text>
             </View>
          )}

          <LinearGradient
            colors={['rgba(253,253,249,0.06)', 'rgba(253,253,249,0.02)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.videoGradient} // Border overlay
            pointerEvents="none"
          >
            <View style={styles.videoInnerBorder} />
          </LinearGradient>
        </View>

        {/* Bottom actions */}
        <View style={[styles.actionsRow, { width: contentWidth }]}>
          <ActionIconButton icon={require('@assets/download.png')} onPress={handleDownload} />
          <Button variant="primary" size="L" title={vaulting ? 'SAVING...' : 'VAULT'} onPress={handleVault} style={styles.vaultBtn} />
          {!isRecipient && (
            <ActionIconButton icon={require('@assets/edit-icon.png')} onPress={handleEdit} />
          )}
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default EchoVideoPlaybackScreen;

/* ---------- Action Buttons ---------- */

const ActionIconButton = ({ icon, onPress }: { icon: ReturnType<typeof require>; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
    <LinearGradient
      colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.iconBtnShell}
    >
      <Image source={icon} style={styles.iconBtnImg} resizeMode="contain" />
    </LinearGradient>
  </TouchableOpacity>
);


/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
  root: {
    flex: 1,
    alignItems: 'center',
  },

  /* Header */
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: OFFWHITE, fontSize: 24 },

  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GOLD,
  },
  brandTextWrap: { alignItems: 'center' },
  brandTop: { color: GOLD, fontSize: 10, letterSpacing: 1 },
  brandMain: { color: GOLD, fontSize: 12, letterSpacing: 2, lineHeight: 14 },
  headerRightSpacer: { width: 44 },

  /* Title */
  titleRow: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backIcon: { color: GOLD, fontSize: 30 },
  backArrowImg: { width: 20, height: 20, tintColor: GOLD },
  screenTitle: {
    color: GOLD,
    fontSize: 28,
    letterSpacing: 2,
    textAlign: 'center',
    maxWidth: '78%',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: 16,
  },
  titleRightSpacer: { width: 44 },

  /* Video */
  videoShell: {
    marginTop: 20,
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  videoGradient: { flex: 1, borderRadius: 18, padding: 1 },
  videoInnerBorder: {
    flex: 1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(215,192,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: 'rgba(7,9,14,0.9)',
    fontSize: 28,
    marginLeft: 2,
  },

  /* Actions */
  actionsRow: {
    marginTop: verticalScale(spacing.m),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(spacing.xl),   // Figma: gap 24px
    justifyContent: 'center',
    paddingBottom: verticalScale(spacing.m),
  },
  // Same padding as Button size="L" so icon buttons match VAULT height
  iconBtnShell: {
    paddingVertical: verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.m),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(253,253,249,0.03)',
  },
  iconBtnImg: {
    width: scale(24),
    height: scale(24),
    tintColor: palette.gold.DEFAULT,
  },
  vaultBtn: {
    minWidth: scale(110),
  },
  
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    // eslint-disable-next-line no-restricted-syntax -- true black required for video player background
    backgroundColor: '#000',
  },
  errorText: {
    color: OFFWHITE,
    fontSize: 16,
  },
});
