/**
 * Figma Code Connect — CauseIcon
 *
 * TODO: Replace NODE_URL with the cause-icon component set from
 * Design-Master-File (Mirror Pledge → cause icons).
 *
 * The 7 variants in code map to a single Figma component with a `Type`
 * property — once linked, the MCP returns this exact mapping when the
 * cause-icon node is selected.
 */
import figma from '@figma/code-connect';
import React from 'react';

import CauseIcon from './CauseIcon';

const NODE_URL =
  'https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=TODO-CAUSE-ICON';

figma.connect(CauseIcon, NODE_URL, {
  props: {
    type: figma.enum('Type', {
      'Women + Cancer': 'women-cancer',
      'Animal Welfare': 'animal-welfare',
      'Mental Health': 'mental-health',
      'Environment': 'environment',
      'Women + Children': 'women-children',
      'Education': 'education',
      'Human Rights': 'human-rights',
    }),
  },
  example: ({ type }) => <CauseIcon type={type} />,
});
