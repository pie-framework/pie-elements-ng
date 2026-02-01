// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/mq/input.jsx
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
import debug from 'debug';
import { registerLineBreak } from './custom-elements';
import MathQuill from '@pie-element/shared-mathquill';

let MQ;
if (typeof window !== 'undefined') {
  MQ = MathQuill.getInterface(2);

  if (MQ && MQ.registerEmbed) {
    registerLineBreak(MQ);
  }
}

const log = debug('math-input:mq:input');

const StyledSpan: any = styled('span')({
  // No specific styles needed, but component is available for future styling
});

/**
 * Wrapper for MathQuill MQ.MathField.
 */
export class Input extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    onChange: PropTypes.func,
    latex: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
  };

  componentDidMount() {
    if (!MQ) {
      throw new Error('MQ is not defined - but component has mounted?');
    }

    this.mathField = MQ.MathField(this.input, {
      handlers: {
        edit: this.onInputEdit.bind(this),
      },
    });

    this.updateLatex();
  }

  componentDidUpdate() {
    this.updateLatex();
  }

  updateLatex() {
    if (!this.mathField) {
      return;
    }

    const { latex } = this.props;

    if (latex !== undefined && latex !== null) {
      this.mathField.latex(latex);
    }
  }

  clear() {
    this.mathField.latex('');

    return '';
  }

  blur() {
    log('blur mathfield');
    this.mathField.blur();
  }

  focus() {
    log('focus mathfield...');
    this.mathField.focus();
  }

  command(v) {
    log('command: ', v);
    if (Array.isArray(v)) {
      v.forEach((vv) => {
        this.mathField.cmd(vv);
      });
    } else {
      this.mathField.cmd(v);
    }

    this.mathField.focus();

    return this.mathField.latex();
  }

  keystroke(v) {
    this.mathField.keystroke(v);
    this.mathField.focus();

    return this.mathField.latex();
  }

  write(v) {
    log('write: ', v);
    this.mathField.write(v);
    this.mathField.focus();

    return this.mathField.latex();
  }

  onInputEdit: any = () => {
    log('[onInputEdit] ...');
    const { onChange } = this.props;

    if (!this.mathField) {
      return;
    }

    if (onChange) {
      onChange(this.mathField.latex());
    }
  };

  refresh: any = () => {
    this.blur();
    this.focus();
  };

  onKeyPress: any = (event) => {
    const keys = Object.keys(this.mathField.__controller.options);

    if (keys.indexOf('ignoreNextMousedown') < 0) {
      // It seems like the controller has the above handler as an option
      // when all the right events are set and everything works fine
      // this seems to work in all cases
      this.refresh();
    }

    if (event.charCode === 13) {
      event.preventDefault();
      return;
    }
  };

  onClick: any = (event) => {
    const { onClick } = this.props;

    this.refresh();
    onClick && onClick(event);
  };

  shouldComponentUpdate(nextProps) {
    log('next: ', nextProps.latex);
    log('current: ', this.mathField.latex());

    return nextProps.latex !== this.mathField.latex();
  }

  render() {
    const { onFocus, onBlur, className } = this.props;

    return (
      <StyledSpan
        className={className}
        onKeyDown={this.onKeyPress}
        onClick={this.onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={(r) => (this.input = r)}
      />
    );
  }
}

export default Input;
