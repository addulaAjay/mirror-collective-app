/**
 * Figma Code Connect — OptionsButton
 *
 * TODO: Replace NODE_URL with the option-button node from Design-Master-File
 * (likely the QuizQuestions option pill). Find via Dev Mode → Copy link to selection.
 */
import figma from '@figma/code-connect';
import React from 'react';

import OptionsButton from './OptionsButton';

const NODE_URL =
  'https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=TODO-OPTIONS-BUTTON';

figma.connect(OptionsButton, NODE_URL, {
  props: {
    label: figma.string('Label'),
    selected: figma.boolean('Selected'),
  },
  example: ({ label, selected }) => (
    <OptionsButton label={label} selected={selected} onPress={() => {}} />
  ),
});
