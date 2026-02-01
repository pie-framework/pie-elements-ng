// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/components/media/MediaToolbar.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
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

const StyledRoot: any = styled('span')(({ theme }) => ({
  position: 'relative',
  bottom: '5px',
  left: 0,
  width: '100%',
  background: theme.palette.common.white,
  display: 'inline-flex',
  padding: '5px',
  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
}));

const StyledEditContainer: any = styled('span')(({ theme }) => ({
  cursor: 'pointer',
  flex: 3,
  border: `solid ${theme.palette.common.black}`,
  textAlign: 'right',
  borderWidth: '0 2px 0 0',
  marginRight: '5px',
  paddingRight: '5px',
}));

const StyledRemoveContainer: any = styled('span')({
  cursor: 'pointer',
});

class MediaToolbar extends React.Component {
  static propTypes = {
    onEdit: PropTypes.func,
    hideEdit: PropTypes.bool,
    onRemove: PropTypes.func,
  };

  render() {
    const { hideEdit, onEdit, onRemove } = this.props;

    return (
      <StyledRoot>
        {hideEdit ? null : <StyledEditContainer onClick={onEdit}>Edit Settings</StyledEditContainer>}
        <StyledRemoveContainer onClick={onRemove}>Remove</StyledRemoveContainer>
      </StyledRoot>
    );
  }
}

export default MediaToolbar;
