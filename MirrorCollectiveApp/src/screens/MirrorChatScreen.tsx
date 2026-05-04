import { useNavigation } from '@react-navigation/native';
import { theme, palette, spacing, shadows, textShadow } from '@theme';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthenticatedRoute from '@components/AuthenticatedRoute';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { MessageBubble, ChatInput, LoadingIndicator } from '@components/ui';
import { useChat } from '@hooks/useChat';

const { height: screenHeight } = Dimensions.get('window');

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

  // Ensure the latest message stays visible when keyboard shows/hides
  useEffect(() => {
    const scrollToEnd = () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    const showSub = Keyboard.addListener('keyboardDidShow', scrollToEnd);
    const hideSub = Keyboard.addListener('keyboardDidHide', scrollToEnd);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollViewRef]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? StatusBar.currentHeight || 0 : -70
      }
    >
      <BackgroundWrapper style={styles.background} scrollable>
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

                {/* Bounded wrapper gives ScrollView a fixed constraint */}
                <View style={styles.messagesWrapper}>
                  <ScrollView
                    ref={scrollViewRef}
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
                </View>

                <ChatInput
                  value={draft}
                  onChangeText={setDraft}
                  onSend={sendMessage}
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
    </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
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
