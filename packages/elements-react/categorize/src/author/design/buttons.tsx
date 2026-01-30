// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/design/buttons.jsx
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

const StyledAddButton: any = styled(Button)(({ theme }) => ({
  height: theme.spacing(4),
}));

export class RawAddButton extends React.Component {
  static propTypes = {
    label: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
  };

  static defaultProps = {
    label: 'Add',
  };

  render() {
    const { label, onClick, disabled } = this.props;
    return (
      <StyledAddButton
        onClick={onClick}
        disabled={disabled}
        size="small"
        variant="contained"
        color="primary"
      >
        {label}
      </StyledAddButton>
    );
  }
}

const AddButton = RawAddButton;

const StyledDeleteButton: any = styled(Button)({
  margin: 0,
  padding: 0,
});

const DeleteButton = ({ label, onClick, disabled }) => (
  <StyledDeleteButton onClick={onClick} size="small" color="primary" disabled={disabled}>
    {label}
  </StyledDeleteButton>
);

export { AddButton, DeleteButton };
