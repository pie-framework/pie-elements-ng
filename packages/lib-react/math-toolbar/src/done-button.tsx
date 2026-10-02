// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-toolbar/src/done-button.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';

import IconButton from '@mui/material/IconButton';
import Check from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { color } from '@pie-lib/render-ui';

const StyledIconButton: any = styled(IconButton)(({ hideBackground }) => ({
  verticalAlign: 'top',
  width: '28px',
  height: '28px',
  color: '#00bb00',
  ...(hideBackground && {
    // `--pie-white` inverts with the scheme where `common.white` did not, so the
    // button keeps reading as raised against the toolbar instead of staying a
    // white chip on a dark surface.
    backgroundColor: color.white(),
    '&:hover': {
      backgroundColor: color.backgroundDark(),
    },
  }),
  '& .MuiIconButton-label': {
    position: 'absolute',
    top: '2px',
  },
}));

export const RawDoneButton = ({ onClick, hideBackground }) => (
  <StyledIconButton aria-label="Done" onClick={onClick} hideBackground={hideBackground} size="large">
    <Check />
  </StyledIconButton>
);

RawDoneButton.propTypes = {
  onClick: PropTypes.func,
  hideBackground: PropTypes.bool,
};

export const DoneButton = RawDoneButton;
