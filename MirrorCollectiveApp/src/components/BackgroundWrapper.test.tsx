import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import BackgroundWrapper from './BackgroundWrapper';

describe('BackgroundWrapper', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <BackgroundWrapper>
        <Text>Test Content</Text>
      </BackgroundWrapper>,
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies custom styles without crashing', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByText } = render(
      <BackgroundWrapper style={customStyle}>
        <Text>Styled</Text>
      </BackgroundWrapper>,
    );
    expect(getByText('Styled')).toBeTruthy();
  });
});
