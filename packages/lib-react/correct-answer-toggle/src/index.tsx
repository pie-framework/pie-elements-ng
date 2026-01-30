// @ts-nocheck
/**
 * @synced-from pie-lib/packages/correct-answer-toggle/src/index.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { styled } from '@mui/material/styles';
import { CSSTransition } from 'react-transition-group';
import { CorrectResponse } from '@pie-lib/icons';
import { Readable } from '@pie-lib/render-ui';
import Expander from './expander';
import React from 'react';
import PropTypes from 'prop-types';
import Translator from '@pie-lib/translator';
import { color } from '@pie-lib/render-ui';

const { translator } = Translator;

const noTouch = {
  '-webkit-touchCcallout': 'none',
  '-webkit-user-select': 'none',
  '-khtml-user-select': 'none',
  '-moz-user-select': 'none',
  '-ms-user-select': 'none',
  'user-select': 'none',
};

const StyledRoot: any = styled('div')(() => ({
  width: '100%',
  cursor: 'pointer',
}));

const StyledContent: any = styled('div')(() => ({
  margin: '0 auto',
  textAlign: 'center',
  display: 'flex',
}));

const StyledLabel: any = styled('div')(() => ({
  width: 'fit-content',
  minWidth: '140px',
  alignSelf: 'center',
  verticalAlign: 'middle',
  color: `var(--correct-answer-toggle-label-color, ${color.text()})`,
  fontWeight: 'normal',
  ...noTouch,
}));

const StyledIcon: any = styled('div')(() => ({
  position: 'absolute',
  width: '25px',
  '&.enter': {
    opacity: '0',
  },
  '&.enter-active': {
    opacity: '1',
    transition: 'opacity 0.3s ease-in',
  },
  '&.exit': {
    opacity: '1',
  },
  '&.exit-active': {
    opacity: '0',
    transition: 'opacity 0.3s ease-in',
  },
}));

const StyledIconHolder: any = styled('div')(() => ({
  width: '25px',
  marginRight: '5px',
  display: 'flex',
  alignItems: 'center',
}));

/**
 * We export the raw unstyled class for testability. For public use please use the default export.
 */
export class CorrectAnswerToggle extends React.Component {
  static propTypes = {
    onToggle: PropTypes.func,
    toggled: PropTypes.bool,
    show: PropTypes.bool,
    hideMessage: PropTypes.string,
    showMessage: PropTypes.string,
    className: PropTypes.string,
    language: PropTypes.string,
  };

  static defaultProps = {
    showMessage: 'Show correct answer',
    hideMessage: 'Hide correct answer',
    show: false,
    toggled: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      show: props.show,
    };
    this.openIconRef = React.createRef();
    this.closedIconRef = React.createRef();

    CorrectAnswerToggle.defaultProps = {
      ...CorrectAnswerToggle.defaultProps,
      showMessage: translator.t('common:showCorrectAnswer', { lng: props.language }),
      hideMessage: translator.t('common:hideCorrectAnswer', { lng: props.language }),
    };
  }

  onClick() {
    this.props.onToggle(!this.props.toggled);
  }
  onTouch(event) {
    event.preventDefault(); // Prevents the default action (click event)
    this.props.onToggle(!this.props.toggled);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      show: nextProps.show,
    });

    if (nextProps.language !== this.props?.language) {
      CorrectAnswerToggle.defaultProps = {
        ...CorrectAnswerToggle.defaultProps,
        showMessage: translator.t('common:showCorrectAnswer', { lng: nextProps.language }),
        hideMessage: translator.t('common:hideCorrectAnswer', { lng: nextProps.language }),
      };
    }
  }

  render() {
    const { className, toggled, hideMessage, showMessage } = this.props;

    return (
      <StyledRoot className={className}>
        <Expander show={this.state.show}>
          <StyledContent onClick={this.onClick.bind(this)} onTouchEnd={this.onTouch.bind(this)}>
            <StyledIconHolder>
              <CSSTransition
                nodeRef={this.openIconRef}
                timeout={400}
                in={toggled}
                exit={!toggled}
                classNames={{
                  enter: 'enter',
                  enterActive: 'enter-active',
                  exit: 'exit',
                  exitActive: 'exit-active',
                }}
              >
                <StyledIcon ref={this.openIconRef}>
                  <CorrectResponse open={toggled} key="correct-open" />
                </StyledIcon>
              </CSSTransition>
              <CSSTransition
                nodeRef={this.closedIconRef}
                timeout={5000}
                in={!toggled}
                exit={toggled}
                classNames={{
                  enter: 'enter',
                  enterActive: 'enter-active',
                  exit: 'exit',
                  exitActive: 'exit-active',
                }}
              >
                <StyledIcon ref={this.closedIconRef}>
                  <CorrectResponse open={toggled} key="correct-closed" />
                </StyledIcon>
              </CSSTransition>
            </StyledIconHolder>
            <Readable false>
              <StyledLabel aria-hidden={!this.state.show}>{toggled ? hideMessage : showMessage}</StyledLabel>
            </Readable>
          </StyledContent>
        </Expander>
      </StyledRoot>
    );
  }
}

export default CorrectAnswerToggle;
