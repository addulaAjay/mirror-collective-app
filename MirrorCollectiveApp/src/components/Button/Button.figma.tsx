/**
 * Figma Code Connect — Button
 * Source node: Design-Master-File → MC Component Library → Button (125:440)
 *
 * After editing, publish with:
 *   FIGMA_ACCESS_TOKEN=$(security find-generic-password -s figma-personal -w) \
 *     npx figma connect publish
 */
import figma from '@figma/code-connect';
import React from 'react';

import Button from './Button';

const NODE_URL =
  'https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=125-440';

// MC Library variants — primary | secondary | link
figma.connect(Button, NODE_URL, {
  variant: { Variant: 'Primary' },
  props: {
    title: figma.string('Label'),
    size: figma.enum('Size', { L: 'L', S: 'S' }),
    active: figma.boolean('Active'),
  },
  example: ({ title, size, active }) => (
    <Button
      variant="primary"
      title={title}
      size={size}
      active={active}
      onPress={() => {}}
    />
  ),
});

figma.connect(Button, NODE_URL, {
  variant: { Variant: 'Secondary' },
  props: {
    title: figma.string('Label'),
    size: figma.enum('Size', { L: 'L', S: 'S' }),
    active: figma.boolean('Active'),
  },
  example: ({ title, size, active }) => (
    <Button
      variant="secondary"
      title={title}
      size={size}
      active={active}
      onPress={() => {}}
    />
  ),
});

figma.connect(Button, NODE_URL, {
  variant: { Variant: 'Link' },
  props: {
    title: figma.string('Label'),
  },
  example: ({ title }) => (
    <Button variant="link" title={title} onPress={() => {}} />
  ),
});
