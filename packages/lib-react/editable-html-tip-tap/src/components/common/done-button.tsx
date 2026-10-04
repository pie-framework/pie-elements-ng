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
  color: 'var(--editable-html-toolbar-check, #00bb00)',
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
