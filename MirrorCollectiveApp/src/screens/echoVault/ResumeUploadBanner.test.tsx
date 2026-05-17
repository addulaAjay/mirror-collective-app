/**
 * Tests for the resume-upload banner — a pure render component.
 * The vault library screen owns the scan + resume orchestration; this
 * test file pins the banner's rendering contract.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { PendingUpload } from '@services/api/pendingUploads';

import { ResumeUploadBanner } from './ResumeUploadBanner';

function makePending(overrides: Partial<PendingUpload> = {}): PendingUpload {
  return {
    echoId: 'echo-1',
    uploadId: 'UPLOAD-1',
    key: 'echoes/u-1/echo-1.mp4',
    cachedFileUri: '/cache/mc-pending/echo-1.mp4',
    contentType: 'video/mp4',
    fileSize: 25 * 1024 * 1024, // 5 parts at 5 MB
    completedParts: [
      { part_number: 1, etag: 'a' },
      { part_number: 2, etag: 'b' },
    ],
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    title: 'Vacation Memory',
    ...overrides,
  };
}

describe('ResumeUploadBanner', () => {
  it('renders nothing when the pending list is empty', () => {
    const c = render(
      <ResumeUploadBanner
        pending={[]}
        onContinue={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    // toJSON returns null for an empty fragment / no render output.
    expect(c.toJSON()).toBeNull();
  });

  it('renders one card per pending upload with title + parts progress', () => {
    const c = render(
      <ResumeUploadBanner
        pending={[
          makePending({ echoId: 'a', title: 'Trip A' }),
          makePending({ echoId: 'b', title: 'Trip B', completedParts: [] }),
        ]}
        onContinue={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(c.getByText('Trip A')).toBeTruthy();
    expect(c.getByText('Trip B')).toBeTruthy();
    // Parts string: 2 of 5 parts saved (Trip A — 25MB / 5MB = 5 parts)
    expect(c.getByText('2 of 5 parts saved')).toBeTruthy();
    expect(c.getByText('0 of 5 parts saved')).toBeTruthy();
  });

  it('fires onContinue with the row when Continue is pressed', () => {
    const onContinue = jest.fn();
    const row = makePending({ title: 'Resume me' });
    const c = render(
      <ResumeUploadBanner
        pending={[row]}
        onContinue={onContinue}
        onDismiss={jest.fn()}
      />,
    );
    fireEvent.press(c.getByLabelText('Continue uploading Resume me'));
    expect(onContinue).toHaveBeenCalledWith(row);
  });

  it('fires onDismiss with the row when Dismiss is pressed', () => {
    const onDismiss = jest.fn();
    const row = makePending({ title: 'Drop me' });
    const c = render(
      <ResumeUploadBanner
        pending={[row]}
        onContinue={jest.fn()}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.press(c.getByLabelText('Dismiss upload of Drop me'));
    expect(onDismiss).toHaveBeenCalledWith(row);
  });

  it('shows percentage and hides buttons while the row is resuming', () => {
    const row = makePending({ echoId: 'a', title: 'Resuming Now' });
    const c = render(
      <ResumeUploadBanner
        pending={[row]}
        resumingEchoId="a"
        resumingProgress={0.42}
        onContinue={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(c.getByText('Uploading… 42%')).toBeTruthy();
    // Buttons are replaced by the spinner; querying them returns null.
    expect(c.queryByLabelText('Continue uploading Resuming Now')).toBeNull();
    expect(c.queryByLabelText('Dismiss upload of Resuming Now')).toBeNull();
    expect(c.getByLabelText('Resuming upload')).toBeTruthy();
  });

  it('disables buttons on OTHER rows while one is resuming', () => {
    const c = render(
      <ResumeUploadBanner
        pending={[
          makePending({ echoId: 'a', title: 'Active' }),
          makePending({ echoId: 'b', title: 'Idle' }),
        ]}
        resumingEchoId="a"
        resumingProgress={0.1}
        onContinue={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    const idleContinue = c.getByLabelText('Continue uploading Idle');
    // RN's TouchableOpacity exposes the `disabled` prop directly on the
    // host node it renders. Whether it surfaces in accessibilityState
    // depends on the RN version, so check the raw prop.
    expect(idleContinue.props.disabled).toBe(true);
  });
});
