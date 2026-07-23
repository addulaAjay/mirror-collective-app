import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import MirrorSideMenu from './NavigationMenuScreen';

jest.mock('@components/CircularLogoMark', () => 'CircularLogoMark');

describe('MirrorSideMenu — logout', () => {
  const baseProps = {
    isOpen: true,
    userName: 'Sarah Collins',
    onClose: jest.fn(),
    onNavigate: jest.fn(),
    onLogout: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders a Logout item when the menu is open', () => {
    const { getByText } = render(<MirrorSideMenu {...baseProps} />);

    expect(getByText('Logout')).toBeTruthy();
  });

  it('calls onLogout when the Logout item is pressed', () => {
    const onLogout = jest.fn();
    const { getByText } = render(
      <MirrorSideMenu {...baseProps} onLogout={onLogout} />,
    );

    fireEvent.press(getByText('Logout'));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
