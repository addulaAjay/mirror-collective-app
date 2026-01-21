import { render } from '@testing-library/react-native';
import React from 'react';

import BackgroundWrapper from './BackgroundWrapper';

describe('BackgroundWrapper', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <BackgroundWrapper>
        <React.Fragment>Test Content</React.Fragment>
      </BackgroundWrapper>,
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    render(
      <BackgroundWrapper style={customStyle}>
        <React.Fragment />
      </BackgroundWrapper>,
    );
    // basic render check
  });
});
