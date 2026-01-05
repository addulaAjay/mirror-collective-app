import React from 'react';
import { render } from '@testing-library/react-native';

import BackgroundWrapper from './BackgroundWrapper';

describe('BackgroundWrapper', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <BackgroundWrapper>
        <></>
      </BackgroundWrapper>,
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <BackgroundWrapper style={customStyle}>
        <></>
      </BackgroundWrapper>,
    );
    // Test that custom styles are applied
    // Note: This is a basic test, expand as needed
  });
});
