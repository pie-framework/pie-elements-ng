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
  // The check sits on the editable-html toolbar's #efefef, which no theme changes, or on
  // `--pie-background` when the background is hidden. #388E3C clears 3:1 against #efefef, white,
  // both hover fills and the dark theme's background (WCAG 1.4.11).
  color: '#388E3C',
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
