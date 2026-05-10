/**
 * Canonical Reflection Room V1 quiz definitions.
 *
 * - Question prompts and footer microcopy from 03_UI_DEVELOPER_HANDOFF.md
 *   §12.4 (verbatim, including punctuation).
 * - Answer enums from 01_BACKEND_IMPLEMENTATION_SPEC.md §5.1.
 * - Q3 motif glyphs match Figma node 4654-3272 frame 4 (6 of 11 motifs
 *   shown — a strict subset of the backend Q3 enum).
 *
 * Each option carries a `label` (display string in the design's
 * uppercase-letter-spaced style) and a `value` that is exactly the
 * backend wire enum.
 */

import { QUIZ_FOOTER, QUIZ_PROMPTS } from '../copy/strings';
import type {
  Q1Answer,
  Q2Answer,
  Q3Answer,
  Q4Answer,
} from '../api/types';

interface BaseQuestion {
  id: 1 | 2 | 3 | 4;
  prompt: string;
  footer: string;
}

export interface WordQuestion<V extends string> extends BaseQuestion {
  type: 'word';
  options: ReadonlyArray<{ label: string; value: V }>;
}

export interface IconQuestion<V extends string> extends BaseQuestion {
  type: 'icon';
  options: ReadonlyArray<{ label: string; value: V; motifKey: V }>;
}

export const Q1: WordQuestion<Q1Answer> = {
  id: 1,
  type: 'word',
  prompt: QUIZ_PROMPTS.q1,
  footer: QUIZ_FOOTER.word,
  options: [
    { label: 'CURIOUS', value: 'curious' },
    { label: 'GROUNDED', value: 'grounded' },
    { label: 'HOPEFUL', value: 'hopeful' },
    { label: 'HEAVY', value: 'heavy' },
    { label: 'SCATTERED', value: 'scattered' },
    { label: 'NUMB', value: 'numb' },
  ],
};

export const Q2: WordQuestion<Q2Answer> = {
  id: 2,
  type: 'word',
  prompt: QUIZ_PROMPTS.q2,
  footer: QUIZ_FOOTER.word,
  options: [
    { label: 'CLARITY', value: 'clarity' },
    { label: 'PEACE', value: 'peace' },
    { label: 'HEALING', value: 'healing' },
    { label: 'INSPIRATION', value: 'inspiration' },
    { label: 'STILLNESS', value: 'stillness' },
  ],
};

/**
 * Q3 (motif icons). Figma renders 6 of 11 motifs. The backend enum (Q3Answer)
 * accepts all 11 — what we ship is a strict subset matching the production
 * design (4654-3272 frame 4 + the 6 glyphs already present in the repo's
 * MOTIF_SVG asset map).
 */
export const Q3: IconQuestion<Q3Answer> = {
  id: 3,
  type: 'icon',
  prompt: QUIZ_PROMPTS.q3,
  footer: QUIZ_FOOTER.icon,
  options: [
    { label: 'RADIANT BURST', value: 'radiant_burst', motifKey: 'radiant_burst' },
    { label: 'BLOCKS', value: 'blocks', motifKey: 'blocks' },
    { label: 'MIRROR', value: 'mirror', motifKey: 'mirror' },
    { label: 'COMPASS', value: 'compass', motifKey: 'compass' },
    { label: 'FEATHER', value: 'feather', motifKey: 'feather' },
    { label: 'SPIRAL', value: 'spiral', motifKey: 'spiral' },
  ],
};

export const Q4: WordQuestion<Q4Answer> = {
  id: 4,
  type: 'word',
  prompt: QUIZ_PROMPTS.q4,
  footer: QUIZ_FOOTER.word,
  options: [
    { label: 'EMOTIONAL SOOTHING', value: 'soothing' },
    { label: 'GENTLE ENCOURAGEMENT', value: 'gentle' },
    { label: 'REFLECTIVE INSIGHT', value: 'insight' },
    { label: 'DIRECT TRUTH', value: 'direct' },
    { label: 'NO WORDS, JUST PRESENCE', value: 'presence' },
  ],
};

export type AnyQuestion = WordQuestion<Q1Answer | Q2Answer | Q4Answer> | IconQuestion<Q3Answer>;

export const QUIZ_QUESTIONS: ReadonlyArray<AnyQuestion> = [Q1, Q2, Q3, Q4] as const;

/**
 * Partial in-progress answers built up as the user moves through the quiz.
 * Keys are guaranteed to be a subset of {q1, q2, q3, q4}.
 */
export type PartialQuizAnswers = {
  q1?: Q1Answer;
  q2?: Q2Answer;
  q3?: Q3Answer;
  q4?: Q4Answer;
};

export function isCompleteAnswers(
  partial: PartialQuizAnswers,
): partial is Required<PartialQuizAnswers> {
  return (
    partial.q1 !== undefined &&
    partial.q2 !== undefined &&
    partial.q3 !== undefined &&
    partial.q4 !== undefined
  );
}
