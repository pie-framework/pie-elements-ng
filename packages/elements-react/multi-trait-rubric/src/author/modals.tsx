// @ts-nocheck
/**
 * @synced-from pie-elements/packages/multi-trait-rubric/configure/src/modals.jsx
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import { color } from '@pie-lib/render-ui';

import defaults from './defaults';

const {
  configuration: {
    excludeZeroDialogBoxContent,
    includeZeroDialogBoxContent,
    deleteScaleDialogBoxContent,
    maxPointsDialogBoxContent,
  },
} = defaults;

export const excludeZeroTypes = {
  remove0: 'remove0',
  add0: 'add0',
  shiftLeft: 'shiftLeft',
  shiftRight: 'shiftRight',
};

const StyledDialog: any = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    padding: theme.spacing(2.5),
  },
}));

const StyledDialogTitle: any = styled(DialogTitle)(({ theme }) => ({
  padding: `0 0 ${theme.spacing(2)} 0`,

  '& h2': {
    fontSize: '20px',
    lineHeight: '23px',
    fontFamily: 'Cerebri Sans',
    color: color.text(),
  },
}));

const StyledDialogContent: any = styled(DialogContent)(({ theme }) => ({
  paddingLeft: '0',

  '& p': {
    fontSize: theme.typography.fontSize + 2,
    fontFamily: 'Cerebri Sans',
    color: color.text(),
  },
}));

const StyledButton: any = styled(Button)(({ theme }) => ({
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  borderRadius: '4px',
  fontSize: theme.typography.fontSize,
  fontFamily: 'Cerebri Sans',
  lineHeight: '14px',
  textTransform: 'none',
  background: color.primary(),
  color: theme.palette.common.white,
}));

const CancelButton: any = styled(StyledButton)({
  background: color.secondaryBackground(),
  color: color.text(),
});

const ExcludeZeroDialog = ({ open, changeExcludeZero, cancel }) => (
  <StyledDialog open={open}>
    <StyledDialogTitle>{excludeZeroDialogBoxContent.title}</StyledDialogTitle>

    <StyledDialogContent>
      <DialogContentText>
        <div dangerouslySetInnerHTML={{ __html: excludeZeroDialogBoxContent.text }} />
      </DialogContentText>
    </StyledDialogContent>

    <DialogActions>
      <CancelButton onClick={() => cancel()}>
        Cancel
      </CancelButton>

      <StyledButton onClick={() => changeExcludeZero(excludeZeroTypes.shiftLeft)}>
        Shift to Left
      </StyledButton>

      <StyledButton onClick={() => changeExcludeZero(excludeZeroTypes.remove0)}>
        Remove 0 column
      </StyledButton>
    </DialogActions>
  </StyledDialog>
);

ExcludeZeroDialog.propTypes = {
  open: PropTypes.bool,
  changeExcludeZero: PropTypes.func,
  cancel: PropTypes.func,
};

const IncludeZeroDialog = ({ open, changeExcludeZero, cancel }) => (
  <StyledDialog open={open}>
    <StyledDialogTitle>{includeZeroDialogBoxContent.title}</StyledDialogTitle>

    <StyledDialogContent>
      <DialogContentText>
        <div dangerouslySetInnerHTML={{ __html: includeZeroDialogBoxContent.text }} />
      </DialogContentText>
    </StyledDialogContent>

    <DialogActions>
      <CancelButton onClick={() => cancel()}>
        Cancel
      </CancelButton>

      <StyledButton onClick={() => changeExcludeZero(excludeZeroTypes.shiftRight)}>
        Shift to Right
      </StyledButton>

      <StyledButton onClick={() => changeExcludeZero(excludeZeroTypes.add0)}>
        Add 0 column
      </StyledButton>
    </DialogActions>
  </StyledDialog>
);

IncludeZeroDialog.propTypes = {
  open: PropTypes.bool,
  changeExcludeZero: PropTypes.func,
  cancel: PropTypes.func,
};

const DecreaseMaxPoints = ({ open, deleteScorePoints, cancel }) => (
  <StyledDialog open={open}>
    <StyledDialogTitle>{maxPointsDialogBoxContent.title}</StyledDialogTitle>

    <StyledDialogContent>
      <DialogContentText>
        <div dangerouslySetInnerHTML={{ __html: maxPointsDialogBoxContent.text }} />
      </DialogContentText>
    </StyledDialogContent>

    <DialogActions>
      <CancelButton onClick={cancel}>
        Cancel
      </CancelButton>

      <StyledButton onClick={deleteScorePoints}>
        Confirm
      </StyledButton>
    </DialogActions>
  </StyledDialog>
);

DecreaseMaxPoints.propTypes = {
  open: PropTypes.bool,
  deleteScorePoints: PropTypes.func,
  cancel: PropTypes.func,
};

const DeleteScale = ({ open, scaleIndex, deleteScale, cancel }) => (
  <StyledDialog open={open}>
    <StyledDialogTitle>
      {`${deleteScaleDialogBoxContent.title} #${scaleIndex + 1}`}
    </StyledDialogTitle>

    <StyledDialogContent>
      <DialogContentText>
        <div dangerouslySetInnerHTML={{ __html: deleteScaleDialogBoxContent.text }} />
      </DialogContentText>
    </StyledDialogContent>

    <DialogActions>
      <CancelButton onClick={cancel}>
        Cancel
      </CancelButton>

      <StyledButton onClick={deleteScale}>
        Delete
      </StyledButton>
    </DialogActions>
  </StyledDialog>
);

DeleteScale.propTypes = {
  open: PropTypes.bool,
  scaleIndex: PropTypes.number,
  deleteScale: PropTypes.func,
  cancel: PropTypes.func,
};

const DeleteTrait = ({ open, deleteTrait, cancel, traitLabel }) => (
  <StyledDialog open={open}>
    <StyledDialogTitle>Delete {traitLabel}</StyledDialogTitle>

    <StyledDialogContent>
      <DialogContentText>
        <div dangerouslySetInnerHTML={{ __html: `Are you sure you want to delete this ${traitLabel}?` }} />
      </DialogContentText>
    </StyledDialogContent>

    <DialogActions>
      <CancelButton onClick={cancel}>
        Cancel
      </CancelButton>

      <StyledButton onClick={deleteTrait}>
        Delete
      </StyledButton>
    </DialogActions>
  </StyledDialog>
);

DeleteTrait.propTypes = {
  open: PropTypes.bool,
  deleteTrait: PropTypes.func,
  cancel: PropTypes.func,
  traitLabel: PropTypes.string,
};

const InfoDialog = ({ open, text, onClose }) => (
  <StyledDialog open={open}>
    <StyledDialogTitle>{text}</StyledDialogTitle>

    <DialogActions>
      <StyledButton onClick={onClose}>
        OK
      </StyledButton>
    </DialogActions>
  </StyledDialog>
);

InfoDialog.propTypes = {
  open: PropTypes.bool,
  text: PropTypes.string,
  cancel: PropTypes.func,
  onClose: PropTypes.func,
};

export { ExcludeZeroDialog, IncludeZeroDialog, DecreaseMaxPoints, DeleteScale, DeleteTrait, InfoDialog };
