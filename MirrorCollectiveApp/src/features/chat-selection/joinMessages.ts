/**
 * Join selected chat messages into one block of text.
 *
 * Feeds both selection-bar actions: Copy (clipboard) and Save to Echo, which
 * hands the result to the create-Echo flow as its existing single
 * `prefillContent` string — so nothing below MirrorChatScreen changes.
 */

import type { Message } from '@types';

/** Shown before each message when several are selected. */
const SPEAKER_LABEL: Record<Message['sender'], string> = {
  user: 'Me',
  system: 'Mirror',
};

/**
 * Blank line between messages. A single newline reads as one run-on message
 * once the text lands in an Echo.
 */
const SEPARATOR = '\n\n';

/**
 * @param messages   The conversation, already in chronological order.
 * @param selectedIds Which messages to include. Insertion order is ignored.
 *
 * Order is taken from `messages`, never from `selectedIds` or from
 * `Message.timestamp` — the timestamp is optional, so sorting by it would
 * silently misorder any message lacking one, and the array is already
 * chronological.
 *
 * Attribution appears only when more than one message survives: copying a
 * single message should yield exactly its text, which is what "copy" implies.
 * A transcript of several needs labels, or whoever receives the Echo cannot
 * tell which half was them.
 */
export function joinMessages(
  messages: readonly Message[],
  selectedIds: ReadonlySet<string>,
): string {
  if (selectedIds.size === 0) return '';

  const chosen = messages
    .filter(m => selectedIds.has(m.id))
    // A photo-only turn carries no text; a bare "Me:" line is noise.
    .map(m => ({ sender: m.sender, text: (m.text ?? '').trim() }))
    .filter(m => m.text.length > 0);

  if (chosen.length === 0) return '';
  if (chosen.length === 1) return chosen[0].text;

  return chosen
    .map(m => `${SPEAKER_LABEL[m.sender]}: ${m.text}`)
    .join(SEPARATOR);
}
