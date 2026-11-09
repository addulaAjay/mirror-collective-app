/**
 * Joining selected chat messages into one block of text.
 *
 * Feeds both actions on the selection bar: Copy (to the clipboard) and Save to
 * Echo (into the create-Echo flow, which already accepts a single
 * `prefillContent` string).
 *
 * Two decisions are load-bearing here:
 *
 * 1. **Order comes from the messages array, not timestamps.** `Message.timestamp`
 *    is optional, so sorting by it would silently misorder anything missing one.
 *    The array is already chronological, so position is the reliable signal —
 *    and it means tap order cannot affect the result.
 *
 * 2. **Attribution appears only when more than one message is selected.**
 *    Copying a single message should give exactly that message's text, which is
 *    what anyone expects from "copy". A transcript of several needs labels or
 *    the recipient of an Echo cannot tell who said what.
 */

import type { Message } from '@types';

import { joinMessages } from './joinMessages';

/** A photo-only turn: the attachment carries no caption text. */
const PHOTO_ATTACHMENTS: Message['attachments'] = [
  { kind: 'image', localUri: 'file:///x.jpg', mimeType: 'image/jpeg' },
];

const msg = (
  id: string,
  sender: 'user' | 'system',
  text: string,
  extra: Partial<Message> = {},
): Message => ({ id, sender, text, ...extra }) as Message;

const CONVERSATION: Message[] = [
  msg('1', 'user', 'I keep putting off the conversation'),
  msg('2', 'system', "You're avoiding the discomfort, not the decision."),
  msg('3', 'user', 'That lands'),
  msg('4', 'system', 'What would you say if it cost you nothing?'),
];

describe('joinMessages', () => {
  it('returns an empty string when nothing is selected', () => {
    expect(joinMessages(CONVERSATION, new Set())).toBe('');
  });

  it('returns bare text for a single selection, with no label', () => {
    // "Copy" on one message should yield that message, nothing more.
    expect(joinMessages(CONVERSATION, new Set(['2']))).toBe(
      "You're avoiding the discomfort, not the decision.",
    );
  });

  it('labels each speaker once more than one is selected', () => {
    const out = joinMessages(CONVERSATION, new Set(['1', '2']));

    expect(out).toContain('Me: I keep putting off the conversation');
    expect(out).toContain("Mirror: You're avoiding the discomfort");
  });

  it('orders by position in the conversation, not by tap order', () => {
    // The Set is built as the user taps; insertion order must not leak through.
    const tappedLast = new Set(['4', '1']);

    const out = joinMessages(CONVERSATION, tappedLast);

    expect(out.indexOf('I keep putting off')).toBeLessThan(
      out.indexOf('What would you say'),
    );
  });

  it('handles an arbitrary non-contiguous selection', () => {
    const out = joinMessages(CONVERSATION, new Set(['1', '4']));
    const lines = out.split('\n\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Me: I keep putting off the conversation');
    expect(lines[1]).toBe('Mirror: What would you say if it cost you nothing?');
  });

  it('ignores ids that are not in the conversation', () => {
    // Defensive: a message could be removed while selection is open.
    expect(joinMessages(CONVERSATION, new Set(['1', 'ghost']))).toBe(
      'I keep putting off the conversation',
    );
  });

  it('separates messages with a blank line', () => {
    const out = joinMessages(CONVERSATION, new Set(['1', '2']));

    expect(out.split('\n\n')).toHaveLength(2);
  });

  it('skips a message with no text rather than emitting a bare label', () => {
    // A photo-only turn carries no text; "Me:" on its own is noise.
    const withPhoto = [
      msg('p', 'user', '', { attachments: PHOTO_ATTACHMENTS }),
      msg('q', 'system', 'I see it.'),
    ];

    expect(joinMessages(withPhoto, new Set(['p', 'q']))).toBe('I see it.');
  });

  it('trims surrounding whitespace on each message', () => {
    const padded = [
      msg('a', 'user', '  leading and trailing  '),
      msg('b', 'system', 'reply'),
    ];

    expect(joinMessages(padded, new Set(['a', 'b']))).toBe(
      'Me: leading and trailing\n\nMirror: reply',
    );
  });

  it('returns empty when every selected message is textless', () => {
    const photoOnly = [msg('p', 'user', '', { attachments: PHOTO_ATTACHMENTS })];

    expect(joinMessages(photoOnly, new Set(['p']))).toBe('');
  });

  it('does not mutate the messages array', () => {
    const before = [...CONVERSATION];

    joinMessages(CONVERSATION, new Set(['3', '1']));

    expect(CONVERSATION).toEqual(before);
  });
});
