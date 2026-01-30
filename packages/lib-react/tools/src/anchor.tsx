// @ts-nocheck
/**
 * @synced-from pie-lib/packages/tools/src/anchor.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';

const StyledAnchor: any = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  width: '20px',
  height: '20px',
  position: 'absolute',
  borderRadius: '10px',
  backgroundColor: `var(--ruler-bg, ${theme.palette.primary.contrastText})`,
  transition: 'background-color 200ms ease-in',
  border: `solid 1px var(--ruler-stroke, ${theme.palette.primary.dark})`,
  '&:hover': {
    backgroundColor: `var(--ruler-bg-hover, ${theme.palette.primary.light})`,
  },
}));

const Anchor = ({ ...props }) => <StyledAnchor {...props} />;

export default Anchor;
