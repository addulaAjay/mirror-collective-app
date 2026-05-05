/**
 * In-memory deterministic mock for the Reflection Room V1 API.
 * Used until Phase 8 backend integration. Same input → same output.
 *
 * Behavior:
 *  - postQuiz: maps (q1..q4) to a motif via a deterministic seeding table
 *    derived from PDF §11 illustrative seeds. If two motifs tie, returns
 *    override_allowed=true with a tied_motifs array.
 *  - getSnapshot: returns 6 loop states seeded by session_id, sorted desc.
 *    The same session_id always returns the same snapshot until practice/
 *    complete mutates the in-memory store.
 *  - recommendPractice: maps (loop, tone) to a fixed practice from a small
 *    in-memory catalog (Figma-confirmed steps for pressure/overwhelm/grief
 *    "low"; breath_4_6 fallback for the rest).
 *  - completePractice: reduces the practiced loop's intensity by 0.10 and
 *    flips tone toward "softening" if helpful=true. Returns the inline
 *    refreshed snapshot.
 *  - setRoomSkin: returns the requested motif with override_allowed=false.
 *
 * Determinism is implemented via a tiny FNV-1a hash on inputs — no Math.random.
 */

import { displayMotifName, displayMotifUpper } from '../copy/strings';
import type {
  IntensityLabel,
  LoopId,
  MotifId,
  ToneState,
} from '../types/ids';
import { LOOP_IDS, TONE_STATES } from '../types/ids';
import type { ReflectionRoomClient } from './client';
import type {
  CompletePracticeRequest,
  CompletePracticeResponse,
  LoopState,
  MotifPayload,
  PracticePayload,
  PracticeType,
  QuizRequest,
  QuizResponse,
  RecommendPracticeRequest,
  RecommendPracticeResponse,
  RoomSkinOverrideRequest,
  RoomSkinOverrideResponse,
  SnapshotResponse,
} from './types';
import { ReflectionRoomApiError } from './types';

// ---------------------------------------------------------------------------
// Determinism helpers
// ---------------------------------------------------------------------------

/** FNV-1a 32-bit. Stable, no deps, sufficient for mock-determinism only. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic float in [0, 1) from a seed. */
function seededFloat(seed: string): number {
  return fnv1a(seed) / 0xffffffff;
}

function intensityLabelFor(score: number): IntensityLabel {
  if (score >= 0.66) return 'High';
  if (score >= 0.33) return 'Medium';
  return 'Low';
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// ---------------------------------------------------------------------------
// Seeding tables
// ---------------------------------------------------------------------------

interface MotifMeta {
  motif_id: MotifId;
  icon: string;
  element: string;
  tone_tag: string;
  why_text: string;
  room_skin: string;
}

const MOTIF_META: Record<MotifId, MotifMeta> = {
  compass: {
    motif_id: 'compass',
    icon: '🧭',
    element: 'Air',
    tone_tag: 'Direction / Orientation',
    why_text: 'You’re finding your bearings. Trust the small course-corrections.',
    room_skin: 'Compass Room',
  },
  mirror: {
    motif_id: 'mirror',
    icon: '🪞',
    element: 'Water',
    tone_tag: 'Reflection / Honesty',
    why_text: 'Today asks for honesty with yourself — not judgment.',
    room_skin: 'Mirror Room',
  },
  blocks: {
    motif_id: 'blocks',
    icon: '🧱',
    element: 'Earth',
    tone_tag: 'Foundation / Boundary',
    why_text: 'You’re building something steady. Let one block sit before adding the next.',
    room_skin: 'Blocks Room',
  },
  spiral: {
    motif_id: 'spiral',
    icon: '🌀',
    element: 'Fire',
    tone_tag: 'Evolution / Integration',
    why_text: 'You’re growing. Even if it feels like you’ve been here before.',
    room_skin: 'Spiral Room',
  },
  feather: {
    motif_id: 'feather',
    icon: '🪶',
    element: 'Air',
    tone_tag: 'Lightness / Release',
    why_text: 'Something heavy is ready to ease. Let it.',
    room_skin: 'Feather Room',
  },
  radiant_burst: {
    motif_id: 'radiant_burst',
    icon: '✨',
    element: 'Fire',
    tone_tag: 'Illumination / Vitality',
    why_text: 'Energy is rising. Aim it at one thing that matters.',
    room_skin: 'Radiant Burst Room',
  },
  waves: {
    motif_id: 'waves',
    icon: '🌊',
    element: 'Water',
    tone_tag: 'Rhythm / Cycles',
    why_text: 'What you feel today will move. Ride it, don’t fight it.',
    room_skin: 'Waves Room',
  },
  pyramid: {
    motif_id: 'pyramid',
    icon: '🔺',
    element: 'Earth',
    tone_tag: 'Stability / Aspiration',
    why_text: 'You’re building toward something. The base matters as much as the peak.',
    room_skin: 'Pyramid Room',
  },
  water_drop: {
    motif_id: 'water_drop',
    icon: '💧',
    element: 'Water',
    tone_tag: 'Stillness / Presence',
    why_text: 'A single, clear moment can change the day. Find one.',
    room_skin: 'Water Drop Room',
  },
  brick_stack: {
    motif_id: 'brick_stack',
    icon: '🧱',
    element: 'Earth',
    tone_tag: 'Patience / Accumulation',
    why_text: 'Small steady acts are doing more than you can see right now.',
    room_skin: 'Brick Stack Room',
  },
  sprout: {
    motif_id: 'sprout',
    icon: '🌱',
    element: 'Earth',
    tone_tag: 'Beginning / Growth',
    why_text: 'You’re at the start of something. Be gentle with what’s emerging.',
    room_skin: 'Sprout Room',
  },
};

function buildMotifPayload(
  motifId: MotifId,
  scores: Record<string, number>,
  explanation: string[],
  overrideAllowed: boolean,
): MotifPayload {
  const meta = MOTIF_META[motifId];
  return {
    motif_id: meta.motif_id,
    motif_name: displayMotifName(meta.motif_id),
    icon: meta.icon,
    element: meta.element,
    tone_tag: meta.tone_tag,
    why_text: meta.why_text,
    room_skin: meta.room_skin,
    scores,
    explanation,
    override_allowed: overrideAllowed,
  };
}

// Deterministic per-loop reflection lines for the mock snapshot.
// Real lines come from the echo_signature_tone_library (Tier 3 #18).
const TONE_LINE: Record<LoopId, Record<ToneState, string>> = {
  pressure: {
    rising: 'Pressure is climbing. You don’t have to meet every demand at full force.',
    steady: 'Pressure is steady. Choose the one thing that needs you most.',
    softening: 'Something in the pressure is loosening. Notice the gap that opens.',
  },
  overwhelm: {
    rising: 'Everything feels like too much at once — start with one breath.',
    steady: 'You’re holding a lot. Set the smallest piece down first.',
    softening: 'The wave is receding. Rest before the next one.',
  },
  grief: {
    rising: 'Something heavy is asking for room. Let it have a moment.',
    steady: 'Grief is here, quietly. You don’t have to fix it today.',
    softening: 'Something in the grief is opening. Notice what feels lighter.',
  },
  self_silencing: {
    rising: 'You’ve been holding back. The smallest true word counts.',
    steady: 'The mute button is on. See if you can lower it by one notch.',
    softening: 'Your voice is finding its way back. Trust the next sentence.',
  },
  agency: {
    rising: 'You’re taking the wheel. Pick one direction and start.',
    steady: 'You have more choice than the day suggests. Use one.',
    softening: 'Your agency is settling. Less force, more aim.',
  },
  transition: {
    rising: 'You’re crossing something. Slow is fine.',
    steady: 'The middle of a change is the longest part. Keep walking.',
    softening: 'A new shape is appearing. Let it be partial for now.',
  },
};

const LOOP_ICON: Record<LoopId, string> = {
  pressure: '🔺',
  overwhelm: '🌊',
  grief: '🌿',
  self_silencing: '🤫',
  agency: '🔑',
  transition: '🌉',
};

// ---------------------------------------------------------------------------
// Quiz → motif scoring (mock — illustrative; PDF §11 has the real seeds)
// ---------------------------------------------------------------------------

const Q1_TO_TAG: Record<string, string[]> = {
  curious: ['evolution'],
  grounded: ['clarity', 'stability'],
  hopeful: ['evolution', 'beginning'],
  heavy: ['lightness'],
  scattered: ['clarity'],
  numb: ['stillness'],
};

const Q2_TO_TAG: Record<string, string[]> = {
  clarity: ['clarity'],
  peace: ['stillness'],
  healing: ['lightness'],
  inspiration: ['evolution'],
  stillness: ['stillness'],
};

const Q3_TO_TAG: Record<MotifId, string[]> = {
  compass: ['clarity'],
  mirror: ['reflection'],
  blocks: ['stability'],
  spiral: ['evolution'],
  feather: ['lightness'],
  radiant_burst: ['illumination'],
  waves: ['rhythm'],
  pyramid: ['stability'],
  water_drop: ['stillness'],
  brick_stack: ['stability'],
  sprout: ['beginning'],
};

const Q4_TO_TAG: Record<string, string[]> = {
  soothing: ['stillness'],
  gentle: ['lightness'],
  insight: ['evolution', 'clarity'],
  direct: ['illumination'],
  presence: ['stillness'],
};

const TAG_TO_MOTIF: Record<string, MotifId> = {
  clarity: 'compass',
  reflection: 'mirror',
  stability: 'blocks',
  evolution: 'spiral',
  lightness: 'feather',
  illumination: 'radiant_burst',
  rhythm: 'waves',
  stillness: 'water_drop',
  beginning: 'sprout',
};

function scoreQuiz(answers: QuizRequest['answers']): {
  scores: Record<string, number>;
  explanation: string[];
} {
  const scores: Record<string, number> = {};
  const explanation: string[] = [];

  function add(tags: string[], weight: number, label: string) {
    for (const tag of tags) {
      scores[tag] = (scores[tag] ?? 0) + weight;
    }
    explanation.push(label);
  }

  add(Q1_TO_TAG[answers.q1] ?? [], 1, `Q1=${answers.q1} (×1)`);
  add(Q2_TO_TAG[answers.q2] ?? [], 1, `Q2=${answers.q2} (×1)`);
  add(Q3_TO_TAG[answers.q3] ?? [], 2, `Q3=${answers.q3} (×2)`);
  add(Q4_TO_TAG[answers.q4] ?? [], 1, `Q4=${answers.q4} (×1)`);

  return { scores, explanation };
}

function pickMotifFromScores(
  scores: Record<string, number>,
  override: string | null,
): { motifId: MotifId; tiedTags: string[]; overrideAllowed: boolean } {
  const entries = Object.entries(scores);
  if (entries.length === 0) {
    // Total quiz collapse — fall back to the spiral motif.
    return { motifId: 'spiral', tiedTags: [], overrideAllowed: false };
  }
  const max = Math.max(...entries.map(([, v]) => v));
  const tiedTags = entries
    .filter(([, v]) => v === max)
    .map(([k]) => k)
    .sort(); // alphabetical for deterministic default winner

  if (override && tiedTags.includes(override)) {
    const motifId = TAG_TO_MOTIF[override];
    if (motifId) return { motifId, tiedTags, overrideAllowed: false };
    throw new ReflectionRoomApiError(
      'OVERRIDE_TAG_NOT_IN_TIE',
      `Override tag "${override}" maps to no motif`,
      409,
    );
  }
  if (override && !tiedTags.includes(override)) {
    throw new ReflectionRoomApiError(
      'OVERRIDE_TAG_NOT_IN_TIE',
      `Override tag "${override}" is not in the tied set [${tiedTags.join(', ')}]`,
      409,
    );
  }

  const winningTag = tiedTags[0];
  const motifId = TAG_TO_MOTIF[winningTag] ?? 'spiral';
  return { motifId, tiedTags, overrideAllowed: tiedTags.length > 1 };
}

// ---------------------------------------------------------------------------
// Snapshot seeding — deterministic per session_id
// ---------------------------------------------------------------------------

interface SessionState {
  session_id: string;
  motif_id: MotifId;
  loops: Record<LoopId, { intensity: number; tone: ToneState; lastSeen: number }>;
}

function buildInitialLoops(sessionId: string): SessionState['loops'] {
  const out = {} as SessionState['loops'];
  LOOP_IDS.forEach((loop, i) => {
    const intensity = clamp01(seededFloat(`${sessionId}|${loop}|score`));
    const toneIdx = fnv1a(`${sessionId}|${loop}|tone`) % TONE_STATES.length;
    out[loop] = {
      intensity,
      tone: TONE_STATES[toneIdx],
      // Stagger last_seen so the UI can show ordering.
      lastSeen: Date.now() - i * 1000 * 60 * 30,
    };
  });
  return out;
}

function snapshotFromState(state: SessionState): SnapshotResponse {
  const loops: LoopState[] = LOOP_IDS.map((loop): LoopState => {
    const entry = state.loops[loop];
    return {
      loop_id: loop,
      tone_state: entry.tone,
      intensity_score: entry.intensity,
      intensity_label: intensityLabelFor(entry.intensity),
      last_seen: new Date(entry.lastSeen).toISOString(),
      recently_changed: false,
      narrative_stage: null,
      icon: LOOP_ICON[loop],
      reflection_line: TONE_LINE[loop][entry.tone],
    };
  }).sort((a, b) => b.intensity_score - a.intensity_score);

  return {
    session_id: state.session_id,
    motif_context: {
      motif_id: state.motif_id,
      room_skin: MOTIF_META[state.motif_id].room_skin,
    },
    loops,
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Practice catalog (mock)
// ---------------------------------------------------------------------------

interface PracticeRecipe {
  id: string;
  title: string;
  type: PracticeType;
  duration_sec: number;
  steps: string[];
}

// Figma-confirmed practice content (08_FIGMA_ALIGNMENT_DELTA.md §6.5).
const PRACTICES: Record<string, PracticeRecipe> = {
  breath_4_6: {
    id: 'breath_4_6',
    title: 'Ease Pressure',
    type: 'breath',
    duration_sec: 90,
    steps: [
      'Inhale for 4.',
      'Exhale for 6.',
      'Repeat three more times.',
    ],
  },
  box_breath: {
    id: 'box_breath',
    title: 'Ease Overwhelm',
    type: 'breath',
    duration_sec: 90,
    steps: [
      'Inhale 4 — Hold 4',
      'Exhale 4 — Hold 4',
      'Repeat twice',
    ],
  },
  hand_to_heart: {
    id: 'hand_to_heart',
    title: 'Soften Grief',
    type: 'somatic',
    duration_sec: 90,
    steps: [
      'Hand to heart.',
      'Inhale 4, exhale 6 ×3.',
      'Whisper: “I allow myself to soften.”',
    ],
  },
  // Generic non-breath fallback for users with no_breathwork=true.
  name_and_need: {
    id: 'name_and_need',
    title: 'Name and Need',
    type: 'cognitive',
    duration_sec: 90,
    steps: [
      'Name what you’re feeling, in one word.',
      'Name what you need, in one word.',
      'Take three slow breaths.',
    ],
  },
};

const RULE_FOR_LOOP: Record<LoopId, string> = {
  pressure: 'pressure_loop_v1',
  overwhelm: 'overwhelm_loop_v1',
  grief: 'grief_loop_v1',
  self_silencing: 'self_silencing_v1',
  agency: 'agency_key_low_v1',
  transition: 'transition_bridge_v1',
};

function practiceForLoop(loopId: LoopId): PracticeRecipe {
  if (loopId === 'pressure') return PRACTICES.breath_4_6;
  if (loopId === 'overwhelm') return PRACTICES.box_breath;
  if (loopId === 'grief') return PRACTICES.hand_to_heart;
  // self_silencing / agency / transition — V1 fallback default per §11.3.
  return PRACTICES.breath_4_6;
}

// ---------------------------------------------------------------------------
// Mock client
// ---------------------------------------------------------------------------

export class MockReflectionRoomClient implements ReflectionRoomClient {
  private readonly sessions = new Map<string, SessionState>();
  private completionCounter = 0;

  /** Test-only — clear all sessions between cases. */
  reset(): void {
    this.sessions.clear();
    this.completionCounter = 0;
  }

  /** Test-only — preview deterministic snapshot without mutation. */
  snapshotPreview(sessionId: string): SnapshotResponse | null {
    const state = this.sessions.get(sessionId);
    return state ? snapshotFromState(state) : null;
  }

  async postQuiz(req: QuizRequest): Promise<QuizResponse> {
    const { scores, explanation } = scoreQuiz(req.answers);
    const { motifId, tiedTags, overrideAllowed } = pickMotifFromScores(
      scores,
      req.user_override_tag,
    );

    // Deterministic session id from inputs (or reuse the one passed in).
    const sessionId =
      req.session_id ??
      `mock-session-${fnv1a(JSON.stringify(req.answers)).toString(16)}`;

    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        session_id: sessionId,
        motif_id: motifId,
        loops: buildInitialLoops(sessionId),
      });
    } else if (req.user_override_tag) {
      // Tie resolution: user picked — update the stored motif.
      const state = this.sessions.get(sessionId)!;
      state.motif_id = motifId;
    }

    const motif = buildMotifPayload(motifId, scores, explanation, overrideAllowed);
    const tied_motifs = overrideAllowed
      ? tiedTags.map(tag =>
          buildMotifPayload(
            TAG_TO_MOTIF[tag] ?? motifId,
            scores,
            explanation,
            true,
          ),
        )
      : null;

    return { session_id: sessionId, motif, tied_motifs };
  }

  async getSnapshot(sessionId: string): Promise<SnapshotResponse> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new ReflectionRoomApiError(
        'SESSION_NOT_FOUND',
        `No mock session for id "${sessionId}"`,
        404,
      );
    }
    return snapshotFromState(state);
  }

  async recommendPractice(
    req: RecommendPracticeRequest,
  ): Promise<RecommendPracticeResponse> {
    const state = this.sessions.get(req.session_id);
    if (!state) {
      throw new ReflectionRoomApiError(
        'SESSION_NOT_FOUND',
        `No mock session for id "${req.session_id}"`,
        404,
      );
    }
    const top = LOOP_IDS.map(l => ({ loop: l, ...state.loops[l] })).sort(
      (a, b) => b.intensity - a.intensity,
    );
    const loopId = req.selected_loop ?? top[0]?.loop ?? null;
    if (loopId == null) {
      throw new ReflectionRoomApiError(
        'NO_ACTIVE_LOOPS',
        'Snapshot is empty — no loop to recommend',
        404,
      );
    }
    const entry = state.loops[loopId];
    const recipe = practiceForLoop(loopId);

    return {
      pattern: {
        loop_id: loopId,
        strength: entry.intensity,
        trend: entry.tone,
        last_seen: new Date(entry.lastSeen).toISOString(),
      },
      practice: {
        id: recipe.id,
        title: recipe.title,
        type: recipe.type,
        duration_sec: recipe.duration_sec,
        steps: [...recipe.steps],
      },
      rule_id: RULE_FOR_LOOP[loopId],
    };
  }

  async completePractice(
    req: CompletePracticeRequest,
  ): Promise<CompletePracticeResponse> {
    const state = this.sessions.get(req.session_id);
    if (!state) {
      throw new ReflectionRoomApiError(
        'SESSION_NOT_FOUND',
        `No mock session for id "${req.session_id}"`,
        404,
      );
    }
    const entry = state.loops[req.loop_id];
    if (entry) {
      // Reduce intensity by 0.10 on any completion.
      entry.intensity = clamp01(entry.intensity - 0.1);
      entry.lastSeen = Date.now();
      // helpful=true → tone steps toward softening (per §10 Q3 spec assumption).
      if (req.helpful === true) {
        entry.tone = entry.tone === 'rising' ? 'steady' : 'softening';
      }
    }

    this.completionCounter += 1;
    const completionId = `${new Date().toISOString()}#mock-${this.completionCounter}`;

    return {
      completion_id: completionId,
      snapshot: snapshotFromState(state),
    };
  }

  async setRoomSkin(
    req: RoomSkinOverrideRequest,
  ): Promise<RoomSkinOverrideResponse> {
    // Find the most recent session if any; otherwise mint one.
    const lastSession = [...this.sessions.values()].at(-1);
    const sessionId =
      lastSession?.session_id ??
      `mock-session-room-${fnv1a(req.motif_id).toString(16)}`;
    const state =
      lastSession ??
      ({
        session_id: sessionId,
        motif_id: req.motif_id,
        loops: buildInitialLoops(sessionId),
      } as SessionState);

    state.motif_id = req.motif_id;
    this.sessions.set(sessionId, state);

    return {
      session_id: sessionId,
      motif: buildMotifPayload(req.motif_id, {}, [`override → ${displayMotifUpper(req.motif_id)}`], false),
      applied_to: req.apply_to,
    };
  }
}
