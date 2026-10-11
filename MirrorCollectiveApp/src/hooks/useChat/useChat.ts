import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { useUser } from '@context/UserContext';
import {
  prepareChatPhoto,
  readPhotoAsBase64,
  type PreparedChatPhoto,
} from '@features/chat-media';
import { useAudioRecorder } from '@hooks/useAudioRecorder';
import {
  chatApiService,
  sessionApiService,
  transcribeApiService,
} from '@services/api';
import { SessionManager } from '@services/sessionManager';
import type { ChatAttachment, Message } from '@types';
import { getApiErrorMessage } from '@utils/apiErrorUtils';
import { CHAT_AUDIO_CONTENT_TYPE } from '@utils/media/mime';
import { ensureCameraPermission } from '@utils/permissions/media';

/**
 * Custom hook for managing chat functionality with MirrorGPT integration
 */
const createMessage = (
  text: string,
  sender: 'user' | 'system',
  attachments?: ChatAttachment[],
): Message => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  text,
  sender,
  timestamp: new Date(),
  ...(attachments && attachments.length > 0 ? { attachments } : {}),
});

const toFirstNameOnly = (
  text: string,
  fullName: string | undefined,
): string => {
  if (!fullName) return text;
  const firstName = fullName.trim().split(' ')[0];
  const full = fullName.trim();
  if (full === firstName) return text;
  return text.split(full).join(firstName);
};

export const useChat = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  // Staged photo, V1 allows at most one. Holds the PREPARED (HEIC-converted,
  // compressed) local file — the expensive work happens at pick time so the
  // send tap stays responsive. The bytes are only read at send time.
  const [prepared, setPrepared] = useState<PreparedChatPhoto | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  // Synchronous in-flight guard. `greetingLoaded` alone can't prevent
  // duplicate fetches: the mount effect re-runs on re-renders (e.g. the
  // setLoading(true) below) before the async state flip lands, so two
  // concurrent getGreeting() calls would race and the slower response
  // would overwrite the greeting already on screen.
  const greetingRequestedRef = useRef(false);

  /**
   * Initialize a new session and get greeting message.
   * Idempotent — only the first call does work.
   */
  const initializeSession = useCallback(async () => {
    if (greetingRequestedRef.current) return;
    greetingRequestedRef.current = true;

    try {
      setLoading(true);

      // Generate new session
      await SessionManager.generateNewSession();

      // Get greeting message
      const response = await sessionApiService.getGreeting();

      if (response.success && response.data?.greeting_message) {
        // Resume the prior conversation thread when the server hands one
        // back, so the first /chat message continues where the user left
        // off. When there is no prior context, clear any stale stored id so
        // a fresh conversation is created cleanly.
        if (response.data.conversation_id) {
          await SessionManager.setConversationId(response.data.conversation_id);
        } else {
          await SessionManager.clearConversation();
        }

        const greetingText = toFirstNameOnly(
          response.data.greeting_message,
          user?.fullName,
        );
        const greetingMessage = createMessage(greetingText, 'system');
        setMessages([greetingMessage]);
        setGreetingLoaded(true);
      } else {
        // Fallback greeting
        const fallbackMessage = createMessage(
          '🌜 The Mirror reflects…',
          'system',
        );
        setMessages([fallbackMessage]);
        setGreetingLoaded(true);
      }
    } catch (error) {
      console.error('Session initialization error:', error);
      // Fallback greeting
      const fallbackMessage = createMessage(
        '🌜 The Mirror reflects…',
        'system',
      );
      setMessages([fallbackMessage]);
      setGreetingLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [user?.fullName]);

  /** Push a system message into the thread — how this surface talks to users. */
  const pushSystemMessage = useCallback((text: string) => {
    setMessages(msgs => [...msgs, createMessage(text, 'system')]);
  }, []);

  /**
   * Transcribe a finished recording into the draft.
   *
   * D1: the transcript becomes the message, but the user reads and edits it
   * first — this never auto-sends. Appends rather than replaces, because they
   * may have typed something before deciding to speak.
   */
  const transcribeRecording = useCallback(
    async (uri: string) => {
      setTranscribing(true);
      try {
        let data_base64: string;
        try {
          data_base64 = await readPhotoAsBase64(uri);
        } catch {
          pushSystemMessage(
            "Couldn't read that recording. Try speaking again.",
          );
          return;
        }

        const response = await transcribeApiService.transcribe({
          mime_type: CHAT_AUDIO_CONTENT_TYPE,
          data_base64,
        });

        if (!response.success) {
          pushSystemMessage(getApiErrorMessage(response, t));
          return;
        }

        const text = (response.data?.text ?? '').trim();
        if (!text) {
          // Silence is a legitimate outcome, not an error — say so plainly
          // rather than leaving the user staring at an unchanged input.
          pushSystemMessage("The Mirror didn't catch that. Try again?");
          return;
        }

        setDraft(previous =>
          previous.trim() ? `${previous.trim()} ${text}` : text,
        );
      } catch (error) {
        pushSystemMessage(getApiErrorMessage(error, t));
      } finally {
        setTranscribing(false);
      }
    },
    [pushSystemMessage, t],
  );

  // The 120s cap stops the recording on the user's behalf; carry on exactly
  // as if they had tapped stop, so the speech isn't silently discarded.
  const recorder = useAudioRecorder({
    onAutoStop: uri => {
      void transcribeRecording(uri);
    },
  });

  // Surface a recorder failure (denied mic, hijacked audio session) in the
  // thread. Keyed on the message so the same error isn't repeated on every
  // re-render.
  const reportedRecorderErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (recorder.error && recorder.error !== reportedRecorderErrorRef.current) {
      reportedRecorderErrorRef.current = recorder.error;
      pushSystemMessage(recorder.error);
    }
  }, [recorder.error, pushSystemMessage]);

  const startRecording = useCallback(async () => {
    reportedRecorderErrorRef.current = null;
    await recorder.start();
  }, [recorder]);

  /** Stop, then transcribe into the draft. */
  const stopAndTranscribe = useCallback(async () => {
    const uri = await recorder.stop();
    if (!uri) return;
    await transcribeRecording(uri);
  }, [recorder, transcribeRecording]);

  const cancelRecording = useCallback(async () => {
    await recorder.cancel();
  }, [recorder]);

  /**
   * Stage a picked photo: normalize + compress it now, so send stays fast.
   *
   * Failures surface as a system message in the thread rather than an Alert —
   * the chat surface already speaks to the user that way, and the message
   * ("too large", "unsupported type") is actionable.
   */
  const stagePickedAsset = useCallback(
    async (asset: {
      uri?: string;
      type?: string | null;
      fileName?: string | null;
    }) => {
      if (!asset?.uri) return;
      try {
        setPreparing(true);
        const result = await prepareChatPhoto({
          uri: asset.uri,
          mimeType: asset.type,
          fileName: asset.fileName,
        });
        setPrepared(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not use that photo. Try another one.';
        setMessages(msgs => [...msgs, createMessage(message, 'system')]);
      } finally {
        setPreparing(false);
      }
    },
    [],
  );

  /**
   * Pick from the camera roll.
   *
   * No explicit permission request: `launchImageLibrary` goes through the
   * system picker, which carries its own implicit grant on both platforms.
   * Asking would add a prompt the user should never see.
   */
  const pickPhotoFromLibrary = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      assetRepresentationMode: 'current',
      includeExtra: false,
    });
    if (result?.didCancel) return;
    await stagePickedAsset(result?.assets?.[0] ?? {});
  }, [stagePickedAsset]);

  /** Take a new photo. Unlike the library, this DOES need permission. */
  const takePhoto = useCallback(async () => {
    const granted = await ensureCameraPermission();
    if (!granted) return;

    const result = await launchCamera({
      mediaType: 'photo',
      saveToPhotos: false,
      includeExtra: false,
    });
    if (result?.didCancel) return;
    await stagePickedAsset(result?.assets?.[0] ?? {});
  }, [stagePickedAsset]);

  /** Discard the staged photo. */
  const removeAttachment = useCallback(() => setPrepared(null), []);

  /**
   * Send a message to the chat API using MirrorGPT format
   */
  const sendMessage = async () => {
    const text = draft.trim();
    // A photo with no caption is a valid turn, so emptiness alone no longer
    // blocks the send — but nothing at all still does.
    if (!text && !prepared) return;

    // Read the photo's bytes now rather than at pick time, so a staged-but-
    // never-sent photo doesn't sit in JS memory as a ~400KB string.
    let requestAttachments;
    if (prepared) {
      try {
        const data_base64 = await readPhotoAsBase64(prepared.localUri);
        requestAttachments = [
          { kind: 'image' as const, mime_type: prepared.mimeType, data_base64 },
        ];
      } catch (error) {
        // Keep the photo staged so the user can retry without re-picking.
        const message =
          error instanceof Error
            ? error.message
            : 'Could not read that photo. Try picking it again.';
        setMessages(msgs => [...msgs, createMessage(message, 'system')]);
        return;
      }
    }

    const sentAttachments: ChatAttachment[] | undefined = prepared
      ? [
          {
            kind: 'image',
            localUri: prepared.localUri,
            mimeType: prepared.mimeType,
          },
        ]
      : undefined;

    // 1) Create and add user message optimistically
    const userMessage = createMessage(text, 'user', sentAttachments);
    setMessages(msgs => [...msgs, userMessage]);
    setDraft('');
    setLoading(true);

    try {
      // 2) Get current session and conversation IDs
      const sessionId = await SessionManager.getCurrentSessionId();
      const conversationId = await SessionManager.getConversationId();

      // Ensure we have a session ID
      if (!sessionId) {
        console.error('No session ID available');
        const errorMessage = createMessage(
          t('apiErrors.SessionError'),
          'system',
        );
        setMessages(msgs => [...msgs, errorMessage]);
        return;
      }

      // 3) Send message to API
      const response = await chatApiService.sendMessage({
        message: text,
        session_id: sessionId,
        conversation_id: conversationId,
        include_archetype_analysis: true,
        use_enhanced_response: true,
        // Omitted entirely for a text-only turn — sending [] would be a
        // needless schema edge for the backend to special-case.
        ...(requestAttachments ? { attachments: requestAttachments } : {}),
      });

      // 4) Handle API response
      if (response.success && response.data) {
        const chatResponse = response.data;

        // Store conversation_id from first response if not set
        if (chatResponse.session_metadata?.conversation_id && !conversationId) {
          await SessionManager.setConversationId(
            chatResponse.session_metadata.conversation_id,
          );
        }

        // The turn landed — drop the staged photo. Deliberately NOT in a
        // finally block: on failure we keep it staged so the user can retry
        // without re-picking.
        setPrepared(null);

        // Create system message with main response
        const systemMessage = createMessage(
          toFirstNameOnly(chatResponse.response, user?.fullName),
          'system',
        );
        setMessages(msgs => [...msgs, systemMessage]);

        // Add archetype analysis if available
        if (chatResponse.archetype_analysis?.signal_3_archetype_blend) {
          const archetype =
            chatResponse.archetype_analysis.signal_3_archetype_blend;
          const archetypeText = `🔮 Archetype Insights: ${
            archetype.primary
          } (${Math.round(archetype.confidence * 100)}%)${
            archetype.secondary ? `, ${archetype.secondary}` : ''
          }`;
          const archetypeMessage = createMessage(archetypeText, 'system');
          setMessages(msgs => [...msgs, archetypeMessage]);
        }

        // Add suggested practice if available
        if (chatResponse.suggested_practice) {
          const practiceMessage = createMessage(
            `✨ Suggested Practice: ${chatResponse.suggested_practice}`,
            'system',
          );
          setMessages(msgs => [...msgs, practiceMessage]);
        }
      } else {
        // Handle API error response
        const errorMessage = createMessage(
          getApiErrorMessage(response, t),
          'system',
        );
        setMessages(msgs => [...msgs, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Handle network/unexpected errors
      const errorMessage = createMessage(
        getApiErrorMessage(error, t),
        'system',
      );
      setMessages(msgs => [...msgs, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Scroll to the bottom of the chat
   */
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  /**
   * Clear the draft message
   */
  const clearDraft = () => {
    setDraft('');
  };

  /**
   * Clear all messages (if needed for future functionality)
   */
  const clearMessages = () => {
    setMessages([createMessage('The Mirror reflects…', 'system')]);
  };

  return {
    // State
    messages,
    draft,
    loading,
    greetingLoaded,
    scrollViewRef,
    /** Staged photo(s) for the next send. V1: at most one. */
    attachments: prepared
      ? [
          {
            kind: 'image' as const,
            localUri: prepared.localUri,
            mimeType: prepared.mimeType,
          },
        ]
      : [],
    /** True while a picked photo is being converted/compressed. */
    preparing,
    /** True while a finished recording is being transcribed. */
    transcribing,
    isRecording: recorder.isRecording,
    recordingMs: recorder.elapsedMs,

    // Actions
    initializeSession,
    sendMessage,
    setDraft,
    scrollToBottom,
    clearDraft,
    clearMessages,
    pickPhotoFromLibrary,
    takePhoto,
    removeAttachment,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
  };
};
