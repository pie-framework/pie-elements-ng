// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/horizontal-keypad.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { keysForGrade, normalizeAdditionalKeys } from './keys/grades';
import { extendKeySet } from './keys/utils';
import Keypad from './keypad';

const toOldModel = (d) => {
  if (d.command) {
    return { value: d.command, type: 'command' };
  } else if (d.write) {
    return { value: d.write };
  } else if (d.keystroke) {
    return { type: 'cursor', value: d.keystroke };
  }
};

export default class HorizontalKeypad extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    controlledKeypadMode: PropTypes.bool,
    mode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    layoutForKeyPad: PropTypes.object,
    onClick: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    noDecimal: PropTypes.bool,
    additionalKeys: PropTypes.array,
    setKeypadInteraction: PropTypes.func,
    onRequestClose: PropTypes.func,
  };

  static defaultProps = {
    mode: 'scientific',
    noDecimal: false,
    additionalKeys: [],
  };

  keypadPress: any = (data) => {
    const { onClick } = this.props;

    onClick(toOldModel(data));
  };

  render() {
    const {
      mode,
      onFocus,
      controlledKeypadMode,
      noDecimal,
      className,
      additionalKeys,
      layoutForKeyPad,
      setKeypadInteraction,
      onRequestClose,
    } = this.props;
    const normalizedKeys = normalizeAdditionalKeys(additionalKeys);

    return (
      <Keypad
        className={className}
        controlledKeypadMode={controlledKeypadMode}
        onFocus={onFocus}
        noDecimal={noDecimal}
        layoutForKeyPad={layoutForKeyPad}
        additionalKeys={extendKeySet(keysForGrade(mode), normalizedKeys)}
        onPress={this.keypadPress}
        mode={mode}
        setKeypadInteraction={setKeypadInteraction}
        onRequestClose={onRequestClose}
      />
    );
  }
}
