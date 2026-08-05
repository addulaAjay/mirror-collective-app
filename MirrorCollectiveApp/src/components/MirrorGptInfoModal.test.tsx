import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import MirrorGptInfoModal from './MirrorGptInfoModal';

describe('MirrorGptInfoModal', () => {
  it('renders the "capture your reflection" copy', () => {
    const { getByText } = render(
      <MirrorGptInfoModal visible onClose={jest.fn()} />,
    );
    expect(getByText('CAPTURE YOUR REFLECTION')).toBeTruthy();
    expect(getByText(/Tap the copy icon in Mirror GPT/)).toBeTruthy();
    expect(getByText(/Learn something/)).toBeTruthy();
  });

  it('calls onClose when the close (×) button is pressed', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <MirrorGptInfoModal visible onClose={onClose} />,
    );
    fireEvent.press(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is pressed', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <MirrorGptInfoModal visible onClose={onClose} />,
    );
    fireEvent.press(getByLabelText('Close info'));
    expect(onClose).toHaveBeenCalled();
  });
});
