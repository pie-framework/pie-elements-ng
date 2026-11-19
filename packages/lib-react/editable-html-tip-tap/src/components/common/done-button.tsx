// @ts-nocheck

import React, { useReducer } from 'react';

import IconButton from '@mui/material/IconButton';
import Check from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { color } from '@pie-lib/render-ui';
import { catalogs } from '../../i18n/index.js';

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

export const RawDoneButton = ({ onClick, doneButtonRef, language }) => {
  // Re-renders once the language's catalog lands, for an element that did not preload it.
  const [, relabel] = useReducer((version) => version + 1, 0);

  return (
    <StyledIconButton
      aria-label={catalogs.forLocale(language, relabel).t('buttons.done')}
      buttonRef={doneButtonRef}
      onClick={onClick}
    >
      <Check />
    </StyledIconButton>
  );
};

RawDoneButton.propTypes = {
  onClick: PropTypes.func,
  doneButtonRef: PropTypes.func,
  /** The item language, which the button's name follows. */
  language: PropTypes.string,
};

export const DoneButton = RawDoneButton;
