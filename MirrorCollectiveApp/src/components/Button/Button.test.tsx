import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import Button from './Button';

// BlurView from @react-native-community/blur uses native modules — mock to a
// simple host component so jest doesn't try to resolve them at test time.
jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

const noop = () => {};

describe('Button', () => {
  describe('structural snapshots', () => {
    it.each([
      ['primary', 'L', 'default', { variant: 'primary' as const, size: 'L' as const }],
      ['primary', 'L', 'active',  { variant: 'primary' as const, size: 'L' as const, active: true }],
      ['primary', 'L', 'disabled',{ variant: 'primary' as const, size: 'L' as const, disabled: true }],
      ['primary', 'S', 'default', { variant: 'primary' as const, size: 'S' as const }],
      ['primary', 'S', 'active',  { variant: 'primary' as const, size: 'S' as const, active: true }],
      ['primary', 'S', 'disabled',{ variant: 'primary' as const, size: 'S' as const, disabled: true }],
      ['secondary','L','default', { variant: 'secondary' as const, size: 'L' as const }],
      ['secondary','L','active',  { variant: 'secondary' as const, size: 'L' as const, active: true }],
      ['secondary','L','disabled',{ variant: 'secondary' as const, size: 'L' as const, disabled: true }],
      ['secondary','S','default', { variant: 'secondary' as const, size: 'S' as const }],
      ['secondary','S','active',  { variant: 'secondary' as const, size: 'S' as const, active: true }],
      ['secondary','S','disabled',{ variant: 'secondary' as const, size: 'S' as const, disabled: true }],
      ['link',     'L','default', { variant: 'link' as const, size: 'L' as const }],
      ['link',     'L','disabled',{ variant: 'link' as const, size: 'L' as const, disabled: true }],
      ['link',     'S','default', { variant: 'link' as const, size: 'S' as const }],
      ['link',     'S','disabled',{ variant: 'link' as const, size: 'S' as const, disabled: true }],
      ['auth',     '-','default', { variant: 'auth' as const }],
      ['auth',     '-','disabled',{ variant: 'auth' as const, disabled: true }],
      ['auth',     '-','24px-icon',{ variant: 'auth' as const, iconSize: 24 }],
    ])('%s · %s · %s', (_variant, _size, _state, props) => {
      const tree = render(<Button {...props} title="TEXT" onPress={noop} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('behaviour', () => {
    it('fires onPress when enabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button variant="primary" size="L" title="GO" onPress={onPress} />,
      );
      fireEvent.press(getByText('GO'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('marks the underlying pressable as disabled when disabled prop is set', () => {
      // testing-library fireEvent bypasses TouchableOpacity's native disabled
      // guard, so we assert the prop propagated to the pressable rather than
      // simulating a press. The native runtime + TouchableOpacity handle the
      // actual press suppression.
      const onPress = jest.fn();
      const { UNSAFE_getAllByType } = render(
        <Button variant="primary" size="L" title="GO" onPress={onPress} disabled />,
      );
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { TouchableOpacity } = require('react-native');
      const pressables = UNSAFE_getAllByType(TouchableOpacity);
      expect(pressables.some((p: { props: { disabled?: boolean } }) => p.props.disabled === true)).toBe(true);
    });

    it('renders the title text', () => {
      const { getByText } = render(
        <Button variant="primary" size="L" title="HELLO" onPress={noop} />,
      );
      expect(getByText('HELLO')).toBeTruthy();
    });
  });
});
