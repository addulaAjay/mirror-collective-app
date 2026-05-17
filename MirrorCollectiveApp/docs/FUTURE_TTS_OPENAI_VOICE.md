# Future: TTS via OpenAI voice API

> **Status:** planned. The chat read-aloud feature shipped on-device
> first (react-native-tts → iOS AVSpeechSynthesizer / Android
> TextToSpeech) and is currently flagged OFF in
> `src/services/speech/featureFlag.ts`. This doc captures why we're
> swapping engines and what the migration looks like.

## Why move off the OS TTS engine

Two reasons surfaced during the first hands-on session with the
on-device implementation:

1. **Voice quality.** `react-native-tts` wraps `AVSpeechSynthesizer`,
   which is the same engine that drives VoiceOver. The cadence,
   intonation, and timbre read as "screen reader." That mismatches
   the Mirror Collective brand voice — we want something warm and
   reflective, not assistive-tech neutral.
2. **No control over voice identity.** The OS picks the voice based on
   the user's iOS Accessibility settings. We can enumerate voices via
   `Tts.voices()` and pick one, but the choices are still
   AVSpeechSynthesizer voices. There's no path to a Mirror-specific
   voice short of a third-party engine.

Separately, two implementation bugs were observed but are independent
of engine choice — they'd recur with any TTS lib and must be fixed
either way (see "Bugs to fix during the migration" below).

## Target engine: OpenAI `/v1/audio/speech`

OpenAI ships a text-to-speech API as part of the Audio family:

- **Endpoint:** `POST https://api.openai.com/v1/audio/speech`
- **Models:** `tts-1` (low latency), `tts-1-hd` (higher fidelity, ~2×
  slower and 2× cost), and the newer `gpt-4o-mini-tts` variants which
  expose prosody control.
- **Voices:** `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
  (six built-in; more under the gpt-4o-mini family).
- **Output formats:** `mp3` (default), `opus`, `aac`, `flac`, `wav`,
  `pcm`. Use `opus` for streaming on mobile — lower latency and
  smaller payloads than mp3.
- **Streaming:** the endpoint supports HTTP chunked transfer; the
  client can start playing as bytes arrive instead of waiting for the
  full file.

### Cost

| Model | Per 1M input chars | A 1.5-min reply (~250 chars) |
|---|---|---|
| `tts-1` | $15 | ~$0.0038 |
| `tts-1-hd` | $30 | ~$0.0075 |
| `gpt-4o-mini-tts` | $12 | ~$0.003 |

At 50 daily-active users averaging 10 spoken replies/day → ~150k
chars/day → **<$3/month at `tts-1`**. Order-of-magnitude affordable;
caching (below) drops it further.

## Architecture

```
RN client                         Backend (Lambda)              OpenAI
─────────                         ────────────────              ──────
ttsService.speak(text, id)
  │
  ├─→ POST /api/tts/speech   ───→ verify auth + quota
  │                               │
  │                               ├─→ check S3 cache (sha256(text+voice))
  │                               │     hit  → 200 audio/mpeg (S3 stream)
  │                               │     miss → ↓
  │                               │
  │                               └─→ POST openai.com/v1/audio/speech
  │                                     stream chunks back to client
  │                                     AND write to S3 cache async
  │
  └← audio chunks → AudioBuffer → play via expo-av / react-native-track-player
```

### Why proxy through the backend

1. **API key safety.** The OpenAI key can't ship in the iOS bundle.
   The backend already proxies `/v1/chat/completions` for the same
   reason.
2. **Caching.** Hash `(text, voice, model)` → S3 object. Mirror replies
   are short and highly repetitive across users (same greeting,
   archetype names, practice copy), so cache-hit rate should be
   excellent. Cache key derives from content only, so different users
   share the same cached audio.
3. **Quota enforcement.** Tie spoken-reply counts into the existing
   subscription quota system. Free tier could cap daily spoken-reply
   characters; paid tiers uncapped.
4. **Engine swap.** If we later want to A/B against ElevenLabs or a
   self-hosted Whisper-style model, the client URL doesn't change.

### Client-side: react-native-track-player vs expo-av

Both can play streamed audio. Recommend **`react-native-track-player`**
for this project — it already has a community of users on RN 0.80
without Expo modules autolinking (vs `expo-av` which we don't currently
have wired). Its progress events also make pause/resume natural.

If we end up wiring full Expo modules autolinking later for other
reasons, swap to `expo-av` — first-party, fewer native deps.

## Implementation outline

### Backend (Python FastAPI)

Add a new route `POST /api/tts/speech`:

```python
@router.post("/api/tts/speech")
async def synthesize_speech(
    payload: TtsRequest,
    current_user: dict = Depends(get_current_user),
):
    # 1. Compute cache key
    cache_key = sha256(f"{payload.text}|{payload.voice}|{payload.model}").hexdigest()
    s3_key = f"tts-cache/{cache_key}.mp3"

    # 2. Try cache hit — stream from S3
    if await s3_object_exists(BUCKET, s3_key):
        return StreamingResponse(
            s3_get_object_stream(BUCKET, s3_key),
            media_type="audio/mpeg",
        )

    # 3. Miss — proxy to OpenAI, tee to S3 + client
    async with openai_client.audio.speech.with_streaming_response.create(
        model=payload.model or "tts-1",
        voice=payload.voice or "shimmer",
        input=payload.text,
        response_format="mp3",
    ) as upstream:
        return StreamingResponse(
            tee_to_s3_and_yield(upstream.iter_bytes(), BUCKET, s3_key),
            media_type="audio/mpeg",
        )
```

Quota check + idempotency wrapping are standard middleware reuse.

### Client (React Native)

Update `ttsService.ts` to call the backend instead of `Tts.speak`:

```ts
async speak(text: string, utteranceId: string): Promise<void> {
  if (this.activeUtteranceId) this.stop();
  this.activeUtteranceId = utteranceId;
  try {
    const url = await fetch(`${API_BASE}/api/tts/speech`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ text, voice: 'shimmer' }),
    });
    await audioPlayer.play(url.url);
  } catch (err) {
    console.warn('[tts] speak failed', err);
    this.activeUtteranceId = null;
  }
}
```

The subscriber channel (`useTtsActiveId`, `useAutoReadOnNewMessage`)
and the preference hook (`useAutoReadPreference`) are engine-agnostic
and survive the swap unchanged.

## Bugs to fix during the migration

These were observed with the on-device implementation but apply to any
engine. Fix them in the same PR that swaps the engine.

### 1. Stop on screen blur, not just unmount

`useAutoReadOnNewMessage`'s cleanup `useEffect` calls `ttsService.stop()`
on unmount. In our stack navigator the MirrorChatScreen stays mounted
when the user pushes a detail screen, so a long reply keeps speaking
from behind. Fix:

```ts
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  React.useCallback(() => {
    return () => { ttsService.stop(); };
  }, []),
);
```

`useFocusEffect`'s cleanup fires on blur (push to detail) and on
unmount (pop the screen). Both stop the audio.

### 2. Stop on send

When the user starts typing or sends a new message, the previous
reply's audio should stop. Wire `ttsService.stop()` into the
`sendMessage` flow in `useChat`.

### 3. Mute when device silent switch is on (optional)

`AVSpeechSynthesizer` respects the silent switch by default; OpenAI
audio played via track-player does NOT. Decide whether to honor the
silent switch (probably yes, but worth a product call) and configure
the audio session category accordingly. `expo-av`'s
`Audio.setAudioModeAsync({ playsInSilentModeIOS: false })` is the toggle.

## Migration checklist

- [ ] Backend: ship `POST /api/tts/speech` with S3 caching + quota
- [ ] Backend: env var `OPENAI_TTS_BUCKET`, IAM grant for the bucket
- [ ] Client: install audio player (`react-native-track-player` or
      `expo-av` if Expo modules are already wired)
- [ ] Client: rewrite `ttsService.speak()` to call the backend
- [ ] Client: implement bugs-to-fix items 1–3 above
- [ ] Flip `TTS_FEATURE_ENABLED` to `true` in `featureFlag.ts`
- [ ] Un-`.skip` the speaker-button tests in MessageBubble.test.tsx
- [ ] Manual: confirm voice quality > on-device TTS (subjective gate)
- [ ] Manual: confirm stop-on-blur works in chat → detail nav
