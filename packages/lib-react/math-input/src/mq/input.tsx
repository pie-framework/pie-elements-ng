// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/mq/input.jsx
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
import { createField } from '@pie-element/shared-math-engine';

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
    this.mathField = createField(this.props.latex || '', {
      onChange: (nextLatex) => {
        const { onChange } = this.props;
        if (onChange && nextLatex !== this.props.latex) {
          onChange(nextLatex);
        }
      },
      onFocus: () => this.props.onFocus?.(),
      onBlur: () => this.props.onBlur?.(),
    });
    this.mathField.mount(this.input);

    this.updateLatex();
  }

  componentDidUpdate() {
    this.updateLatex();
  }

  componentWillUnmount() {
    this.mathField?.destroy?.();
    this.mathField = null;
  }

  updateLatex() {
    if (!this.mathField) {
      return;
    }

    const { latex } = this.props;
    const currentLatex = this.mathField.getLatex();

    if (latex !== undefined && latex !== null && latex !== currentLatex) {
      this.mathField.setLatex(latex);
    }
  }

  clear() {
    this.mathField.clear();

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
    return this.mathField.command(v);
  }

  keystroke(v) {
    return this.mathField.keystroke(v);
  }

  write(v) {
    log('write: ', v);
    return this.mathField.write(v);
  };

  refresh: any = () => {
    this.blur();
    this.focus();
  };

  onKeyPress: any = (event) => {
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
    if (!this.mathField) {
      return true;
    }
    log('next: ', nextProps.latex);
    log('current: ', this.mathField.getLatex());

    return nextProps.latex !== this.mathField.getLatex();
  }

  render() {
    const { className } = this.props;

    return (
      <StyledSpan
        className={className}
        onKeyDown={this.onKeyPress}
        onClick={this.onClick}
        ref={(r) => (this.input = r)}
      />
    );
  }
}

export default Input;
