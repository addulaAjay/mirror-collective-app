/**
 * Echo-Map node SVG mapping (large 100×100 glyphs) per loop_id.
 * Sourced from `reflection-room-ech0-map-assets`. The 6th V1 loop
 * (`transition`) doesn't have a dedicated icon yet — Tier 3 design ask;
 * see Phase 9 for the placeholder swap.
 */

import {
  AGENCY_NODE_SVG,
  GRIEF_NODE_SVG,
  OVERWHELM_NODE_SVG,
  PRESSURE_NODE_SVG,
  SELF_SILENCING_NODE_SVG,
} from '@assets/reflection-room-ech0-map-assets/ReflectionRoomEchoMapAssets';

import type { LoopId } from '../types/ids';

const TRANSITION_NODE_PLACEHOLDER_SVG = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="44" stroke="#f2e2b1" stroke-width="2" stroke-dasharray="6 4" fill="none" opacity="0.7"/>
  <path d="M28 50 L72 50 M62 40 L72 50 L62 60" stroke="#f2e2b1" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

const NODE_SVG: Record<LoopId, string> = {
  pressure: PRESSURE_NODE_SVG,
  overwhelm: OVERWHELM_NODE_SVG,
  grief: GRIEF_NODE_SVG,
  self_silencing: SELF_SILENCING_NODE_SVG,
  agency: AGENCY_NODE_SVG,
  transition: TRANSITION_NODE_PLACEHOLDER_SVG,
};

export function loopNodeXml(loopId: LoopId): string {
  return NODE_SVG[loopId];
}
