/**
 * Snapshot-style assertions on the canonical copy module.
 * Guards against accidental paraphrasing or punctuation drift.
 *
 * Source: 03_UI_DEVELOPER_HANDOFF.md §12.
 */

import {
  WELCOME_OVERLAYS,
  LANDING,
  QUIZ_PROMPTS,
  QUIZ_FOOTER,
  QUIZ_TUNING,
  QUIZ_ERROR,
  ECHO_SIGNATURE,
  ECHO_MAP,
  MIRROR_MOMENT,
  displayLoopName,
  displayLoopUpper,
  displayMotifName,
  displayMotifUpper,
  toneSignatureLabel,
  toneMapLabel,
  intensityMapLabel,
} from '../copy/strings';

describe('Reflection Room canonical copy (UI handoff §12)', () => {
  describe('§12.1 Welcome overlays', () => {
    it('has 3 overlays in order', () => {
      expect(WELCOME_OVERLAYS).toHaveLength(3);
      expect(WELCOME_OVERLAYS[0].eyebrow).toBe('WELCOME TO REFLECTION ROOM');
      expect(WELCOME_OVERLAYS[1].eyebrow).toBe('ONE SMALL STEP, EVERY DAY');
      expect(WELCOME_OVERLAYS[2].eyebrow).toBe('SEE YOUR PATTERNS CLEARLY');
    });

    it('preserves em-dashes in headlines', () => {
      expect(WELCOME_OVERLAYS[1].headline).toContain('—');
      expect(WELCOME_OVERLAYS[2].headline).toContain('—');
    });
  });

  describe('§12.2 Landing', () => {
    it('matches Figma node 4791-2304 verbatim', () => {
      expect(LANDING.eyebrow).toBe('REFLECTION ROOM');
      expect(LANDING.subhead).toBe('See it. Choose what comes next.');
      expect(LANDING.motifTapHint).toBe(
        'Tap on motif to view your current Echo Signature.',
      );
      expect(LANDING.ctaOpenEchoMap).toBe('OPEN ECHO MAP');
      expect(LANDING.ctaMirrorMoment).toBe('MIRROR MOMENT');
      expect(LANDING.failHeader).toBe('RESULTS NOT AVAILABLE');
    });
  });

  describe('§12.4 Quiz prompts (CANONICAL)', () => {
    it('matches Figma exactly', () => {
      expect(QUIZ_PROMPTS.q1).toBe('How are you arriving today?');
      expect(QUIZ_PROMPTS.q2).toBe(
        'What intention would you like to bring into your Reflection Room today?',
      );
      expect(QUIZ_PROMPTS.q3).toBe('Which of these speaks to you the most today?');
      expect(QUIZ_PROMPTS.q4).toBe('What kind of message would help right now?');
    });

    it('has separate footer microcopy for word vs icon options', () => {
      expect(QUIZ_FOOTER.word).toContain('the word that resonates');
      expect(QUIZ_FOOTER.icon).toContain('the option that resonates');
    });
  });

  describe('§12.5–12.7 Quiz states', () => {
    it('uses exact tuning eyebrow with ellipsis', () => {
      expect(QUIZ_TUNING.eyebrow).toBe('YOUR REFLECTION IS TUNING...');
    });
    it('uses canonical error copy', () => {
      expect(QUIZ_ERROR.header).toBe('RESULTS NOT AVAILABLE');
      expect(QUIZ_ERROR.body).toContain('uncover your patterns');
    });
  });

  describe('§12.8 Echo Signature', () => {
    it('has canonical state strings', () => {
      expect(ECHO_SIGNATURE.eyebrow).toBe('ECHO SIGNATURE');
      expect(ECHO_SIGNATURE.loadingHeader).toBe(
        'YOUR ECHO SIGNATURE IS LOADING...',
      );
      expect(ECHO_SIGNATURE.emptyHeader).toBe('NO LOOPS FOUND');
      expect(ECHO_SIGNATURE.emptyBody).toBe('All quiet for now.');
    });
  });

  describe('§12.9 Echo Map', () => {
    it('uses the fixed footer string verbatim', () => {
      expect(ECHO_MAP.footer).toBe('This is a mirror, not a label.');
    });
    it('preserves both info-overlay headers', () => {
      expect(ECHO_MAP.infoOverlay1.header).toBe('WHAT IS THE ECHO MAP?');
      expect(ECHO_MAP.infoOverlay2.header).toBe('HOW TO READ YOUR ECHO MAP');
    });
  });

  describe('§12.10 Mirror Moment', () => {
    it('uses canonical headers', () => {
      expect(MIRROR_MOMENT.eyebrow).toBe('MIRROR MOMENT');
      expect(MIRROR_MOMENT.subhead).toBe('Choose one small shift.');
      expect(MIRROR_MOMENT.practiceHeader).toBe('TWO MINUTE PRACTICE');
      expect(MIRROR_MOMENT.completeHeader).toBe('PRACTICE COMPLETE');
      expect(MIRROR_MOMENT.failHeader).toBe('PRACTICE UNAVAILABLE');
    });
  });

  describe('§12.11 Display labels', () => {
    it('maps loop_id to canonical Title-case', () => {
      expect(displayLoopName('pressure')).toBe('Pressure');
      expect(displayLoopName('self_silencing')).toBe('Self-silencing');
      expect(displayLoopUpper('self_silencing')).toBe('SELF-SILENCING');
    });

    it('maps motif_id to canonical labels with multi-word casing', () => {
      expect(displayMotifName('radiant_burst')).toBe('Radiant Burst');
      expect(displayMotifName('water_drop')).toBe('Water Drop');
      expect(displayMotifName('brick_stack')).toBe('Brick Stack');
      expect(displayMotifUpper('radiant_burst')).toBe('RADIANT BURST');
    });

    it('Echo Signature card tone has the "- " prefix', () => {
      expect(toneSignatureLabel('rising')).toBe('- Rising');
      expect(toneSignatureLabel('steady')).toBe('- Steady');
      expect(toneSignatureLabel('softening')).toBe('- Softening');
    });

    it('Echo Map overlay tone is bare title-case (no prefix)', () => {
      expect(toneMapLabel('rising')).toBe('Rising');
      expect(toneMapLabel('steady')).toBe('Steady');
      expect(toneMapLabel('softening')).toBe('Softening');
    });

    it('Echo Map overlay intensity is uppercase + " INTENSITY"', () => {
      expect(intensityMapLabel('High')).toBe('HIGH INTENSITY');
      expect(intensityMapLabel('Medium')).toBe('MEDIUM INTENSITY');
      expect(intensityMapLabel('Low')).toBe('LOW INTENSITY');
    });
  });
});
