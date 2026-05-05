/**
 * Reflection Room — navigation route names and flow order.
 *
 * Maps to the Reflection Room section in the Design Master File (e.g. node 243-1359).
 * Live Figma MCP enumeration was skipped (auth unavailable); this list matches
 * DESIGN_SYSTEM_MIGRATION_COMPLETE.md and the Reflection Room screens registered in App.tsx.
 *
 * Legacy: src/screens/ReflectionRoomCommingsoonScreen.tsx — “coming soon” placeholder, unwired;
 * the shipped flow starts at ReflectionRoom (landing).
 */

/** Ordered user journey through Reflection Room (happy path). */
export const REFLECTION_ROOM_FLOW_ORDER = [
  'ReflectionRoom',
  'ReflectionRoomQuiz',
  'ReflectionRoomLoading',
  'ReflectionRoomTodaysMotif',
  'ReflectionRoomEchoSignature',
  'ReflectionRoomEchoMap',
  'ReflectionRoomMirrorMoment',
  'ReflectionRoomCore',
] as const;

export type ReflectionRoomFlowRoute = (typeof REFLECTION_ROOM_FLOW_ORDER)[number];

/**
 * Gap analysis (repo-only): eight routes below cover the full Reflection Room product flow.
 * Modal overlays (info sheets on Landing / Echo Map, practice popups) are in-screen, not routes.
 */
/** Human-readable labels for parity checks vs Figma frame titles. */
export const REFLECTION_ROOM_ROUTE_LABELS: Record<ReflectionRoomFlowRoute, string> = {
  ReflectionRoom: 'Reflection Room — Landing',
  ReflectionRoomQuiz: 'Reflection Room — Quiz',
  ReflectionRoomLoading: 'Reflection Room — Loading / Tuning',
  ReflectionRoomTodaysMotif: "Reflection Room — Today's Motif",
  ReflectionRoomEchoSignature: 'Reflection Room — Echo Signature',
  ReflectionRoomEchoMap: 'Reflection Room — Echo Map',
  ReflectionRoomMirrorMoment: 'Reflection Room — Mirror Moment',
  ReflectionRoomCore: 'Reflection Room — Core / Hub',
};
