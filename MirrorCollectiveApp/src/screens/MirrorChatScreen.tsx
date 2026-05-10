import { useNavigation } from '@react-navigation/native';
import { theme, palette, spacing, shadows, textShadow } from '@theme';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import type { Message } from '@types';
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

  // In an inverted FlatList, contentOffset.y=0 is the BOTTOM (newest
  // message). Tracking distance from the bottom lets us only fire
  // auto-scrolls when the user is already pinned to the newest message;
  // if they've scrolled up to read history, leave their position alone.
  const isAtBottomRef = useRef(true);
  const BOTTOM_THRESHOLD = 32;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // contentOffset.y near 0 in inverted = bottom (newest visible).
      isAtBottomRef.current = e.nativeEvent.contentOffset.y <= BOTTOM_THRESHOLD;
    },
    [],
  );

  // INTENTIONALLY a no-op. Previously this called scrollToOffset whenever
  // the TextInput's content size changed (typing → multiline grow). Two
  // problems with that:
  //
  //   1. In an inverted FlatList, the newest message already sits at the
  //      visual bottom. When the input grows and the FlatList shrinks, the
  //      newest message stays at the bottom of the (now smaller) FlatList
  //      area automatically — no programmatic scroll needed.
  //
  //   2. iOS reports TextInput contentSize changes that aren't from typing
  //      either — re-measuring after layout shifts can fire this callback
  //      during a keyboard-dismiss animation. The programmatic scrollToOffset
  //      then races with the user's drag (they may be mid-scroll), cancels
  //      the gesture, and produces the intermittent "scroll doesn't work"
  //      symptom right after keyboard dismissal.
  //
  // Kept as a callback (instead of removing the prop on ChatInput) so the
  // component contract is unchanged — it's just a no-op now.
  const handleInputContentSizeChange = useCallback(
    (_e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      /* intentional no-op — see comment above */
    },
    [],
  );

  // New message arrived. Auto-scroll to it only if the user was already
  // at the bottom — preserves position when reading older history.
  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current) {
      scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [scrollViewRef]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Message>) => <MessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // FlatList inverted renders data[0] at the visual bottom. Our `messages`
  // are chronological (oldest first), so we reverse before passing in —
  // newest ends up at index 0, closest to the input.
  const messagesReversed = useMemo(() => [...messages].reverse(), [messages]);

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
                  FlatList with inverted={true} — the chat-app standard
                  for message lists. The native ScrollView is flipped
                  upside-down: the first item of `data` renders at the
                  BOTTOM (closest to the input), and contentOffset.y=0
                  corresponds to "viewing the newest message". Scrolling
                  up the screen (drag down with the finger) reveals older
                  messages.

                  Why FlatList not ScrollView+column-reverse: a
                  ScrollView with flexDirection:'column-reverse' looks
                  visually inverted but the native scroll math (content
                  offset, content size) is NOT flipped — so
                  scrollTo({y:0}) doesn't actually go to the visual
                  bottom and auto-scroll silently fails. FlatList's
                  inverted prop sets the underlying native transform, so
                  all scroll APIs behave correctly relative to the
                  visual layout.

                  We pass `messages` in its natural chronological order
                  (oldest first). FlatList inverted will render
                  data[length-1] at the top of the screen and data[0] at
                  the bottom — so we feed it in reverse, putting the
                  newest message at index 0 (visual bottom).
                */}
                <FlatList
                  ref={scrollViewRef}
                  style={styles.messagesWrapper}
                  contentContainerStyle={styles.messagesContent}
                  data={messagesReversed}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  inverted
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="none"
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={handleContentSizeChange}
                  ListHeaderComponent={loading ? <LoadingIndicator /> : null}
                />

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
    // FlatList inverted handles the visual flip natively — we just need
    // padding here. No flexGrow / column-reverse trickery needed.
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});

