/**
 * Loop-id → SVG mapping for Echo Signature cards and Echo Map per-loop
 * overlays. Sourced from the existing `reflection-room-ech0-map-assets`
 * pack. The 6th V1 loop (`transition`) doesn't have a dedicated icon yet
 * (Tier 3 design ask) — fall back to a generic placeholder until the
 * design ships.
 */

import {
  AGENCY_ICON_SVG,
  GRIEF_ICON_SVG,
  OVERWHELM_ICON_SVG,
  PRESSURE_ICON_SVG,
  SELF_SILENCING_ICON_SVG,
} from '@assets/reflection-room-ech0-map-assets/ReflectionRoomEchoMapAssets';

import type { LoopId } from '../types/ids';

// Generic placeholder for `transition` until the dedicated icon ships.
// Same outer 100×100 viewBox so it slots into the existing card layout.
const TRANSITION_PLACEHOLDER_SVG = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="36" stroke="#f2e2b1" stroke-width="2" stroke-dasharray="6 4" fill="none" opacity="0.6"/>
  <path d="M30 50 L70 50 M62 42 L70 50 L62 58" stroke="#f2e2b1" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

const LOOP_ICON_SVG: Record<LoopId, string> = {
  pressure: PRESSURE_ICON_SVG,
  overwhelm: OVERWHELM_ICON_SVG,
  grief: GRIEF_ICON_SVG,
  self_silencing: SELF_SILENCING_ICON_SVG,
  agency: AGENCY_ICON_SVG,
  transition: TRANSITION_PLACEHOLDER_SVG,
};

export function loopIconXml(loopId: LoopId): string {
  return LOOP_ICON_SVG[loopId];
}
