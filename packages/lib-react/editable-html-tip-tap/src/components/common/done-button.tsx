// @ts-nocheck

import React from 'react';

import IconButton from '@mui/material/IconButton';
import Check from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

const StyledIconButton: any = styled(IconButton)({
  verticalAlign: 'top',
  width: '28px',
  height: '28px',
  // The check sits on the toolbar fill: #efefef over a white background, darker under a dark theme.
  // #388E3C clears 3:1 against both and their hover fills (3.58:1 on #efefef, 3.40:1 on the dark
  // preset's #272c36; WCAG 1.4.11); hosts can still set `--editable-html-toolbar-check`.
  color: 'var(--editable-html-toolbar-check, #388E3C)',
  padding: '4px',
});

export const RawDoneButton = ({ onClick, doneButtonRef, language }) => (
  <StyledIconButton
    aria-label={translator.t('editableHtml.buttons.done', { lng: language })}
    buttonRef={doneButtonRef}
    onClick={onClick}
  >
    <Check />
  </StyledIconButton>
);

RawDoneButton.propTypes = {
  onClick: PropTypes.func,
  doneButtonRef: PropTypes.func,
  /** The item language, which the button's name follows. */
  language: PropTypes.string,
};

export const DoneButton = RawDoneButton;
