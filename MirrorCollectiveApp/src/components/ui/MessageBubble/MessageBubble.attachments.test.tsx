/**
 * Image rendering in a chat bubble (Phase 3).
 *
 * The photo renders from the LOCAL file uri — nothing is uploaded or stored
 * (docs/CHAT_MEDIA_V1_PLAN.md D7), so there is no remote url to fall back to
 * and no "expired media" state to handle.
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import type { Message } from '@types';

import { MessageBubble } from './MessageBubble';

const withPhoto = (overrides: Partial<Message> = {}): Message => ({
  id: 'm1',
  text: 'what do you see?',
  sender: 'user',
  attachments: [
    { kind: 'image', localUri: 'file:///tmp/photo.jpg', mimeType: 'image/jpeg' },
  ],
  ...overrides,
});

describe('MessageBubble with an attachment', () => {
  it('renders the photo', () => {
    const { getByTestId } = render(<MessageBubble message={withPhoto()} />);

    expect(getByTestId('message-image-m1')).toBeTruthy();
  });

  it('renders the photo from its local uri', () => {
    const { getByTestId } = render(<MessageBubble message={withPhoto()} />);

    expect(getByTestId('message-image-m1').props.source).toEqual({
      uri: 'file:///tmp/photo.jpg',
    });
  });

  it('still renders the caption alongside the photo', () => {
    const { getByText } = render(<MessageBubble message={withPhoto()} />);

    expect(getByText('what do you see?')).toBeTruthy();
  });

  it('renders a photo with no caption without an empty text node', () => {
    const { getByTestId, queryByText } = render(
      <MessageBubble message={withPhoto({ text: '' })} />,
    );

    expect(getByTestId('message-image-m1')).toBeTruthy();
    expect(queryByText('')).toBeNull();
  });

  it('renders no image for a message without attachments', () => {
    const { queryByTestId } = render(
      <MessageBubble message={withPhoto({ attachments: undefined })} />,
    );

    expect(queryByTestId('message-image-m1')).toBeNull();
  });

  it('gives the image an accessibility label', () => {
    const { getByTestId } = render(<MessageBubble message={withPhoto()} />);

    expect(getByTestId('message-image-m1').props.accessibilityLabel).toBeTruthy();
  });

  it('leaves system messages unchanged', () => {
    const { getByText } = render(
      <MessageBubble
        message={{ id: 's1', text: 'A still surface.', sender: 'system' }}
      />,
    );

    expect(getByText('A still surface.')).toBeTruthy();
  });
});
