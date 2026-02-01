// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/components/characters/custom-popper.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';

const StyledPopper: any = styled(Popper)({
  background: '#fff',
  padding: '10px',
  pointerEvents: 'none',
  zIndex: 99999,
});

const StyledTypography: any = styled(Typography)({
  fontSize: 50,
  textAlign: 'center',
});

const CustomPopper = ({ children, ...props }) => (
  <StyledPopper
    id="mouse-over-popover"
    open
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'left',
    }}
    disableRestoreFocus
    disableAutoFocus
    {...props}
  >
    <StyledTypography>{children}</StyledTypography>
  </StyledPopper>
);

export default CustomPopper;
