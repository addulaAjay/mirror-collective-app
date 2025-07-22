import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import AuthenticatedRoute from '../components/AuthenticatedRoute';
import { MessageBubble, ChatInput, LoadingIndicator } from '../components/ui';
import { useChat } from '../hooks/useChat';
import {
  COLORS,
  SHADOWS,
  SPACING,
  SCREEN_DIMENSIONS,
  PLATFORM_SPECIFIC,
} from '../constants';
import { theme } from '../theme';

export default function MirrorChatScreen() {
  const { messages, draft, loading, scrollViewRef, sendMessage, setDraft } =
    useChat();

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
          <LogoHeader />

          {/* Chat “card” */}
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

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              What are you grateful for today?
            </Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    </AuthenticatedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: PLATFORM_SPECIFIC.STATUS_BAR_HEIGHT,
  },

  background: {
    flex: 1,
    paddingTop: 120, // Space for LogoHeader (48 + 46 + 26 margin)
    paddingHorizontal: SPACING.XL,
    justifyContent: 'flex-start',
  },

  footer: {
    paddingHorizontal: SPACING.XL,
    paddingBottom: SPACING.XL,
  },

  footerText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 24,
    lineHeight: 24,
    color: COLORS.TEXT.SYSTEM_MESSAGE,
    paddingTop: SPACING.MD,
    textAlign: 'center',
  },

  chatContainer: {
    width: '100%',
    height: SCREEN_DIMENSIONS.HEIGHT * 0.65,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: SPACING.XL,
    padding: SPACING.LG,
    marginTop: SPACING.XL,
    marginBottom: SPACING.LG,
    alignSelf: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.LIGHT,
  },

  chatTitle: {
    ...theme.typography.styles.title,
    color: COLORS.TEXT.TITLE,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: SPACING.MD,
  },

  messagesWrapper: {
    flex: 1,
  },

  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: SPACING.SM,
  },
});
