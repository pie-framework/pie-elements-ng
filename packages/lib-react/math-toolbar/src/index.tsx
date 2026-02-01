// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-toolbar/src/index.jsx
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
import EditorAndPad from './editor-and-pad';
import { DoneButton } from './done-button';
import { styled } from '@mui/material/styles';
import MathPreview from './math-preview';

export { MathPreview };

const PureToolbarContainer: any = styled('div')({
  display: 'flex',
  width: '100%',
  zIndex: 8,
  alignItems: 'center',
});

export class MathToolbar extends React.Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
    allowAnswerBlock: PropTypes.bool,
    controlledKeypad: PropTypes.bool,
    controlledKeypadMode: PropTypes.bool,
    keypadMode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    classNames: PropTypes.object,
    error: PropTypes.string,
    maxResponseAreas: PropTypes.number,
    showKeypad: PropTypes.bool,
    noDecimal: PropTypes.bool,
    additionalKeys: PropTypes.array,
    latex: PropTypes.string.isRequired,
    onAnswerBlockAdd: PropTypes.func,
    onChange: PropTypes.func,
    onDone: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    hideDoneButton: PropTypes.bool,
    keyPadCharacterRef: PropTypes.func,
    setKeypadInteraction: PropTypes.func,
  };

  static defaultProps = {
    classNames: {},
    keypadMode: 'item-authoring',
    autoFocus: false,
    allowAnswerBlock: false,
    controlledKeypad: false,
    controlledKeypadMode: false,
    noDecimal: false,
    showKeypad: true,
    additionalKeys: [],
    onChange: () => {},
    onAnswerBlockAdd: () => {},
    onFocus: () => {},
    hideDoneButton: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      latex: props.latex,
    };
  }

  done: any = () => {
    this.props.onDone(this.state.latex);
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ latex: nextProps.latex });
  }

  onChange: any = (latex) => {
    this.setState({ latex });
    this.props.onChange(latex);
  };

  render() {
    const { latex } = this.state;
    const {
      classNames,
      autoFocus,
      allowAnswerBlock,
      onAnswerBlockAdd,
      controlledKeypad,
      controlledKeypadMode,
      keypadMode,
      noDecimal,
      additionalKeys,
      showKeypad,
      onFocus,
      onBlur,
      hideDoneButton,
      error,
      keyPadCharacterRef,
      setKeypadInteraction,
      maxResponseAreas,
    } = this.props;

    return (
      <PureToolbar
        autoFocus={autoFocus}
        classNames={classNames}
        onAnswerBlockAdd={onAnswerBlockAdd}
        allowAnswerBlock={allowAnswerBlock}
        latex={latex}
        additionalKeys={additionalKeys}
        noDecimal={noDecimal}
        keypadMode={keypadMode}
        keyPadCharacterRef={keyPadCharacterRef}
        setKeypadInteraction={setKeypadInteraction}
        onChange={this.onChange}
        onDone={this.done}
        onFocus={onFocus}
        onBlur={onBlur}
        showKeypad={showKeypad}
        controlledKeypad={controlledKeypad}
        controlledKeypadMode={controlledKeypadMode}
        hideDoneButton={hideDoneButton}
        error={error}
        maxResponseAreas={maxResponseAreas}
      />
    );
  }
}

export class RawPureToolbar extends React.Component {
  static propTypes = {
    classNames: PropTypes.object,
    latex: PropTypes.string.isRequired,
    keypadMode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hideInput: PropTypes.bool,
    noLatexHandling: PropTypes.bool,
    layoutForKeyPad: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    onDone: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    onAnswerBlockAdd: PropTypes.func,
    additionalKeys: PropTypes.array,
    onFocus: PropTypes.func,
    autoFocus: PropTypes.bool,
    noDecimal: PropTypes.bool,
    allowAnswerBlock: PropTypes.bool,
    controlledKeypad: PropTypes.bool,
    controlledKeypadMode: PropTypes.bool,
    showKeypad: PropTypes.bool,
    hideDoneButton: PropTypes.bool,
    hideDoneButtonBackground: PropTypes.bool,
    error: PropTypes.any,
    maxResponseAreas: PropTypes.number,
    keyPadCharacterRef: PropTypes.object,
    setKeypadInteraction: PropTypes.func,
  };

  static defaultProps = {
    classNames: {},
    hideDoneButtonBackground: false,
  };

  render() {
    const {
      classNames,
      autoFocus,
      allowAnswerBlock,
      onAnswerBlockAdd,
      controlledKeypad,
      controlledKeypadMode,
      additionalKeys,
      showKeypad,
      keypadMode,
      noDecimal,
      hideInput,
      noLatexHandling,
      layoutForKeyPad,
      keyPadCharacterRef,
      setKeypadInteraction,
      latex,
      onChange,
      onDone,
      onFocus,
      onBlur,
      hideDoneButton,
      hideDoneButtonBackground,
      error,
      maxResponseAreas,
    } = this.props;

    return (
      <PureToolbarContainer className={(classNames && classNames.toolbar) || ''} ref={keyPadCharacterRef}>
        <div />
        <EditorAndPad
          autoFocus={autoFocus}
          keypadMode={keypadMode}
          classNames={classNames || {}}
          controlledKeypad={controlledKeypad}
          controlledKeypadMode={controlledKeypadMode}
          noDecimal={noDecimal}
          hideInput={hideInput}
          noLatexHandling={noLatexHandling}
          layoutForKeyPad={layoutForKeyPad}
          showKeypad={showKeypad}
          additionalKeys={additionalKeys}
          allowAnswerBlock={allowAnswerBlock}
          onAnswerBlockAdd={onAnswerBlockAdd}
          latex={latex}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          error={error}
          maxResponseAreas={maxResponseAreas}
          setKeypadInteraction={setKeypadInteraction}
        />
        {(!controlledKeypad || (controlledKeypad && showKeypad)) && !hideDoneButton && (
          <DoneButton hideBackground={hideDoneButtonBackground} onClick={onDone} />
        )}
      </PureToolbarContainer>
    );
  }
}

export const PureToolbar = RawPureToolbar;
