// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/math-input.jsx
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
import * as mq from './mq';
import { baseSet } from './keys';
import KeyPad from './keypad';
import debug from 'debug';

const log = debug('pie-lib:math-input');

const grey = 'rgba(0, 0, 0, 0.23)';

const MathInputContainer: any = styled('div')(({ theme, focused }) => ({
  borderRadius: '4px',
  border: `solid 1px ${focused ? theme.palette.primary.main : grey}`,
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  transition: 'border 200ms linear',
}));

const PadContainer: any = styled('div')({
  width: '100%',
  display: 'flex',
});

const StyledMqInput: any = styled(mq.Input)(({ theme }) => ({
  width: '100%',
  border: `solid 0px ${theme.palette.primary.light}`,
  transition: 'border 200ms linear',
  padding: theme.spacing(1),
  '&.mq-focused': {
    outline: 'none',
    boxShadow: 'none',
    border: `solid 0px ${theme.palette.primary.dark}`,
  },
}));

export class MathInput extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    keyset: PropTypes.array,
    displayMode: PropTypes.oneOf(['block', 'block-on-focus']),
    latex: PropTypes.string,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    keyset: [],
    displayMode: 'block',
  };

  constructor(props) {
    super(props);
    this.state = {
      focused: false,
    };
  }

  keypadPress: any = (key) => {
    log('[keypadPress] key:', key);

    if (!this.input) {
      return;
    }

    if (key.latex && !key.command) {
      this.input.write(key.latex);
    } else if (key.write) {
      this.input.write(key.write);
    } else if (key.command) {
      this.input.command(key.command);
    } else if (key.keystroke) {
      this.input.keystroke(key.keystroke);
    }
  };

  inputFocus: any = () => {
    this.setState({ focused: true });
  };

  inputBlur: any = () => {
    this.setState({ focused: false });
  };

  changeLatex: any = (l) => {
    const { onChange } = this.props;

    if (onChange && l !== this.props.latex) {
      log('[changeLatex]', l, this.props.latex);
      onChange(l);
    }
  };

  render() {
    const { className, keyset, latex } = this.props;
    const { focused } = this.state;

    const showKeypad = true; // TODO: add support for different displayModes - displayMode === 'block' || focused;

    return (
      <MathInputContainer className={className} focused={focused}>
        <StyledMqInput
          innerRef={(r) => (this.input = r)}
          onFocus={this.inputFocus}
          onBlur={this.inputBlur}
          latex={latex}
          onChange={this.changeLatex}
        />
        {showKeypad && (
          <PadContainer>
            <KeyPad baseSet={baseSet} additionalKeys={keyset} onPress={this.keypadPress} />
          </PadContainer>
        )}
      </MathInputContainer>
    );
  }
}

export default MathInput;
