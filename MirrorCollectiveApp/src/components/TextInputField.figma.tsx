/**
 * Figma Code Connect — TextInputField
 * Source node: Design-Master-File → MC Component Library → TextField (147:967)
 */
import figma from '@figma/code-connect';
import React from 'react';

import TextInputField from './TextInputField';

const NODE_URL =
  'https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=147-967';

figma.connect(TextInputField, NODE_URL, {
  props: {
    label: figma.string('Label'),
    helperText: figma.string('Helper text'),
    placeholder: figma.string('Placeholder'),
    size: figma.enum('Size', { S: 'S', M: 'M', L: 'L' }),
    secureTextEntry: figma.boolean('Secure'),
  },
  example: ({ label, helperText, placeholder, size, secureTextEntry }) => (
    <TextInputField
      label={label}
      helperText={helperText}
      placeholder={placeholder}
      size={size}
      secureTextEntry={secureTextEntry}
    />
  ),
});
