/**
 * Attachment affordances on ChatInput (Phase 3).
 *
 * Separate file from ChatInput.test.tsx so that suite — which pins the
 * `editable`-stays-true keyboard regression among other things — stays
 * readable and undisturbed.
 */

import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { ChatAttachment } from '@types';

import { ChatInput } from './ChatInput';

const AN_ATTACHMENT: ChatAttachment = {
  kind: 'image',
  localUri: 'file:///tmp/photo.jpg',
  mimeType: 'image/jpeg',
};

const noop = () => {};

const baseProps = {
  value: '',
  onChangeText: noop,
  onSend: noop,
};

describe('the attach button', () => {
  // Two quirks of the shared RN mock shape these tests:
  //
  // 1. `Modal` renders as a plain string component, so its children are in
  //    the tree regardless of `visible`. Open/closed is therefore asserted
  //    on the Modal's `visible` prop, not by querying for its children.
  // 2. The iOS `onDismiss` path cannot fire under that mock, so what these
  //    exercise is the Android timeout fallback. The iOS path needs device
  //    QA — see the note on runPendingChoice.
  const isSheetOpen = (getByTestId: (id: string) => { props: { visible?: boolean } }) =>
    getByTestId('chat-attachment-modal').props.visible;

  it('opens the attachment sheet instead of picking a document directly', () => {
    const { getByTestId } = render(
      <ChatInput {...baseProps} onPickPhoto={noop} />,
    );

    expect(isSheetOpen(getByTestId)).toBe(false);

    fireEvent.press(getByTestId('chat-attach-button'));

    expect(isSheetOpen(getByTestId)).toBe(true);
  });

  it('offers photo library, camera and file options', () => {
    const { getByTestId } = render(
      <ChatInput {...baseProps} onPickPhoto={noop} onTakePhoto={noop} />,
    );

    fireEvent.press(getByTestId('chat-attach-button'));

    expect(getByTestId('chat-attach-library')).toBeTruthy();
    expect(getByTestId('chat-attach-camera')).toBeTruthy();
    // The pre-existing document→text behaviour is preserved as a sheet
    // option rather than removed.
    expect(getByTestId('chat-attach-file')).toBeTruthy();
  });

  it('does not launch the picker until the sheet has closed', () => {
    // The whole point of the deferral: launching a picker while the sheet is
    // still dismissing fails on iOS.
    jest.useFakeTimers();
    const onPickPhoto = jest.fn();
    const { getByTestId } = render(
      <ChatInput {...baseProps} onPickPhoto={onPickPhoto} />,
    );

    fireEvent.press(getByTestId('chat-attach-button'));
    fireEvent.press(getByTestId('chat-attach-library'));

    expect(onPickPhoto).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('calls onPickPhoto once the sheet has dismissed', () => {
    jest.useFakeTimers();
    const onPickPhoto = jest.fn();
    const { getByTestId } = render(
      <ChatInput {...baseProps} onPickPhoto={onPickPhoto} />,
    );

    fireEvent.press(getByTestId('chat-attach-button'));
    fireEvent.press(getByTestId('chat-attach-library'));
    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(onPickPhoto).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('calls onTakePhoto once the sheet has dismissed', () => {
    jest.useFakeTimers();
    const onTakePhoto = jest.fn();
    const { getByTestId } = render(
      <ChatInput {...baseProps} onPickPhoto={noop} onTakePhoto={onTakePhoto} />,
    );

    fireEvent.press(getByTestId('chat-attach-button'));
    fireEvent.press(getByTestId('chat-attach-camera'));
    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(onTakePhoto).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('fires the chosen action only once', () => {
    // Guards the double-fire risk: on iOS both onDismiss and the timeout
    // fallback can run, so pendingChoice is cleared before dispatch.
    jest.useFakeTimers();
    const onPickPhoto = jest.fn();
    const { getByTestId } = render(
      <ChatInput {...baseProps} onPickPhoto={onPickPhoto} />,
    );

    fireEvent.press(getByTestId('chat-attach-button'));
    fireEvent.press(getByTestId('chat-attach-library'));
    act(() => {
      jest.advanceTimersByTime(350);
    });
    act(() => {
      getByTestId('chat-attachment-modal').props.onDismiss?.();
    });

    expect(onPickPhoto).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('closes the sheet after a choice is made', () => {
    const { getByTestId } = render(
      <ChatInput {...baseProps} onPickPhoto={noop} />,
    );

    fireEvent.press(getByTestId('chat-attach-button'));
    fireEvent.press(getByTestId('chat-attach-library'));

    expect(isSheetOpen(getByTestId)).toBe(false);
  });

  it('hides the photo options when onPickPhoto is not provided', () => {
    // i.e. the feature flag is off. The file option must still work, so the
    // button cannot simply disappear.
    const { getByTestId, queryByTestId } = render(
      <ChatInput {...baseProps} />,
    );

    fireEvent.press(getByTestId('chat-attach-button'));

    expect(queryByTestId('chat-attach-library')).toBeNull();
    expect(queryByTestId('chat-attach-camera')).toBeNull();
    expect(getByTestId('chat-attach-file')).toBeTruthy();
  });
});

describe('the staged thumbnail', () => {
  it('renders a thumbnail for a staged photo', () => {
    const { getByTestId } = render(
      <ChatInput {...baseProps} attachments={[AN_ATTACHMENT]} />,
    );

    expect(getByTestId('chat-staged-thumbnail')).toBeTruthy();
  });

  it('renders nothing when there is no staged photo', () => {
    const { queryByTestId } = render(
      <ChatInput {...baseProps} attachments={[]} />,
    );

    expect(queryByTestId('chat-staged-thumbnail')).toBeNull();
  });

  it('calls onRemoveAttachment when the remove control is pressed', () => {
    const onRemoveAttachment = jest.fn();
    const { getByTestId } = render(
      <ChatInput
        {...baseProps}
        attachments={[AN_ATTACHMENT]}
        onRemoveAttachment={onRemoveAttachment}
      />,
    );

    fireEvent.press(getByTestId('chat-remove-attachment'));

    expect(onRemoveAttachment).toHaveBeenCalledTimes(1);
  });

  it('shows a preparing indicator while a photo is being processed', () => {
    const { getByTestId } = render(
      <ChatInput {...baseProps} preparing />,
    );

    expect(getByTestId('chat-attachment-preparing')).toBeTruthy();
  });
});

describe('send button enablement', () => {
  // Asserted on the `disabled` prop, matching the existing ChatInput suite:
  // TouchableOpacity renders as a string under the shared RN mock, so
  // fireEvent.press fires regardless of whether the button is disabled.
  const sendDisabled = (props: Partial<React.ComponentProps<typeof ChatInput>>) => {
    const { getByTestId } = render(<ChatInput {...baseProps} {...props} />);
    return getByTestId('send-button').props.disabled;
  };

  it('enables send for a staged photo with no text', () => {
    // The headline new case: a photo alone is a valid turn. Previously send
    // was disabled whenever the draft was empty.
    expect(sendDisabled({ value: '', attachments: [AN_ATTACHMENT] })).toBe(false);
  });

  it('still disables send when there is neither text nor a photo', () => {
    expect(sendDisabled({ value: '', attachments: [] })).toBe(true);
  });

  it('disables send while a photo is still being prepared', () => {
    // Sending mid-prepare would race the staged state and send a text-only
    // turn, silently dropping the photo the user just picked.
    expect(sendDisabled({ value: 'hello', preparing: true })).toBe(true);
  });

  it('still disables send while the previous turn is in flight', () => {
    expect(
      sendDisabled({
        value: 'hello',
        disabled: true,
        attachments: [AN_ATTACHMENT],
      }),
    ).toBe(true);
  });

  it('enables send for text with no photo, as before', () => {
    expect(sendDisabled({ value: 'hello' })).toBe(false);
  });
});

describe('accessibility', () => {
  it('labels the attach button', () => {
    const { getByTestId } = render(<ChatInput {...baseProps} />);

    expect(
      getByTestId('chat-attach-button').props.accessibilityLabel,
    ).toBeTruthy();
  });

  it('labels the remove control', () => {
    const { getByTestId } = render(
      <ChatInput
        {...baseProps}
        attachments={[AN_ATTACHMENT]}
        onRemoveAttachment={noop}
      />,
    );

    expect(
      getByTestId('chat-remove-attachment').props.accessibilityLabel,
    ).toBeTruthy();
  });
});
