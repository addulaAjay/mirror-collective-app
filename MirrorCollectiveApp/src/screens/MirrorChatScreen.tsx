import React, { useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LogoHeader from '../components/LogoHeader';
import AuthenticatedRoute from '../components/AuthenticatedRoute';
import { MessageBubble, ChatInput, LoadingIndicator } from '../components/ui';
import { useChat } from '../hooks/useChat';
import {
  COLORS,
  SPACING,
  BORDERS,
  SHADOWS,
  LAYOUT,
  TEXT_STYLES,
  TYPOGRAPHY,
} from '../styles';

export default function MirrorChatScreen() {
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
    <AuthenticatedRoute>
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

          <ImageBackground
            source={require('../../assets/dark_mode_shimmer_bg.png')}
            style={styles.background}
            resizeMode="cover"
          >
            <LogoHeader />

            <View style={styles.chatWrapper}>
              <LinearGradient
                colors={[
                  'rgba(155, 170, 194, 0.01)', // top
                  'rgba(155, 170, 194, 0.18)', // bottom
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gradientWrapper}
              >
                {/* Chat card */}
                <View style={styles.chatContainer}>
                  <Text style={styles.chatTitle}>MirrorGPT</Text>

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
                <Text style={styles.footerText}>
                  What are you grateful for today?
                </Text>
              </View>
            </View>
          </ImageBackground>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AuthenticatedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  keyboardContainer: {
    flex: 1,
  },
  background: {
    flex: 1,
    paddingHorizontal: SPACING.XL,
    justifyContent: 'flex-start',
  },
  chatWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: SPACING.L,
  },
  gradientWrapper: {
    flex: 1,
    borderRadius: BORDERS.RADIUS.LARGE,
    overflow: 'hidden',
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    borderRadius: BORDERS.RADIUS.LARGE,
    padding: LAYOUT.CARD_PADDING,
    marginTop: SPACING.XL,
    marginBottom: SPACING.S,
    alignSelf: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    ...SHADOWS.MEDIUM,
  },
  chatTitle: {
    ...TEXT_STYLES.h3,
    fontFamily: 'CormorantGaramond-Regular',
    fontWeight: '400',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: SPACING.M,
    color: COLORS.TEXT.SECONDARY,
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: SPACING.S,
  },
  footerText: {
    ...TEXT_STYLES.bodySecondary,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: TYPOGRAPHY.SIZES.L,
    textAlign: 'center',
    paddingTop: SPACING.XXL,
    paddingBottom: SPACING.M,
    fontWeight: undefined,
  },
});
