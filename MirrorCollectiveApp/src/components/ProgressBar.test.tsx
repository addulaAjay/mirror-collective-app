import { render } from '@testing-library/react-native';
import React from 'react';

import ProgressBar from './ProgressBar';

const TID = 'progress-bar';

describe('ProgressBar', () => {
  it('renders with progressbar role and default progress', () => {
    const { getByTestId } = render(<ProgressBar testID={TID} />);
    const node = getByTestId(TID);
    expect(node.props.accessibilityRole).toBe('progressbar');
    expect(node.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 0 });
  });

  it.each([
    [0,    0],
    [0.25, 25],
    [0.5,  50],
    [0.999, 100],  // rounds up
    [1,    100],
  ])('progress=%f → accessibilityValue.now=%i', (progress, expected) => {
    const { getByTestId } = render(<ProgressBar progress={progress} testID={TID} />);
    expect(getByTestId(TID).props.accessibilityValue.now).toBe(expected);
  });

  it.each([
    [-0.5, 0],
    [1.5,  100],
    [10,   100],
  ])('clamps out-of-range progress=%f → now=%i', (progress, expected) => {
    const { getByTestId } = render(<ProgressBar progress={progress} testID={TID} />);
    expect(getByTestId(TID).props.accessibilityValue.now).toBe(expected);
  });

  it('respects custom width prop', () => {
    const { getByTestId } = render(<ProgressBar progress={0.5} width={200} testID={TID} />);
    const style = getByTestId(TID).props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
    expect(flat.width).toBe(200);
  });
});
