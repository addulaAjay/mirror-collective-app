/**
 * A photo staged on, or sent with, a chat message.
 *
 * Deliberately NOT Echo Vault's `Attachment` type (src/services/api/echo.ts):
 * that one is built around `media_url` / `thumb_url` / `attachment_id`, none
 * of which exist here. Chat media is never uploaded or stored
 * (docs/CHAT_MEDIA_V1_PLAN.md D7), so a chat attachment is a local file plus
 * a MIME type and nothing else.
 */
export interface ChatAttachment {
  kind: 'image';
  /** Local file URI. Valid for this screen visit only — nothing is stored. */
  localUri: string;
  mimeType: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp?: Date;
  /** Present on a user turn that carried a photo. */
  attachments?: ChatAttachment[];
}

// ChatRequest and ChatResponse are now defined in api.ts
// Keeping only the Message interface here for UI components
