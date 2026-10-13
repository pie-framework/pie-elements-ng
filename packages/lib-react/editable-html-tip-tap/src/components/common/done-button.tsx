// @ts-nocheck

import React from 'react';

import IconButton from '@mui/material/IconButton';
import Check from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { color } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

const StyledIconButton: any = styled(IconButton)({
  verticalAlign: 'top',
  width: '28px',
  height: '28px',
  // The check always sits on the toolbar fill, which mixes into `--pie-background`, so it takes the
  // scheme's correct-icon colour; every preset and scheme clears 3:1 on that fill and its hover
  // (WCAG 1.4.11). Hosts can still set `--editable-html-toolbar-check`.
  color: `var(--editable-html-toolbar-check, ${color.correctWithIcon()})`,
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
