// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/alert-dialog.jsx
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
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDialogTitle: any = styled(DialogTitle)(() => ({
  fontSize: 'max(1.25rem, 18px)',
}));

const StyledDialogContentText: any = styled(DialogContentText)(() => ({
  fontSize: 'max(1rem, 14px)',
}));

const AlertDialog = ({ text, title, onClose, onConfirm, open, onCloseText, onConfirmText, disableAutoFocus, disableEnforceFocus, disableRestoreFocus }) => (
  <Dialog open={open} disableAutoFocus={disableAutoFocus} disableEnforceFocus={disableEnforceFocus} disableRestoreFocus={disableRestoreFocus} onClose={onClose}>
    {title && <StyledDialogTitle>{title}</StyledDialogTitle>}
    {text && (
      <DialogContent>
        <StyledDialogContentText>{text}</StyledDialogContentText>
      </DialogContent>
    )}
    <DialogActions>
      {onClose && (
        <Button onClick={onClose} color="primary">
          {onCloseText}
        </Button>
      )}
      {onConfirm && (
        <Button autoFocus onClick={onConfirm} color="primary">
          {onConfirmText}
        </Button>
      )}
    </DialogActions>
  </Dialog>
);

AlertDialog.defaultProps = {
  onCloseText: 'CANCEL',
  onConfirmText: 'OK',
  disableAutoFocus: false,
  disableEnforceFocus: false,
  disableRestoreFocus: false,
};

AlertDialog.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  title: PropTypes.string,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  open: PropTypes.bool,
  onConfirmText: PropTypes.string,
  onCloseText: PropTypes.string,
  disableAutoFocus: PropTypes.bool,
  disableEnforceFocus: PropTypes.bool,
  disableRestoreFocus: PropTypes.bool,
};

export default AlertDialog;
