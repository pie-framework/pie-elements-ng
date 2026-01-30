// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/components/common/done-button.jsx
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

import IconButton from '@mui/material/IconButton';
import Check from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

const StyledIconButton: any = styled(IconButton)({
  verticalAlign: 'top',
  width: '28px',
  height: '28px',
  color: 'var(--editable-html-toolbar-check, #00bb00)',
  padding: '4px',
});

export const RawDoneButton = ({ onClick, doneButtonRef }) => (
  <StyledIconButton aria-label="Done" buttonRef={doneButtonRef} onClick={onClick}>
    <Check />
  </StyledIconButton>
);

RawDoneButton.propTypes = {
  onClick: PropTypes.func,
  doneButtonRef: PropTypes.func,
};

export const DoneButton = RawDoneButton;
