// @ts-nocheck
/**
 * @synced-from pie-elements/packages/match/configure/src/add-row.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import AddButton from '@mui/icons-material/Add';

const StyledButton: any = styled(Button)({
  display: 'flex',
  alignSelf: 'flex-start',
  margin: 0,
});

const StyledAddButton: any = styled(AddButton)(({ theme }) => ({
  marginRight: theme.spacing(0.5),
}));

export class AddRowButton extends React.Component {
  static propTypes = {
    onAddClick: PropTypes.func.isRequired,
  };

  render() {
    const { onAddClick } = this.props;

    return (
      <StyledButton disabled={false} onClick={onAddClick}>
        <StyledAddButton />
        Add Another Row
      </StyledButton>
    );
  }
}

export default AddRowButton;
