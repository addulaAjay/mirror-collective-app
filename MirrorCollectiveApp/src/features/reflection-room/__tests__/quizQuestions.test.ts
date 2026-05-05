/**
 * Tests for the canonical quiz questions data.
 * Asserts:
 *  - All 4 questions present in spec order (Q1..Q4 by id).
 *  - Prompts are §12.4 verbatim (covered separately in copy.test).
 *  - Each option's `value` is a valid backend enum.
 *  - isCompleteAnswers correctly type-narrows.
 */

import {
  Q1,
  Q2,
  Q3,
  Q4,
  QUIZ_QUESTIONS,
  isCompleteAnswers,
} from '../data/quizQuestions';
import {
  Q1_ANSWERS,
  Q2_ANSWERS,
  Q4_ANSWERS,
} from '../api/types';
import { MOTIF_IDS } from '../types/ids';

describe('canonical quiz questions', () => {
  it('renders Q1..Q4 in spec order', () => {
    expect(QUIZ_QUESTIONS.map(q => q.id)).toEqual([1, 2, 3, 4]);
  });

  it('Q1 is a word question with all 6 Q1 enum values', () => {
    expect(Q1.type).toBe('word');
    const values = Q1.options.map(o => o.value).sort();
    const expected = [...Q1_ANSWERS].sort();
    expect(values).toEqual(expected);
  });

  it('Q2 is a word question with all 5 Q2 enum values', () => {
    expect(Q2.type).toBe('word');
    const values = Q2.options.map(o => o.value).sort();
    const expected = [...Q2_ANSWERS].sort();
    expect(values).toEqual(expected);
  });

  it('Q3 is an icon question with motif ids that are a strict subset of MOTIF_IDS', () => {
    expect(Q3.type).toBe('icon');
    for (const opt of Q3.options) {
      expect(MOTIF_IDS).toContain(opt.value);
      expect(opt.motifKey).toBe(opt.value);
    }
  });

  it('Q4 is a word question with all 5 Q4 enum values', () => {
    expect(Q4.type).toBe('word');
    const values = Q4.options.map(o => o.value).sort();
    const expected = [...Q4_ANSWERS].sort();
    expect(values).toEqual(expected);
  });

  it('Q1/Q2/Q4 use the word footer; Q3 uses the icon footer', () => {
    expect(Q1.footer).toContain('the word that resonates');
    expect(Q2.footer).toContain('the word that resonates');
    expect(Q3.footer).toContain('the option that resonates');
    expect(Q4.footer).toContain('the word that resonates');
  });

  it('isCompleteAnswers returns false for partial sets', () => {
    expect(isCompleteAnswers({})).toBe(false);
    expect(isCompleteAnswers({ q1: 'curious' })).toBe(false);
    expect(
      isCompleteAnswers({ q1: 'curious', q2: 'clarity', q3: 'spiral' }),
    ).toBe(false);
  });

  it('isCompleteAnswers returns true for a full set', () => {
    expect(
      isCompleteAnswers({
        q1: 'curious',
        q2: 'clarity',
        q3: 'spiral',
        q4: 'insight',
      }),
    ).toBe(true);
  });
});
