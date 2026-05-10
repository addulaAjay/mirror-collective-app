import { useNavigation } from '@react-navigation/native';
import { theme, palette, spacing, shadows, textShadow } from '@theme';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthenticatedRoute from '@components/AuthenticatedRoute';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { MessageBubble, ChatInput, LoadingIndicator } from '@components/ui';
import { useChat } from '@hooks/useChat';

// Export content component for testing
export function MirrorChatContent() {
  const navigation = useNavigation();
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

  // Initialize session when component mounts
  useEffect(() => {
    if (!greetingLoaded) {
      initializeSession();
    }
  }, [greetingLoaded, initializeSession]);

  // Track whether the user is pinned to the bottom of the message list.
  // Auto-scrolls (input growth, new messages, layout shifts) only fire when
  // this is true — otherwise we'd yank a user out of their scrolled-back
  // history view every time the input grows or the keyboard reopens.
  const isAtBottomRef = useRef(true);

  // Threshold (in pixels) below which we still consider "at the bottom" —
  // covers small layout jitters and the 1–2px imprecision in scroll math.
  const BOTTOM_THRESHOLD = 32;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      isAtBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD;
    },
    [],
  );

  // When the chat input grows (user typing multiline) the messages region
  // shrinks. Re-anchor to the bottom so the latest message stays visible —
  // but ONLY if the user is already at the bottom. If they've scrolled up
  // to read history, leave their scroll position alone.
  const handleInputContentSizeChange = useCallback(
    (_e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      if (isAtBottomRef.current) {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }
    },
    [scrollViewRef],
  );

  // Same gate for new-message auto-scroll: only follow when the user is
  // already pinned to the bottom of the list.
  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [scrollViewRef]);

  return (
    <BackgroundWrapper style={styles.background}>
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
                <Text style={styles.chatTitle}>MirrorGPT</Text>

                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesWrapper}
                  contentContainerStyle={styles.messagesContent}
                  keyboardShouldPersistTaps="handled"
                  // Keyboard stays open during scrolling AND after sending a
                  // message — the chat-app standard (ChatGPT, iMessage,
                  // WhatsApp). On iOS `interactive` mode interpreted the
                  // programmatic scrollToEnd call after a send as a
                  // "drag-down to dismiss" gesture, so every send closed
                  // the keyboard. `none` keeps the keyboard up; the user
                  // dismisses it explicitly via tap-outside or the
                  // keyboard's hide button.
                  keyboardDismissMode="none"
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={handleContentSizeChange}
                >
                  {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {loading && <LoadingIndicator />}
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

  chatTitle: {
    ...theme.typography.styles.title,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingTop: 30,
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

