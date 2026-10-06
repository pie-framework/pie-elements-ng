// @ts-nocheck

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
  // Clears 3:1 on the editable-html toolbar and the math Correct Answer card in every scheme (WCAG 1.4.11).
  color: color.correctWithIcon(),
  ...(hideBackground && {
    // `--pie-background` follows both the colour schemes and the dark theme; `--pie-white`
    // stays white under the dark theme. White keeps the button opaque when no theme is set.
    backgroundColor: color.v('pie')('background', color.defaults.WHITE),
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
