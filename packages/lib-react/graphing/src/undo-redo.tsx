// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/undo-redo.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
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
import classNames from 'classnames';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

const StyledButton: any = styled(Button)(({ theme }) => ({
  color: color.text(),
  fontWeight: 'bold',
  marginBottom: theme.spacing(0.5),
  '&:not(:last-of-type)': {
    marginRight: theme.spacing(0.5),
  },
}));

export class UndoRedo extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    onUndo: PropTypes.func.isRequired,
    onRedo: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    language: PropTypes.string,
  };
  static defaultProps = {};

  render() {
    const { className, onUndo, onRedo, onReset, language } = this.props;
    return (
      <div className={classNames(className)}>
        <StyledButton onClick={() => onUndo(true)}>
          {translator.t('common:undo', { lng: language })}
        </StyledButton>
        <StyledButton onClick={() => onRedo(true)}>
          {translator.t('graphing.redo', { lng: language })}
        </StyledButton>
        <StyledButton onClick={() => onReset()}>
          {translator.t('graphing.reset', { lng: language })}
        </StyledButton>
      </div>
    );
  }
}

export default UndoRedo;
