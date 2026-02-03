// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/configure/src/button.jsx
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
  marginLeft: 8,
});

const CustomButton = ({ label, onClick, disabled }) => (
  <StyledButton
    onClick={onClick}
    disabled={disabled}
    size="small"
    variant="contained">
    {label}
  </StyledButton>
);

CustomButton.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func,
};

CustomButton.defaultProps = {
  className: '',
  disabled: false,
  label: 'Add',
  onClick: () => { },
};

export default CustomButton;
