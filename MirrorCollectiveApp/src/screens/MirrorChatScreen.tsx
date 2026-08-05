import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Keyboard,
  Pressable,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import AuthenticatedRoute from '@components/AuthenticatedRoute';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import MirrorGptInfoModal from '@components/MirrorGptInfoModal';
import { MessageBubble, ChatInput, TypingIndicator } from '@components/ui';
import { useChat } from '@hooks/useChat';
import {
  TTS_FEATURE_ENABLED,
  useAutoReadOnNewMessage,
  useAutoReadPreference,
} from '@services/speech';
import { theme, palette, spacing, shadows, textShadow } from '@theme';

/** Circled "i" glyph (gold) — opens the "Capture your reflection" info modal. */
const InfoGlyph: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={12}
      cy={12}
      r={9.25}
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.5}
    />
    <Circle cx={12} cy={7.9} r={1.05} fill={palette.gold.DEFAULT} />
    <Path
      d="M12 11.2v5.4"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </Svg>
);

// Export content component for testing
export function MirrorChatContent() {
  const navigation = useNavigation();
  const [infoVisible, setInfoVisible] = React.useState(false);
  const {
    messages,
    draft,
    loading,
    greetingLoaded,
    scrollViewRef,
    initializeSession,
    sendMessage,
    setDraft,
  } = useChat();
  // Read the preference unconditionally so the hook call shape is
  // stable across renders; only wire it into the auto-read effect
  // when the TTS feature is flagged on.
  const { enabled: autoReadEnabled } = useAutoReadPreference();

  // Measured height of the messages ScrollView, used to gate auto-scroll so
  // it only fires when the messages genuinely overflow the viewport.
  const messagesFrameH = React.useRef(0);

  // When auto-read is on, this hook speaks each new assistant reply on
  // arrival. Gated by TTS_FEATURE_ENABLED so the feature stays dormant
  // until the OpenAI-voice migration lands (see featureFlag.ts comment
  // and docs/FUTURE_TTS_OPENAI_VOICE.md). Passing `false` makes the
  // hook a no-op without changing the React call order.
  useAutoReadOnNewMessage(messages, TTS_FEATURE_ENABLED && autoReadEnabled);

  // Initialize session when component mounts
  useEffect(() => {
    if (!greetingLoaded) {
      initializeSession();
    }
  }, [greetingLoaded, initializeSession]);

  // When the chat input grows (user typing multiline), the messages region
  // shrinks. Re-anchor to the bottom so the latest message stays visible.
  const handleInputContentSizeChange = useCallback(
    (_e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    },
    [scrollViewRef],
  );

  // Save a MirrorGPT reply into a new Echo: hand its text to the create-Echo
  // flow (title/category/recipient → Create Echo, prefilled with this text).
  const handleSaveToEcho = useCallback(
    (text: string) => {
      navigation.navigate(
        'NewEchoScreen' as never,
        { prefillContent: text } as never,
      );
    },
    [navigation],
  );

  // Re-anchor to the bottom whenever the keyboard appears. KeyboardAvoidingView
  // (from keyboard-controller) handles the layout shift — it adds bottom padding
  // equal to the keyboard height — but it does NOT adjust the ScrollView's
  // scroll offset. Without this, the visible area shrinks when the keyboard
  // comes up and the latest message ends up behind the input. Native RN
  // Keyboard events work alongside keyboard-controller's KAV; the library
  // doesn't replace the event API.
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    return () => showSub.remove();
  }, [scrollViewRef]);

  return (
    <BackgroundWrapper style={styles.background} scrollable>
      <SafeAreaView style={styles.safeArea}>
        <LogoHeader navigation={navigation} />

        {/* KeyboardAvoidingView (from react-native-keyboard-controller)
            wraps BOTH the message scroller AND the chat input — this is
            the canonical chat-surface pattern. The input is a sibling of
            the scroller, so it must be inside the same KAV for the lib
            to push it above the keyboard. KASV would only handle its own
            children, leaving the sibling input behind the keyboard.

            behavior="padding" on iOS adds bottom padding equal to the
            keyboard height; on Android the windowSoftInputMode=adjustResize
            in AndroidManifest.xml handles it natively. */}
        <KeyboardAvoidingView behavior="padding" style={styles.kav}>
          <View style={styles.chatWrapper}>
            <LinearGradient
              colors={[
                'rgba(155, 170, 194, 0.01)', // top
                'rgba(155, 170, 194, 0.18)', // bottom
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.GradientWrapper}
            >
              {/* Chat "card" */}
              <View style={styles.chatContainer}>
                <View style={styles.titleRow}>
                  {/* Left spacer balances the info button so the title stays
                      optically centered. */}
                  <View style={styles.titleSpacer} />
                  <Text style={styles.chatTitle}>MirrorGPT</Text>
                  <Pressable
                    onPress={() => setInfoVisible(true)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="How MirrorGPT works"
                    style={styles.infoButton}
                  >
                    <InfoGlyph />
                  </Pressable>
                </View>

                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesWrapper}
                  contentContainerStyle={styles.messagesContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  alwaysBounceVertical={false}
                  onLayout={e => {
                    messagesFrameH.current = e.nativeEvent.layout.height;
                  }}
                  onContentSizeChange={(_w, h) => {
                    // Only auto-scroll when messages actually overflow the
                    // viewport. Firing scrollToEnd on every content-size
                    // change (e.g. the input growing, or a short list that
                    // already fits) caused a spurious animated "scrolls by
                    // itself" jump. No overflow → nothing to scroll.
                    if (h > messagesFrameH.current) {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }
                  }}
                >
                  {messages.map(message => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onSave={
                        message.sender === 'user'
                          ? undefined
                          : () => handleSaveToEcho(message.text)
                      }
                    />
                  ))}
                  {loading && <TypingIndicator />}
                </ScrollView>

                <ChatInput
                  value={draft}
                  onChangeText={setDraft}
                  onSend={sendMessage}
                  onContentSizeChange={handleInputContentSizeChange}
                  disabled={loading}
                />
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>

        <MirrorGptInfoModal
          visible={infoVisible}
          onClose={() => setInfoVisible(false)}
        />
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

export default function MirrorChatScreen() {
  return (
    <AuthenticatedRoute>
      <MirrorChatContent />
    </AuthenticatedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  background: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  kav: {
    flex: 1,
    width: '100%',
  },

  chatWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.l,
  },

  headerText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 22,
    fontWeight: 'thin',
    lineHeight: 28,
    color: palette.gold.chat,
    paddingTop: 24,
    textAlign: 'center',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },

  chatContainer: {
    flex: 1,
    width: '100%',
    borderRadius: spacing.m,
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
    alignSelf: 'center',
    ...shadows.LIGHT,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: spacing.xs,
  },

  titleSpacer: {
    width: 24,
    height: 24,
  },

  infoButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chatTitle: {
    ...theme.typography.styles.title,
    flex: 1,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },

  messagesWrapper: {
    flex: 1,
    borderRadius: spacing.m,
  },

  GradientWrapper: {
    flex: 1,
    borderRadius: spacing.l,
  },

  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});
