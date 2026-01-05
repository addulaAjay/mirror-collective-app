import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import AuthenticatedRoute from '@components/AuthenticatedRoute';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { MessageBubble, ChatInput, LoadingIndicator } from '@components/ui';
import {
  COLORS,
  SHADOWS,
  SPACING,
  // SCREEN_DIMENSIONS,
  PLATFORM_SPECIFIC,
} from '@constants';
import { useChat } from '@hooks/useChat';
import { theme } from '@theme';

// Export content component for testing
export function MirrorChatContent() {
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

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />

        <BackgroundWrapper style={styles.background}>
          <LogoHeader />

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
                <Text style={styles.headerText}>What are you grateful for today?</Text>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesWrapper}
                  contentContainerStyle={styles.messagesContent}
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
                  disabled={loading}
                />

              </View>
            </LinearGradient>
            <View>
              <Text style={styles.footerText} />
            </View>
          </View>
        </BackgroundWrapper>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

export default function MirrorChatScreen() {
  return (
    <AuthenticatedRoute>
      <MirrorChatContent />
    </AuthenticatedRoute >
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: PLATFORM_SPECIFIC.STATUS_BAR_HEIGHT,
  },
  keyboardContainer: {
    flex: 1,
  },

  background: {
    flex: 1,
    // paddingTop: 120, // Space for LogoHeader (48 + 46 + 26 margin)
    paddingHorizontal: SPACING.XL,
    justifyContent: 'flex-start',
  },

  chatWrapper: {
    flex: 1,
    width: '100%',
    paddingRight: 20,
    paddingLeft: 20,
  },

  footerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    lineHeight: 28,
    color: COLORS.TEXT.SYSTEM_MESSAGE,
    paddingTop: 50,
    paddingBottom: 15,
    textAlign: 'center',
  },

  headerText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 28,
    color: COLORS.TEXT.SYSTEM_MESSAGE,
    paddingTop: 24,
    textAlign: 'center',
  },

  chatContainer: {
    flex: 1,
    width: '100%',
    // height: SCREEN_DIMENSIONS.HEIGHT * 0.72,
    borderRadius: SPACING.LG,
    padding: SPACING.XL,
    marginTop: SPACING.XL,
    marginBottom: SPACING.SM,
    alignSelf: 'center',
    justifyContent: 'space-between',

    ...SHADOWS.LIGHT,
  },

  chatTitle: {
    ...theme.typography.styles.title,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
    color: COLORS.TEXT.TITLE,
    textAlign: 'center',
    marginTop: 28,
  },

  messagesWrapper: {
    flex: 1,
    borderRadius: SPACING.LG,
  },

  GradientWrapper: {
    flex: 1,
    borderRadius: SPACING.XL,
  },

  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: SPACING.SM,
  },


});
