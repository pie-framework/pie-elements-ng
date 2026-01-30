// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/configure/src/button.jsx
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

const StyledButton: any = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

const RawButton = ({ className, label, onClick, disabled }) => (
  <StyledButton
    onClick={onClick}
    disabled={disabled}
    className={className}
    size="small"
    variant="contained">
    {label}
  </StyledButton>
);

RawButton.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func,
};

RawButton.defaultProps = {
  className: '',
  disabled: false,
  label: 'Add',
  onClick: () => {},
};

export default RawButton;
