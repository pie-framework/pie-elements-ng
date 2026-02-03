// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/configure/src/button.jsx
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
