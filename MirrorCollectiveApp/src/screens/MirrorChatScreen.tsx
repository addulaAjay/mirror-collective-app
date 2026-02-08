import {
  COLORS,
  SHADOWS,
  SPACING,
  SCREEN_DIMENSIONS,
  PLATFORM_SPECIFIC,
} from '@constants';
import { theme } from '@theme';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import AuthenticatedRoute from '@components/AuthenticatedRoute';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { MessageBubble, ChatInput, LoadingIndicator } from '@components/ui';
import { useNavigation } from '@react-navigation/native';
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
        Platform.OS === 'ios' ? PLATFORM_SPECIFIC.STATUS_BAR_HEIGHT : -70
      }
    >
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
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesWrapper}
                  contentContainerStyle={styles.messagesContent}
                  keyboardShouldPersistTaps="handled"
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
    paddingTop: 20,
    paddingHorizontal: SPACING.XL,
  },

  footerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    lineHeight: 28,
    color: COLORS.TEXT.SYSTEM_MESSAGE,
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
    height: SCREEN_DIMENSIONS.HEIGHT * 0.72,
    borderRadius: SPACING.LG,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XL,
    marginTop: SPACING.XL,
    // marginBottom: SPACING.SM,
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
    paddingTop: 30,
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
    paddingHorizontal: SPACING.SM,
  },
});
