// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { color } from '@pie-lib/render-ui';
import { catalogs } from './i18n/index.js';

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
    onReset: PropTypes.func.isRequired,
    language: PropTypes.string,
  };
  static defaultProps = {};

  /** Re-renders once the language's catalog lands, for an element that did not preload it. */
  relabel = () => this.forceUpdate();

  render() {
    const { className, onReset = false, language } = this.props;
    return (
      <div className={className}>
        <StyledButton onClick={() => onReset()}>{catalogs.forLocale(language, this.relabel).t('reset')}</StyledButton>
      </div>
    );
  }
}

export default UndoRedo;
