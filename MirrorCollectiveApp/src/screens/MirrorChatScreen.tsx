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
  SHADOWS,
  SPACING,
  // SCREEN_DIMENSIONS,
  PLATFORM_SPECIFIC,
} from '../constants';
import { theme } from '../theme';

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
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                style={styles.GradientWrapper}
              >
                {/* Chat "card" */}
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
          </KeyboardAvoidingView>
        </ImageBackground>

      </SafeAreaView>
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
    paddingTop: 20
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

  chatContainer: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
    color: COLORS.TEXT.TITLE,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: SPACING.MD,
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
