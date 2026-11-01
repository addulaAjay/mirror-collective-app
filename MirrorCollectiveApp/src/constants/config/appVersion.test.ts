/**
 * APP_VERSION must match what the binary actually reports.
 *
 * The server gates the `subscription_required` 403 on the `X-App-Version`
 * header (see src/app/core/entitlements.py). If this constant drifts below the
 * real MARKETING_VERSION the gate just stays shut — paywall routing silently
 * degrades to a plain error for everyone, with nothing to notice. If it drifts
 * ABOVE, a build without the alert-race fix could claim to be new and crash.
 *
 * Hand-maintained constants drift. This reads the real value out of the Xcode
 * project so the drift is a failing test rather than a production surprise.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { APP_VERSION } from './config';

const PBXPROJ = join(
  __dirname,
  '..',
  '..',
  '..',
  'ios',
  'MirrorCollectiveApp.xcodeproj',
  'project.pbxproj',
);

/** Every MARKETING_VERSION in the Xcode project (Debug and Release configs). */
const marketingVersions = (): string[] => {
  const src = readFileSync(PBXPROJ, 'utf8');
  const matches = [...src.matchAll(/MARKETING_VERSION = ([0-9.]+);/g)];
  return [...new Set(matches.map(m => m[1]))];
};

describe('APP_VERSION', () => {
  it('matches MARKETING_VERSION in the Xcode project', () => {
    const versions = marketingVersions();

    expect(versions).toContain(APP_VERSION);
  });

  it('Debug and Release agree on one version', () => {
    // If these diverge, a Debug build would report a different version than
    // the Release build that actually ships.
    expect(marketingVersions()).toHaveLength(1);
  });

  it('is a plain dotted-numeric version the server can parse', () => {
    // The server parses with /^\s*(\d+(?:\.\d+)*)/ and fails closed otherwise.
    expect(APP_VERSION).toMatch(/^\d+(\.\d+)*$/);
  });
});
