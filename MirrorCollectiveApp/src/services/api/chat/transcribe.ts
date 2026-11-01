import { API_CONFIG } from '@constants/config';
import type { ApiResponse } from '@types';


import { BaseApiService } from '../base';
import { ApiErrorHandler } from '../errorHandler';

/**
 * Per-route timeout for speech-to-text.
 *
 * Longer than the 10s `API_CONFIG.TIMEOUT` default, because transcribing a
 * 120s recording legitimately takes longer than generating a chat reply —
 * the request uploads the audio and then waits on Whisper.
 *
 * Capped at the real server ceiling rather than above it: the api Lambda is
 * configured `timeout: 30` and API Gateway caps its integration there, so a
 * longer client timeout would just leave the user watching a spinner after
 * the gateway had already 504'd. The backend's own OpenAI client is set to
 * 25s for the same reason.
 */
const TRANSCRIBE_TIMEOUT_MS = 30_000;

export interface TranscribeRequest {
  mime_type: string;
  /** Base64 of the recording. Never stored server-side — see D1/D7. */
  data_base64: string;
}

export interface TranscribeResponseData {
  /**
   * May be empty: silence is a legitimate outcome. Callers should show
   * "we didn't catch that" rather than treating it as an error.
   */
  text: string;
  /** Audio length as reported by the model, when it reports one. */
  duration_ms?: number | null;
}

export class TranscribeApiService extends BaseApiService {
  /** Transcribe a recording to text. The audio is discarded server-side. */
  async transcribe(
    request: TranscribeRequest,
  ): Promise<ApiResponse<TranscribeResponseData>> {
    const response = await this.makeRequest<TranscribeResponseData>(
      API_CONFIG.ENDPOINTS.MIRRORGPT.TRANSCRIBE,
      'POST',
      request,
      true, // Bearer token
      undefined,
      { timeoutMs: TRANSCRIBE_TIMEOUT_MS },
    );

    return ApiErrorHandler.handleApiResponse<TranscribeResponseData>(
      response,
      'Transcribed successfully',
      'TranscriptionError',
    );
  }
}

export const transcribeApiService = new TranscribeApiService();
