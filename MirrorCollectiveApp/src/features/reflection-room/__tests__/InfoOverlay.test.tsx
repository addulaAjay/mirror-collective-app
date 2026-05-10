/**
 * Tests for the reusable InfoOverlay.
 *  - Renders the first page header + body.
 *  - Tapping the next arrow advances the page.
 *  - Tapping the back arrow on page 2 returns to page 1.
 *  - X close button fires onDismiss.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';

import InfoOverlay, {
  type InfoPage,
} from '../components/InfoOverlay';

const pages: InfoPage[] = [
  {
    header: 'PAGE ONE',
    body: 'First body.',
    footer: 'first italic footer',
  },
  {
    header: 'PAGE TWO',
    subhead: 'sub line',
    body: 'Second body.',
    footer: 'second italic footer',
  },
];

describe('InfoOverlay', () => {
  it('renders the first page by default', () => {
    const { getByText } = render(
      <InfoOverlay pages={pages} onDismiss={() => {}} />,
    );
    expect(getByText('PAGE ONE')).toBeTruthy();
    expect(getByText('First body.')).toBeTruthy();
    expect(getByText('first italic footer')).toBeTruthy();
  });

  it('Next arrow advances to the second page', () => {
    const { getByText, getByLabelText } = render(
      <InfoOverlay pages={pages} onDismiss={() => {}} />,
    );
    fireEvent.press(getByLabelText('Next'));
    expect(getByText('PAGE TWO')).toBeTruthy();
    expect(getByText('sub line')).toBeTruthy();
    expect(getByText('Second body.')).toBeTruthy();
  });

  it('Previous arrow returns from page 2 to page 1', () => {
    const { getByText, getByLabelText } = render(
      <InfoOverlay pages={pages} onDismiss={() => {}} />,
    );
    fireEvent.press(getByLabelText('Next'));
    fireEvent.press(getByLabelText('Previous'));
    expect(getByText('PAGE ONE')).toBeTruthy();
  });

  it('Close X fires onDismiss', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <InfoOverlay pages={pages} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByLabelText('Close'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not render nav arrows when only one page is provided', () => {
    const single: InfoPage[] = [pages[0]];
    const { queryByLabelText } = render(
      <InfoOverlay pages={single} onDismiss={() => {}} />,
    );
    expect(queryByLabelText('Next')).toBeNull();
    expect(queryByLabelText('Previous')).toBeNull();
  });
});
