/**
 * Canonical English copy for Reflection Room V1.
 *
 * Source of truth: 03_UI_DEVELOPER_HANDOFF.md §12 (canonical) and
 * 08_FIGMA_ALIGNMENT_DELTA.md (per-node Figma strings).
 *
 * RULES:
 *  - Match exactly, including em-dashes, apostrophes, and punctuation.
 *  - Do not paraphrase or adjust tone.
 *  - When §12 and Figma diverge, §12 wins.
 *  - Em-dashes are real `—` characters; curly apostrophes are `’`.
 *  - Backend snake_case IDs are converted to display labels via DISPLAY_*
 *    maps below — never hardcode display labels at call sites.
 */

import type { IntensityLabel, LoopId, MotifId, ToneState } from '../types/ids';

// ---------------------------------------------------------------------------
// 12.1 — First-time Welcome (3 onboarding overlays — node 4654-3338)
// ---------------------------------------------------------------------------

export const WELCOME_OVERLAYS = [
  {
    eyebrow: 'WELCOME TO REFLECTION ROOM',
    headline: 'Catch the Pattern.',
    body: 'Notice the feeling. See it repeat. Watch it shift.',
    tagline: 'Change starts here.',
  },
  {
    eyebrow: 'ONE SMALL STEP, EVERY DAY',
    headline: 'Your emotional snapshot — right now.',
    body: "Your pattern, in real time. What’s rising. What’s steady. One small step to shift it.",
    tagline: 'See it. Shift it.',
  },
  {
    eyebrow: 'SEE YOUR PATTERNS CLEARLY',
    headline: 'Your Echo Map shows what’s strongest — and what’s ready to shift.',
    body: 'Your Echo Map shows what’s strongest, what’s softening, and what keeps repeating. Your Mirror Moment gives you one small action to shift it.',
    tagline: 'You can’t change what you can’t see.',
  },
] as const;

// ---------------------------------------------------------------------------
// 12.2 — Reflection Room landing (node 4791-2304, Homescreen RR CTA)
// CTA labels confirmed via Figma MCP get_screenshot on 2026-05-03:
//   primary CTA  → "OPEN ECHO MAP"
//   secondary CTA → "MIRROR MOMENT"
// (Both Component 4 secondary-style buttons. Body line invites the user to
//  tap the motif itself to enter Echo Signature.)
// ---------------------------------------------------------------------------

export const LANDING = {
  eyebrow: 'REFLECTION ROOM',
  subhead: 'See it. Choose what comes next.',
  motifTapHint: 'Tap on motif to view your current Echo Signature.',
  ctaOpenEchoMap: 'OPEN ECHO MAP',
  ctaMirrorMoment: 'MIRROR MOMENT',
  failHeader: 'RESULTS NOT AVAILABLE',
  failBody: 'We couldn’t load your reflection room right now.',
  failRetry: 'TRY AGAIN',
} as const;

// ---------------------------------------------------------------------------
// 12.3 — Quiz entry (node 4654-3272)
// ---------------------------------------------------------------------------

export const QUIZ_ENTRY = {
  eyebrow: 'REFLECTION ROOM',
  body: 'Where awareness turns into real change. Small moments. Real change. Over time. A quick reflection helps you access the space you need right now.',
  ambientToggle: 'Ambient Sounds',
} as const;

// ---------------------------------------------------------------------------
// 12.4 — Quiz prompts (CANONICAL — match exactly)
// ---------------------------------------------------------------------------

export const QUIZ_PROMPTS = {
  q1: 'How are you arriving today?',
  q2: 'What intention would you like to bring into your Reflection Room today?',
  q3: 'Which of these speaks to you the most today?',
  q4: 'What kind of message would help right now?',
} as const;

export const QUIZ_FOOTER = {
  // Q1, Q2, Q4 — word options
  word: 'Choose the word that resonates. There’s no right answer.',
  // Q3 — icon options
  icon: 'Choose the option that resonates. There’s no right answer.',
} as const;

// ---------------------------------------------------------------------------
// 12.5 — Quiz tuning state
// ---------------------------------------------------------------------------

export const QUIZ_TUNING = {
  eyebrow: 'YOUR REFLECTION IS TUNING...',
  status: 'Your reflection is taking shape.',
  body: 'You’ll enter your Reflection Room in a moment. This is where the Mirror begins to understand your patterns more clearly.',
} as const;

// ---------------------------------------------------------------------------
// 12.6 — Today's Motif reveal
// ---------------------------------------------------------------------------

export const TODAYS_MOTIF = {
  eyebrow: 'TODAY’S MOTIF',
  // Motif name shown UPPERCASE — derived from MotifId via displayMotifName()
} as const;

// ---------------------------------------------------------------------------
// 12.7 — Quiz error state
// ---------------------------------------------------------------------------

export const QUIZ_ERROR = {
  header: 'RESULTS NOT AVAILABLE',
  body: 'We weren’t able to shape your results this time. Let’s try again to uncover your patterns.',
} as const;

// ---------------------------------------------------------------------------
// 12.8 — Echo Signature (node 4654-3274)
// ---------------------------------------------------------------------------

export const ECHO_SIGNATURE = {
  eyebrow: 'ECHO SIGNATURE',
  subhead: 'Recognize and implement any changes in your life.',
  loadingHeader: 'YOUR ECHO SIGNATURE IS LOADING...',
  loadingBody: 'Your reflection is taking shape.',
  emptyHeader: 'NO LOOPS FOUND',
  emptyBody: 'All quiet for now.',
  errorHeader: 'RESULTS NOT AVAILABLE',
  errorBody: 'We couldn’t load your Echo Signature right now.',
  practiceCta: 'Try a 2-min practice',
  backToReflectionRoom: 'Back to Reflection Room',
  openEchoMap: 'Open Echo Map',
} as const;

// ---------------------------------------------------------------------------
// 12.9 — Echo Map (node 4654-2881)
// ---------------------------------------------------------------------------

export const ECHO_MAP = {
  eyebrow: 'ECHO MAP',
  subhead: 'See what’s repeating, and what’s ready to change.',
  footer: 'This is a mirror, not a label.',
  tapOverlayContinue: 'click anywhere to continue',
  loadingHeader: 'YOUR ECHO MAP IS LOADING...',
  errorHeader: 'RESULTS NOT AVAILABLE',
  errorBody: 'We couldn’t load your Echo Map right now.',
  emptyHeader: 'NO STRONG LOOPS ACTIVE',
  emptyBody: 'All quiet for now.',
  updateMyMirror: 'Update My Mirror',
  tuneSignature: 'Tune Signature',
  continueToMirrorMoment: 'Continue to Mirror Moment',
  infoOverlay1: {
    header: 'WHAT IS THE ECHO MAP?',
    body: 'The Echo Map shows how your inner patterns move over time — stress, clarity, grief, confidence, pressure. The closer a pattern is to you, the more it’s influencing your mood, energy, and decisions right now. As it softens, it moves outward. This isn’t a score. It’s awareness — made visible.',
    footer: 'If you can see the pattern, you can change it. If you can’t, it quietly runs the show.',
  },
  infoOverlay2: {
    header: 'HOW TO READ YOUR ECHO MAP',
    subhead: 'Distance = influence',
    body: 'Near YOU: Actively shaping how you feel, think, or react right now.\nMiddle orbit: Still present, but no longer in control.\nOuter orbit: Easing. Less pull. Integration happening.',
    footer: 'Patterns move as you do. Small shifts add up. This map isn’t you — it reflects what you’re working through.',
  },
} as const;

// ---------------------------------------------------------------------------
// 12.10 — Mirror Moment (node 4654-3335)
// ---------------------------------------------------------------------------

export const MIRROR_MOMENT = {
  eyebrow: 'MIRROR MOMENT',
  subhead: 'Choose one small shift.',
  backNav: 'My Reflection Room',
  practiceHeader: 'TWO MINUTE PRACTICE',
  loadingHeader: 'YOUR MIRROR MOMENT IS LOADING...',
  loadingBody: 'Please wait.',
  emptyBody: 'Nothing pressing right now — that’s its own kind of moment.',
  errorHeader: 'RESULTS NOT AVAILABLE',
  errorBody: 'We couldn’t load your Mirror Moment right now.',
  completeHeader: 'PRACTICE COMPLETE',
  completeBody: 'Nice. You noticed it. You shifted it. The more you notice, the easier it gets to choose differently.',
  failHeader: 'PRACTICE UNAVAILABLE',
  failBody: 'We weren’t able to finish your practice. Would you like to try again?',
  infoOverlay1: {
    header: 'WHAT IS A MIRROR MOMENT?',
    body: 'A Mirror Moment is a 2-minute reset that turns awareness into action. After you see your patterns, this is where you shift them. You’ll use breath, focus, and simple prompts to interrupt stress, emotion, or autopilot — and respond with intention instead of reacting. Small moments like this are what create real change.',
  },
  infoOverlay2: {
    header: 'WHEN SHOULD I USE IT?',
    body: 'When you feel overwhelmed or emotionally tight\nBefore a hard conversation\nWhen your thoughts are spiraling\nWhen you want to reset without overthinking',
  },
  infoOverlay3: {
    header: 'WHAT HAPPENS AFTER?',
    body: 'Each Mirror Moment gently updates your Reflection Room — helping you see what’s shifting over time, not just how you feel right now.',
  },
  postCompleteCtas: {
    backToReflectionRoom: 'Back to Reflection Room',
    backHome: 'Back Home',
    viewUpdatedEchoMap: 'View Updated Echo Map',
  },
} as const;

// ---------------------------------------------------------------------------
// 12.11 — Display-label maps (apply when rendering backend IDs)
// ---------------------------------------------------------------------------

const LOOP_DISPLAY: Record<LoopId, string> = {
  pressure: 'Pressure',
  overwhelm: 'Overwhelm',
  grief: 'Grief',
  // §12.11 footnote: Figma renders "Self- silencing" with a space; canonical
  // is "Self-silencing" (no space). Default to canonical.
  self_silencing: 'Self-silencing',
  agency: 'Agency',
  transition: 'Transition',
};

export function displayLoopName(loopId: LoopId): string {
  return LOOP_DISPLAY[loopId];
}

export function displayLoopUpper(loopId: LoopId): string {
  return LOOP_DISPLAY[loopId].toUpperCase();
}

const MOTIF_DISPLAY: Record<MotifId, string> = {
  compass: 'Compass',
  mirror: 'Mirror',
  blocks: 'Blocks',
  spiral: 'Spiral',
  feather: 'Feather',
  radiant_burst: 'Radiant Burst',
  waves: 'Waves',
  pyramid: 'Pyramid',
  water_drop: 'Water Drop',
  brick_stack: 'Brick Stack',
  sprout: 'Sprout',
};

export function displayMotifName(motifId: MotifId): string {
  return MOTIF_DISPLAY[motifId];
}

export function displayMotifUpper(motifId: MotifId): string {
  return MOTIF_DISPLAY[motifId].toUpperCase();
}

const TONE_DISPLAY: Record<ToneState, string> = {
  rising: 'Rising',
  steady: 'Steady',
  softening: 'Softening',
};

/** Echo Signature card tone label — prepends "- " per §12.8 + §12.11. */
export function toneSignatureLabel(tone: ToneState): string {
  return `- ${TONE_DISPLAY[tone]}`;
}

/** Echo Map overlay tone label — bare title-case per §12.9 + §12.11. */
export function toneMapLabel(tone: ToneState): string {
  return TONE_DISPLAY[tone];
}

/** Echo Map overlay intensity label — uppercase + " INTENSITY" per §12.9. */
export function intensityMapLabel(label: IntensityLabel): string {
  return `${label.toUpperCase()} INTENSITY`;
}
