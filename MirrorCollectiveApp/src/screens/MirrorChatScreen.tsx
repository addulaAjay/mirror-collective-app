import { useNavigation } from '@react-navigation/native';
import { theme, palette, spacing, shadows, textShadow } from '@theme';
import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Keyboard,
  type NativeSyntheticEvent,
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

  // When the chat input grows (user typing multiline), the messages region
  // shrinks. Re-anchor to the bottom so the latest message stays visible.
  const handleInputContentSizeChange = useCallback(
    (_e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    },
    [scrollViewRef],
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
                <Text style={styles.chatTitle}>MirrorGPT</Text>

                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesWrapper}
                  contentContainerStyle={styles.messagesContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() =>
                    scrollViewRef.current?.scrollToEnd({ animated: true })
                  }
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
