/**
 * Figma Code Connect — ProgressBar
 * Source node: MC-Component-Library → Component 7 (node 2:2)
 *
 * Figma exposes 11 discrete variants via the `Property 1` enum
 * (0%, 10%, 20%, ..., 100%). In code we expose continuous progress
 * as a 0..1 number — the mapping below picks a sensible value for
 * each preview variant.
 */
import figma from '@figma/code-connect';
import React from 'react';

import ProgressBar from './ProgressBar';

const NODE_URL =
  'https://www.figma.com/design/qhHkoRlenVWZ03nkGi9LEp/MC-Component-Library?node-id=2-2';

figma.connect(ProgressBar, NODE_URL, {
  props: {
    progress: figma.enum('Property 1', {
      '0%':   0,
      '10%':  0.1,
      '20%':  0.2,
      '30%':  0.3,
      '40%':  0.4,
      '50%':  0.5,
      '60%':  0.6,
      '70%':  0.7,
      '80%':  0.8,
      '90%':  0.9,
      '100%': 1,
    }),
  },
  example: ({ progress }) => <ProgressBar progress={progress} />,
});
