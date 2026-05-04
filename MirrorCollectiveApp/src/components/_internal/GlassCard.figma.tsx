/**
 * Figma Code Connect — GlassCard
 *
 * TODO: Replace NODE_URL with the real card surface node from
 * Design-Master-File. To find it: open Figma → select the card surface →
 * Dev Mode → "Copy link to selection". Then update the URL below and run:
 *   npx figma connect parse
 */
import figma from '@figma/code-connect';
import React from 'react';

import GlassCard from './GlassCard';

const NODE_URL =
  'https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=TODO-GLASSCARD';

figma.connect(GlassCard, NODE_URL, {
  props: {
    children: figma.children('*'),
  },
  example: ({ children }) => <GlassCard>{children}</GlassCard>,
});
