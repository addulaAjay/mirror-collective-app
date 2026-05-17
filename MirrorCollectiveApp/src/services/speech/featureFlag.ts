/**
 * Build-time feature flag for the chat read-aloud feature.
 *
 * Set to `false` while the on-device TTS implementation is hidden from
 * users. Two issues drove the decision:
 *
 *   1. Voice quality — react-native-tts wraps iOS AVSpeechSynthesizer,
 *      which is the same engine VoiceOver uses for accessibility. The
 *      cadence and intonation read as "screen-reader," not as a voice
 *      companion, which mismatches the Mirror Collective brand.
 *
 *   2. Stop-on-leave — useAutoReadOnNewMessage stops speech on the
 *      chat screen's unmount, but in our stack navigator the screen
 *      stays mounted when the user pushes to a detail view, so a
 *      long reply keeps speaking from behind. Needs to switch to
 *      useFocusEffect / useIsFocused to stop on blur.
 *
 * The underlying service layer (ttsService, useAutoReadPreference,
 * useAutoReadOnNewMessage) stays intact behind this flag so the
 * upcoming OpenAI-voice migration (see docs/FUTURE_TTS_OPENAI_VOICE.md)
 * can swap engines without re-wiring the UI.
 *
 * Flip to `true` after the engine swap + the focus-effect fix land.
 */
export const TTS_FEATURE_ENABLED = false;
