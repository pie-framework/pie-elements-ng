// @ts-nocheck

import { styled } from '@mui/material/styles';
import { CSSTransition } from 'react-transition-group';
import { CorrectResponse } from '@pie-lib/icons';
import { color, Readable as ReadableImport } from '@pie-lib/render-ui';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
const Readable = unwrapReactInteropSymbol(ReadableImport, 'Readable') || unwrapReactInteropSymbol(renderUi.Readable, 'Readable');
import Expander from './expander.js';
import React from 'react';
import PropTypes from 'prop-types';
import { catalogs } from './i18n/index.js';
import { elementLanguageAttributes } from '@pie-element/shared-i18n';

const noTouch = {
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
  KhtmlUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none',
};

const StyledRoot: any = styled('div')(() => ({
  width: '100%',
  cursor: 'pointer',
}));

const StyledContent: any = styled('button')(() => ({
  margin: '0 auto',
  textAlign: 'center',
  display: 'flex',
  minWidth: '24px',
  minHeight: '24px',
  padding: 0,
  border: 0,
  background: 'none',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  '&:focus-visible': {
    outline: `2px solid ${color.buttonFocusOutline()}`,
    // Inset, because the expander around the button clips anything drawn outside it.
    outlineOffset: '-2px',
  },
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
    /** Overrides the localized label of the toggled state. */
    hideMessage: PropTypes.string,
    /** Overrides the localized label of the untoggled state. */
    showMessage: PropTypes.string,
    className: PropTypes.string,
    /** The item language, which the default labels follow. */
    language: PropTypes.string,
  };

  static defaultProps = {
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
  }

  /** Re-renders once the item language's catalog lands, for an element that did not preload it. */
  relabel = () => this.forceUpdate();

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
  }

  render() {
    const { className, toggled, language } = this.props;
    // Resolved per render and per instance: two toggles on one page can follow two items' languages.
    const i18n = catalogs.forLocale(language, this.relabel);
    const hideMessage = this.props.hideMessage ?? i18n.t('hideCorrectAnswer');
    const showMessage = this.props.showMessage ?? i18n.t('showCorrectAnswer');
    // The chrome root names the language its strings are in, so a toggle label
    // inside content of another language is announced correctly. No language
    // prop, no assertion — the root inherits.
    const languageAttributes = elementLanguageAttributes(language);

    return (
      <StyledRoot className={className} {...languageAttributes}>
        <Expander show={this.state.show}>
          <StyledContent
            type="button"
            aria-pressed={!!toggled}
            onClick={this.onClick.bind(this)}
            onTouchEnd={this.onTouch.bind(this)}
          >
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
