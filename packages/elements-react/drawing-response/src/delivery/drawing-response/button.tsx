// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/button.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

const StyledButton: any = styled(Button)({
  fontSize: '0.9em',
  marginLeft: 8,
  minWidth: 32,
  height: 32,

  '& span': {
    '& svg': {
      width: '1.3em !important',
      height: '1.3em !important',
    },
  },
});

const CustomButton = ({ label, onClick, disabled, title }) => (
  <StyledButton
    title={title}
    onClick={onClick}
    disabled={disabled}
    size="small"
    variant="contained">
    {label}
  </StyledButton>
);

CustomButton.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onClick: PropTypes.func,
  title: PropTypes.string,
};

CustomButton.defaultProps = {
  disabled: false,
  label: 'Add',
  onClick: () => {},
  title: '',
};

export default CustomButton;
