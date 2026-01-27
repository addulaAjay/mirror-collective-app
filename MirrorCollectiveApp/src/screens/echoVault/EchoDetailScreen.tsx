// EchoDetailScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  EchoDetail: {
    title?: string;
    body?: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'EchoDetail'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.70)';
const BORDER = 'rgba(253,253,249,0.16)';
const BORDER_SOFT = 'rgba(253,253,249,0.08)';
const SURFACE = 'rgba(7,9,14,0.36)';

const DEFAULT_BODY =
  `Today, as I watched you graduate, I felt time fold in on itself. I saw the child you once were—the small hands, the questions that never seemed to end, the way you looked to me for reassurance—and I saw the person standing before me now, shaped by years of effort, uncertainty, growth, and grace.\n\n` +
  `This moment is not a finish line. It’s a recognition of how far you’ve already traveled.\n\n` +
  `There were days when the path felt clear, and days when it didn’t. Days when confidence came easily, and others when it had to be rebuilt from doubt. What matters most to me isn’t that you arrived here, but how you did—by learning to try again, by carrying kindness even when things felt heavy, and by becoming someone who listens to the world and to themselves.\n\n` +
  `Keep going. Keep choosing what’s true. I’m proud of you.`;

const EchoDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const title = route.params?.title ?? 'Voice of Becoming';
  const body = route.params?.body ?? DEFAULT_BODY;

  const [folderModalOpen, setFolderModalOpen] = useState(false);

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);
  const textBoxHeight = useMemo(() => Math.min(H * 0.54, 470), []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.root}>
        {/* Background */}
        <LinearGradient
          colors={['#05060A', '#070915', '#0B0F1A']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.headerRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.iconBtn}
            onPress={() => {}}
          >
            <Text style={styles.iconText}>≡</Text>
          </TouchableOpacity>

          <View style={styles.brandWrap}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoMark}>⟡</Text>
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTop}>The</Text>
              <Text style={styles.brandMain}>MIRROR</Text>
              <Text style={styles.brandMain}>COLLECTIVE</Text>
            </View>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>

        {/* Back + Title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.titleRightSpacer} />
        </View>

        {/* Text box */}
        <View
          style={[
            styles.textBoxShell,
            { width: contentWidth, height: textBoxHeight },
          ]}
        >
          <LinearGradient
            colors={['rgba(253,253,249,0.07)', 'rgba(253,253,249,0.02)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.textBoxGradient}
          >
            <View style={styles.textBoxInnerBorder}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.bodyText}>{body}</Text>
              </ScrollView>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom actions */}
        <View style={[styles.actionsRow, { width: contentWidth }]}>
          <ActionIconButton label="⬇" onPress={() => {}} />
          <ActionPrimaryButton
            label="VAULT"
            onPress={() => setFolderModalOpen(true)}
          />
          <ActionIconButton label="✎" onPress={() => {}} />
        </View>

        {/* Folder modal sheet (the bottom panel hinted in your screenshot) */}
        <Modal
          visible={folderModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFolderModalOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setFolderModalOpen(false)}
          >
            <Pressable
              style={[styles.sheet, { width: Math.min(W * 0.92, 420) }]}
            >
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  Choose folders that you want to share with this Guardian
                </Text>
                <TouchableOpacity
                  onPress={() => setFolderModalOpen(false)}
                  style={styles.sheetClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sheetBody}>
                <Text style={styles.sheetHint}>
                  (Stub UI) Add your folder list here.
                </Text>

                <View style={styles.fakeRow}>
                  <View style={styles.fakeBox} />
                  <Text style={styles.fakeLabel}>Family</Text>
                </View>
                <View style={styles.fakeRow}>
                  <View style={styles.fakeBox} />
                  <Text style={styles.fakeLabel}>Legacy Capsule</Text>
                </View>
                <View style={styles.fakeRow}>
                  <View style={styles.fakeBox} />
                  <Text style={styles.fakeLabel}>Selected Memories</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setFolderModalOpen(false)}
                  style={styles.sheetCtaWrap}
                >
                  <LinearGradient
                    colors={[
                      'rgba(253,253,249,0.10)',
                      'rgba(253,253,249,0.03)',
                    ]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.sheetCtaShell}
                  >
                    <View style={styles.sheetCtaInner}>
                      <Text style={styles.sheetCtaText}>SAVE TO VAULT</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default EchoDetailScreen;

/* ---------- Buttons ---------- */

const ActionIconButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ width: 64 }}
    >
      <LinearGradient
        colors={['rgba(253,253,249,0.10)', 'rgba(253,253,249,0.03)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.iconBtnShell}
      >
        <View style={styles.iconBtnInner}>
          <Text style={styles.iconBtnLabel}>{label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const ActionPrimaryButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
      <LinearGradient
        colors={['rgba(253,253,249,0.10)', 'rgba(253,253,249,0.03)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.primaryBtnShell}
      >
        <View style={styles.primaryBtnInner}>
          <Text style={styles.primaryBtnText}>{label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05060A' },
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },

  headerRow: {
    marginTop: 10,
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
  iconText: { color: OFFWHITE, fontSize: 24, opacity: 0.9 },

  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.10)',
  },
  logoMark: { color: GOLD, fontSize: 16 },
  brandTextWrap: { alignItems: 'center' },
  brandTop: {
    color: 'rgba(215,192,138,0.85)',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 1,
  },
  brandMain: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 14,
  },
  headerRightSpacer: { width: 44, height: 44 },

  titleRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: { color: 'rgba(215,192,138,0.9)', fontSize: 30, marginLeft: 2 },
  screenTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 26,
    letterSpacing: 1.2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    maxWidth: '78%',
    textAlign: 'center',
  },
  titleRightSpacer: { width: 44, height: 44 },

  textBoxShell: {
    marginTop: 16,
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  textBoxGradient: { flex: 1, borderRadius: 18, padding: 1 },
  textBoxInnerBorder: {
    flex: 1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14 },
  bodyText: {
    color: 'rgba(253,253,249,0.84)',
    fontSize: 15,
    lineHeight: 22,
  },

  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  iconBtnShell: {
    width: 64,
    height: 52,
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.22)',
  },
  iconBtnInner: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: 'rgba(7,9,14,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnLabel: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 20,
  },

  primaryBtnShell: {
    height: 52,
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.28)',
  },
  primaryBtnInner: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: 'rgba(7,9,14,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 18,
    letterSpacing: 1.4,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  /* Modal sheet */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 26,
  },
  sheet: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.22)',
    backgroundColor: 'rgba(10,12,18,0.96)',
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(253,253,249,0.08)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetTitle: {
    flex: 1,
    color: 'rgba(215,192,138,0.92)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.10)',
    backgroundColor: 'rgba(253,253,249,0.03)',
  },
  sheetCloseText: { color: OFFWHITE, fontSize: 14, opacity: 0.9 },

  sheetBody: { padding: 14 },
  sheetHint: {
    color: SUBTEXT,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },

  fakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  fakeBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: 'transparent',
  },
  fakeLabel: { color: OFFWHITE, fontSize: 14 },

  sheetCtaWrap: { marginTop: 14 },
  sheetCtaShell: {
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.28)',
  },
  sheetCtaInner: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: 'rgba(7,9,14,0.28)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCtaText: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 16,
    letterSpacing: 1.2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
