/**
 * Mic affordance on ChatInput (Phase 5).
 *
 * The mic REPLACES the send button while the draft is empty (the iMessage
 * pattern) rather than becoming a fourth child — the row is already tight at
 * MAX_LINES.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ChatInput } from './ChatInput';

const noop = () => {};
const baseProps = { value: '', onChangeText: noop, onSend: noop };

describe('the mic button', () => {
  it('shows the mic instead of send when the draft is empty', () => {
    const { getByTestId, queryByTestId } = render(
      <ChatInput {...baseProps} value="" onStartRecording={noop} />,
    );

    expect(getByTestId('chat-mic-button')).toBeTruthy();
    expect(queryByTestId('send-button')).toBeNull();
  });

  it('shows send instead of the mic once there is text', () => {
    const { getByTestId, queryByTestId } = render(
      <ChatInput {...baseProps} value="hello" onStartRecording={noop} />,
    );

    expect(getByTestId('send-button')).toBeTruthy();
    expect(queryByTestId('chat-mic-button')).toBeNull();
  });

  it('shows send when a photo is staged even with no text', () => {
    // A staged photo is a sendable turn, so send must win over the mic.
    const { getByTestId, queryByTestId } = render(
      <ChatInput
        {...baseProps}
        value=""
        onStartRecording={noop}
        attachments={[
          { kind: 'image', localUri: 'file:///p.jpg', mimeType: 'image/jpeg' },
        ]}
      />,
    );

    expect(getByTestId('send-button')).toBeTruthy();
    expect(queryByTestId('chat-mic-button')).toBeNull();
  });

  it('does not render the mic when voice is not wired (flag off)', () => {
    const { queryByTestId, getByTestId } = render(
      <ChatInput {...baseProps} value="" />,
    );

    expect(queryByTestId('chat-mic-button')).toBeNull();
    // Send stays, so the input is not left with no action button at all.
    expect(getByTestId('send-button')).toBeTruthy();
  });

  it('starts recording when pressed', () => {
    const onStartRecording = jest.fn();
    const { getByTestId } = render(
      <ChatInput {...baseProps} onStartRecording={onStartRecording} />,
    );

    fireEvent.press(getByTestId('chat-mic-button'));

    expect(onStartRecording).toHaveBeenCalledTimes(1);
  });

  it('is labelled for screen readers', () => {
    const { getByTestId } = render(
      <ChatInput {...baseProps} onStartRecording={noop} />,
    );

    expect(getByTestId('chat-mic-button').props.accessibilityLabel).toBeTruthy();
  });
});

describe('while recording', () => {
  const recordingProps = {
    ...baseProps,
    onStartRecording: noop,
    isRecording: true,
    recordingMs: 65_000,
  };

  it('replaces the input row with a recording bar', () => {
    const { getByTestId, queryByPlaceholderText } = render(
      <ChatInput {...recordingProps} />,
    );

    expect(getByTestId('chat-recording-bar')).toBeTruthy();
    expect(queryByPlaceholderText('Ask me anything...')).toBeNull();
  });

  it('shows the elapsed time as m:ss', () => {
    const { getByText } = render(<ChatInput {...recordingProps} />);

    expect(getByText('1:05')).toBeTruthy();
  });

  it('offers stop and cancel', () => {
    const onStop = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <ChatInput
        {...recordingProps}
        onStopRecording={onStop}
        onCancelRecording={onCancel}
      />,
    );

    fireEvent.press(getByTestId('chat-recording-stop'));
    fireEvent.press(getByTestId('chat-recording-cancel'));

    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('warns as the 120s cap approaches', () => {
    // The recording will be auto-stopped, so the user should see it coming
    // rather than being cut off without warning.
    const { getByTestId } = render(
      <ChatInput {...recordingProps} recordingMs={110_000} />,
    );

    expect(getByTestId('chat-recording-nearly-full')).toBeTruthy();
  });

  it('does not warn early in the recording', () => {
    const { queryByTestId } = render(
      <ChatInput {...recordingProps} recordingMs={10_000} />,
    );

    expect(queryByTestId('chat-recording-nearly-full')).toBeNull();
  });
});

describe('while transcribing', () => {
  it('shows a transcribing indicator', () => {
    const { getByTestId } = render(
      <ChatInput {...baseProps} onStartRecording={noop} transcribing />,
    );

    expect(getByTestId('chat-transcribing')).toBeTruthy();
  });

  it('disables send while transcribing', () => {
    // The transcript is about to land in the draft; sending now would send
    // the pre-transcript text and discard what they said.
    const { getByTestId } = render(
      <ChatInput {...baseProps} value="typed" transcribing />,
    );

    expect(getByTestId('send-button').props.disabled).toBe(true);
  });

  it('hides the mic while transcribing', () => {
    const { queryByTestId } = render(
      <ChatInput {...baseProps} onStartRecording={noop} transcribing />,
    );

    expect(queryByTestId('chat-mic-button')).toBeNull();
  });
});
