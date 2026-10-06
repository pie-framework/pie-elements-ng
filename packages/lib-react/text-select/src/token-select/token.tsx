// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import classNames from 'clsx';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';

import { color } from '@pie-lib/render-ui';

// we need to use a larger line height for the token to be more readable
const LINE_HEIGHT_MULTIPLIER = 3.2;
// we need a bit more space for correctness indicators
const CORRECTNESS_LINE_HEIGHT_MULTIPLIER = 3.4;
const CORRECTNESS_PADDING = 2;

// The focus ring token chain the Svelte elements use. It sits outside the token, clear of the
// selected border and the highlightChoices dashed border; under the dark preset it measures 3.09:1
// on the selected fill and 5.22:1 on the page.
const focusRing = () =>
  color.v('pie')('focus-outline', 'button-focus-outline', 'focus-checked-border', color.defaults.FOCUS_CHECKED_BORDER);

// Styled components for different token states
const StyledToken: any = styled('span')(({ theme }) => ({
  cursor: 'pointer',
  textIndent: 0,
  '&:focus:not(:focus-visible)': {
    outline: 'none',
  },
  '&:focus-visible': {
    outline: `3px solid ${focusRing()}`,
    outlineOffset: '2px',
    borderRadius: '4px',
  },
  // An unselected token at the selection limit looks like the text around it.
  '&.unavailable': {
    cursor: 'inherit',
  },
  '&.disabled': {
    cursor: 'inherit',
    color: color.disabled(),
  },
  '&.disabledBlack': {
    cursor: 'inherit',
    pointerEvents: 'none',
  },
  '&.disabledAndSelected': {
    backgroundColor: color.blueGrey100(),
  },
  [`@media (min-width: ${theme.breakpoints.values.md}px)`]: {
    // The hover fill is chosen against the page's own ink, not black: black on it
    // drops to 3.44:1 in light-gray-on-dark-gray and 3.77:1 in white-on-black.
    '&.selectableToken:hover': {
      backgroundColor: color.blueGrey300(),
      color: color.text(),
      '& > *': {
        backgroundColor: color.blueGrey300(),
      },
    },
  },
  '&.selectedToken': {
    backgroundColor: color.blueGrey100(),
    color: color.text(),
    lineHeight: `${parseFloat(theme.spacing(1)) * LINE_HEIGHT_MULTIPLIER}px`,
    border: `solid 2px ${color.blueGrey900()}`,
    borderRadius: '4px',
    '& > *': {
      backgroundColor: color.blueGrey100(),
    },
  },
  '&.highlight': {
    border: `dashed 2px ${color.blueGrey600()}`,
    borderRadius: '4px',
    lineHeight: `${parseFloat(theme.spacing(1)) * LINE_HEIGHT_MULTIPLIER}px`,
  },
  '&.print': {
    border: `dashed 2px ${color.blueGrey600()}`,
    borderRadius: '4px',
    lineHeight: `${parseFloat(theme.spacing(1)) * LINE_HEIGHT_MULTIPLIER}px`,
    color: color.text(),
  },
  '&.custom': {
    display: 'initial',
  },
}));

const StyledCommonTokenStyle: any = styled('span')(({ theme }) => ({
  position: 'relative',
  borderRadius: '4px',
  color: color.text(),
  lineHeight: `${parseFloat(theme.spacing(1)) * CORRECTNESS_LINE_HEIGHT_MULTIPLIER + CORRECTNESS_PADDING}px`,
  padding: `${CORRECTNESS_PADDING}px`,
}));

const StyledCorrectContainer: any = styled(StyledCommonTokenStyle)(() => ({
  border: `${color.correctTertiary()} solid 2px`,
}));

const StyledIncorrectContainer: any = styled(StyledCommonTokenStyle)(() => ({
  border: `${color.incorrectWithIcon()} solid 2px`,
}));

const StyledMissingContainer: any = styled(StyledCommonTokenStyle)(() => ({
  border: `${color.incorrectWithIcon()} dashed 2px`,
}));

const baseIconStyles = {
  color: color.white(),
  position: 'absolute',
  top: '-8px',
  left: '-8px',
  borderRadius: '50%',
  fontSize: '12px',
  padding: '2px',
  display: 'inline-block',
};

const StyledCorrectCheckIcon: any = styled(Check)(() => ({
  ...baseIconStyles,
  backgroundColor: color.correctTertiary(),
}));

const StyledIncorrectCloseIcon: any = styled(Close)(() => ({
  ...baseIconStyles,
  backgroundColor: color.incorrectWithIcon(),
}));

const Wrapper = ({ useWrapper, children, Container, Icon }) =>
  useWrapper ? (
    <Container>
      {children}
      {Icon ? <Icon /> : null}
    </Container>
  ) : (
    children
  );

Wrapper.propTypes = {
  useWrapper: PropTypes.bool,
  Container: PropTypes.elementType,
  Icon: PropTypes.elementType,
  children: PropTypes.node,
};

export const TokenTypes = {
  text: PropTypes.string,
  selectable: PropTypes.bool,
};

export class Token extends React.Component {
  static rootClassName = 'tokenRootClass';

  static propTypes = {
    ...TokenTypes,
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    highlight: PropTypes.bool,
    correct: PropTypes.bool,
    // In the keyboard sequence of an operable text: the token takes focus.
    operable: PropTypes.bool,
    describedBy: PropTypes.string,
  };

  static defaultProps = {
    selectable: false,
    operable: false,
    text: '',
  };

  getClassAndIconConfig: any = () => {
    const {
      selectable,
      selected,
      className: classNameProp,
      disabled,
      highlight,
      correct,
      animationsDisabled,
      isMissing,
      operable,
    } = this.props;
    const isTouchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    const baseClassName = Token.rootClassName;
    let Container;
    let Icon;

    if (correct === undefined && selected && disabled) {
      return {
        className: classNames(baseClassName, 'selectedToken', 'disabledBlack', classNameProp),
        Component: StyledToken,
      };
    }

    if (correct !== undefined) {
      const isCorrect = correct === true;
      return {
        className: classNames(baseClassName, 'custom', classNameProp),
        Component: StyledToken,
        Container: isCorrect ? StyledCorrectContainer : StyledIncorrectContainer,
        Icon: isCorrect ? StyledCorrectCheckIcon : StyledIncorrectCloseIcon,
      };
    }

    if (isMissing) {
      return {
        className: classNames(baseClassName, 'custom', 'missing', classNameProp),
        Component: StyledToken,
        Container: StyledMissingContainer,
        Icon: StyledIncorrectCloseIcon,
      };
    }

    return {
      className: classNames(
        baseClassName,
        disabled && 'disabled',
        selectable && !disabled && !isTouchEnabled && 'selectableToken',
        selected && !disabled && 'selectedToken',
        selected && disabled && 'disabledAndSelected',
        highlight && selectable && !disabled && !selected && 'highlight',
        operable && !selectable && !selected && 'unavailable',
        animationsDisabled && 'print',
        classNameProp,
      ),
      Component: StyledToken,
      Container,
      Icon,
    };
  };

  render() {
    const { text, index, correct, isMissing, selected, selectable, operable, describedBy } = this.props;
    const { className, Component, Container, Icon } = this.getClassAndIconConfig();

    const TokenComponent = Component || StyledToken;
    const available = operable && (selectable || selected);

    // A toggle button that stays an inline span, so a sentence token keeps wrapping with its line.
    // TokenSelect moves the single tab stop between operable tokens.
    return (
      <Wrapper useWrapper={correct !== undefined || isMissing} Container={Container} Icon={Icon}>
        <TokenComponent
          className={className}
          dangerouslySetInnerHTML={{ __html: (text || '').replace(/\n/g, '<br>') }}
          data-indexkey={index}
          role="button"
          aria-pressed={!!selected}
          aria-disabled={available ? undefined : true}
          aria-describedby={describedBy || undefined}
          tabIndex={operable ? -1 : undefined}
        />
      </Wrapper>
    );
  }
}

export default Token;
