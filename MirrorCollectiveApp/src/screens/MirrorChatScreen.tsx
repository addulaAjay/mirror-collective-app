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

  // In an inverted ScrollView, scrollY=0 is the BOTTOM (newest message).
  // We track whether the user is near the bottom (newest) so auto-scrolls
  // on new messages / input growth only fire when they were already
  // following the latest — preserves their position when reading history.
  const isAtBottomRef = useRef(true);
  const BOTTOM_THRESHOLD = 32;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Bottom = scrollY near 0 in inverted layout.
      isAtBottomRef.current = e.nativeEvent.contentOffset.y <= BOTTOM_THRESHOLD;
    },
    [],
  );

  // Input grew (typing multiline) — re-anchor to the newest message.
  // In inverted layout that means scrolling to y=0, not scrollToEnd.
  const handleInputContentSizeChange = useCallback(
    (_e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      if (isAtBottomRef.current) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }
    },
    [scrollViewRef],
  );

  // New message arrived (or removed): follow it if user was at the bottom.
  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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

                {/*
                  Inverted rendering — the standard chat-app layout
                  (FlatList inverted / `flex-direction: column-reverse`).
                  Why this matters here:

                  - The previous flexGrow:1 + justifyContent:flex-end
                    pattern stretched the content to fill the viewport
                    when there were few messages, leaving the ScrollView
                    with zero scroll range — so dragging anywhere did
                    nothing. When the keyboard closed (viewport grew),
                    even more messages could fit, and scroll stayed dead.
                  - column-reverse flips the layout: messages render from
                    the BOTTOM upward. Few messages naturally pin to the
                    bottom (no need for flexGrow trickery). The scroll
                    responder is engaged whenever content height >
                    viewport — including the moment a single bubble
                    overflows it.
                  - In inverted layout, scrollY=0 is the BOTTOM (newest).
                    To follow a new message, scrollTo({ y: 0 }) — handled
                    in handleContentSizeChange.

                  The messages array stays in chronological order; we
                  reverse it at render time so column-reverse stacks them
                  bottom-up correctly (newest closest to the input).
                */}
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesWrapper}
                  contentContainerStyle={styles.messagesContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="none"
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={handleContentSizeChange}
                >
                  {loading && <LoadingIndicator />}
                  {[...messages].reverse().map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
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
    // Inverted-chat layout: column-reverse stacks children from the bottom
    // up. First child of the rendered array (which is the NEWEST message
    // since we reverse messages before mapping) sits closest to the input.
    // No flexGrow needed — content sizes to itself, the ScrollView scrolls
    // when (and only when) content overflows, which is the standard chat
    // scroll feel: drag to reveal history is always responsive.
    flexDirection: 'column-reverse',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});

