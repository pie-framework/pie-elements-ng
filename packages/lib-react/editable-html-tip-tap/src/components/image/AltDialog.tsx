// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/components/image/AltDialog.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import DialogContent from '@mui/material/DialogContent';
import ArrowBackIos from '@mui/icons-material/ArrowBackIos';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import PropTypes from 'prop-types';

export class AltDialog extends React.Component {
  static propTypes = {
    onDone: PropTypes.func.isRequired,
    alt: PropTypes.string,
  };

  constructor(props) {
    super(props);

    const { alt } = props;

    this.state = {
      value: alt,
    };
  }

  closeDialog: any = () => {
    const allDialogs = document.querySelectorAll('#text-dialog');

    allDialogs.forEach(function(s) {
      return s.remove();
    });
  };

  onDone: any = () => {
    const { onDone } = this.props;
    const { value } = this.state;

    onDone(value);
    this.closeDialog();
  };

  handleOverflow: any = () => {
    document.body.style.removeProperty('overflow');
  };

  render() {
    const { value } = this.state;

    return (
      <Dialog
        open
        disablePortal
        onClose={this.closeDialog}
        id="text-dialog"
        hideBackdrop
        disableScrollLock
        onEntered={this.handleOverflow}
      >
        <DialogContent>
          <div style={{ display: 'flex' }}>
            <ArrowBackIos style={{ paddingTop: '6px' }} />
            <TextField
              multiline
              placeholder={'Enter an Alt Text description of this image'}
              helperText={
                'Users with visual limitations rely on Alt Text, since screen readers cannot otherwise describe the contents of an image.'
              }
              value={value}
              onChange={(event) => this.setState({ value: event.target.value })}
              FormHelperTextProps={{ style: { fontSize: 14 } }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.onDone}>Done</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default AltDialog;
