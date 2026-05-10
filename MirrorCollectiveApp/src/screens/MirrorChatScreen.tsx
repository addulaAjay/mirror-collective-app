import { useNavigation } from '@react-navigation/native';
import { theme, palette, spacing, shadows, textShadow } from '@theme';
import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
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
  // Replaces the old Keyboard.addListener('keyboardDidShow', scrollToEnd)
  // pattern — keyboard-controller handles keyboard offsets natively.
  const handleInputContentSizeChange = useCallback(
    (_e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    },
    [scrollViewRef],
  );

  return (
    <BackgroundWrapper style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <LogoHeader navigation={navigation} />

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
              <Text style={styles.headerText}>
                What are you grateful for today?
              </Text>

              {/* KeyboardAwareScrollView replaces the previous
                  ScrollView + KeyboardAvoidingView + Keyboard listener
                  setup. The lib auto-scrolls the focused input into view
                  and animates content alongside the keyboard's spring,
                  no manual offset math needed. */}
              <KeyboardAwareScrollView
                // useChat exposes a ScrollView ref; KeyboardAwareScrollViewRef
                // is API-compatible (same scrollTo/scrollToEnd/etc) but
                // TypeScript treats them as distinct types. Safe cast.
                ref={scrollViewRef as React.Ref<KeyboardAwareScrollViewRef>}
                style={styles.messagesWrapper}
                contentContainerStyle={styles.messagesContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                bottomOffset={16}
                onContentSizeChange={() =>
                  scrollViewRef.current?.scrollToEnd({ animated: true })
                }
              >
                {messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {loading && <LoadingIndicator />}
              </KeyboardAwareScrollView>

              <ChatInput
                value={draft}
                onChangeText={setDraft}
                onSend={sendMessage}
                onContentSizeChange={handleInputContentSizeChange}
                disabled={loading}
              />
            </View>
          </LinearGradient>
          <View>
            <Text style={styles.footerText} />
          </View>
        </View>
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

  chatWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.l,
  },

  footerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    lineHeight: 28,
    color: palette.gold.chat,
    paddingBottom: 15,
    textAlign: 'center',
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

