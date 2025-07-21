import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import { typography, colors, shadows } from '../styles/typography';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MirrorGPT'>;
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const MirrorGPTScreen: React.FC<Props> = ({ navigation: _navigation }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello Sarah.\nHow may I assist you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputText('');

      // Simulate MirrorGPT response
      setTimeout(() => {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          text: 'The Mirror reflects...',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
      }, 1000);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={require('../../assets/dark_mode_shimmer_bg.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <LogoHeader />

        <View style={styles.contentContainer}>
          {/* Main Chat Container */}
          <View style={styles.chatContainer}>
            {/* Header */}
            <Text style={styles.title}>MirrorGPT</Text>

            {/* Messages Area */}
            <ScrollView
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map(message => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.isUser
                      ? styles.userMessageContainer
                      : styles.assistantMessageContainer,
                  ]}
                >
                  {!message.isUser && <View style={styles.assistantIcon} />}
                  <View
                    style={[
                      styles.messageBubble,
                      message.isUser
                        ? styles.userMessageBubble
                        : styles.assistantMessageBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isUser
                          ? styles.userMessageText
                          : styles.assistantMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input Container */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.microphoneIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask me something"
                  placeholderTextColor={colors.text.muted}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  style={styles.sendButton}
                >
                  <View style={styles.sendIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Prompt */}
          <Text style={styles.bottomPrompt}>
            What are you grateful for today?
          </Text>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    borderRadius: 15,
    shadowColor: shadows.container.color,
    shadowOffset: shadows.container.offset,
    shadowOpacity: shadows.container.opacity,
    shadowRadius: shadows.container.radius,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 120, // Space for LogoHeader
    gap: 20,
  },
  chatContainer: {
    width: 313,
    height: 600,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 0.25,
    borderColor: '#1a2238',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 19,
    elevation: 8,
    // Gradient background effect not supported in StyleSheet; use a gradient component if needed
  },
  title: {
    ...typography.styles.title,
    color: '#e5e3dd',
    textAlign: 'left',
    marginBottom: 20,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  messagesContent: {
    gap: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  assistantIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#e5d6b0',
    borderRadius: 6,
    shadowColor: '#e5d6b0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  messageBubble: {
    maxWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.21,
    shadowRadius: 12,
  },
  userMessageBubble: {
    backgroundColor: '#d9d9d9',
    borderWidth: 0.5,
    borderColor: '#9baac2',
    alignSelf: 'flex-end',
  },
  assistantMessageBubble: {
    backgroundColor: '#e5d6b0',
    borderWidth: 0.25,
    borderColor: '#1a2238',
    alignSelf: 'flex-start',
  },
  messageText: {
    ...typography.styles.body,
    fontSize: 14,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#e5d6b0',
  },
  assistantMessageText: {
    color: '#1a2238',
  },
  inputContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9d9d9',
    borderRadius: 13,
    borderWidth: 0.25,
    borderColor: '#1a2238',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  microphoneIcon: {
    width: 22,
    height: 22,
    backgroundColor: '#9baac2',
    borderRadius: 11,
  },
  textInput: {
    flex: 1,
    ...typography.styles.body,
    fontSize: 16,
    color: 'rgba(163, 179, 204, 0.50)',
    minHeight: 18,
    maxHeight: 80,
  },
  sendButton: {
    padding: 2,
  },
  sendIcon: {
    width: 18,
    height: 18,
    backgroundColor: '#9baac2',
    borderRadius: 9,
  },
  bottomPrompt: {
    ...typography.styles.body,
    color: '#e5d6b0',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
  },
});

export default MirrorGPTScreen;
