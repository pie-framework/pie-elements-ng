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
  // Keyboard focus shows as the THEMING.md focus ring, not the pulsing focus ripple: an animation
  // must not be what shows focus.
  '&.Mui-focusVisible': {
    outline: `4px solid ${color.focusOutline()}`,
    outlineOffset: '-4px',
  },
  '& .MuiIconButton-label': {
    position: 'absolute',
    top: '2px',
  },
}));

export const RawDoneButton = ({ onClick, hideBackground }) => (
  <StyledIconButton
    aria-label="Done"
    onClick={onClick}
    hideBackground={hideBackground}
    size="large"
    disableFocusRipple
  >
    <Check />
  </StyledIconButton>
);

RawDoneButton.propTypes = {
  onClick: PropTypes.func,
  hideBackground: PropTypes.bool,
};

export const DoneButton = RawDoneButton;
