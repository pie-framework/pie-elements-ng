// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'clsx';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';
import { catalogs } from './i18n/index.js';

const StyledButton: any = styled(Button)(({ theme }) => ({
  color: color.text(),
  fontWeight: 'bold',
  marginBottom: theme.spacing(0.5),
  '&:not(:last-of-type)': {
    marginRight: theme.spacing(0.5),
  },
  '&:hover': {
    backgroundColor: color.buttonHoverBg(),
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

  /** Re-renders once the language's catalog lands, for an element that did not preload it. */
  relabel = () => this.forceUpdate();

  render() {
    const { className, onUndo, onRedo, onReset, language } = this.props;
    const i18n = catalogs.forLocale(language, this.relabel);
    return (
      <div className={classNames(className)}>
        <StyledButton onClick={() => onUndo(true)}>{i18n.t('undo')}</StyledButton>
        <StyledButton onClick={() => onRedo(true)}>{i18n.t('redo')}</StyledButton>
        <StyledButton onClick={() => onReset()}>{i18n.t('reset')}</StyledButton>
      </div>
    );
  }
}

export default UndoRedo;
