// @ts-nocheck

import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'clsx';
import { styled } from '@mui/material/styles';
import { AutosizeInput } from './autosize-input.js';
import PropTypes from 'prop-types';

import { types } from '@pie-lib/plot';
import { correct, disabled, incorrect } from './common/styles.js';
import { color } from '@pie-lib/render-ui';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { sanitizeModelHtml } from '@pie-element/shared-utils';

const StyledContainer: any = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

// Both disabled label variants share one color so a fraction and a whole number
// read the same. `DISABLED_TEXT` rather than the `disabled` the marks use: a
// non-editable tick label still has to be read, and fraction numerals render
// smaller than ordinary text, so it needs text-grade contrast. The labels sit on the
// chart's white background whatever the theme, so their colors do not follow it.
const disabledLabelColor = color.defaults.DISABLED_TEXT;

// eslint-disable-next-line no-unused-vars
const StyledInput: any = styled('input')(({ theme }) => ({
  float: 'right',
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSize,
  border: 'none',
  '&.correct': correct('color'),
  '&.incorrect': incorrect('color'),
  '&.disabledMarkLabel': {
    backgroundColor: 'transparent !important',
  },
  '&.error': { border: `2px solid ${theme.palette.error.main}` },
}));

// how tall the label is as an input: a label in math form is at least as tall, with its math centered in it,
// so the labels along an axis line up whichever form they are in
const LABEL_HEIGHT = 24;

const StyledMathInput: any = styled('div')(({ theme }) => ({
  pointerEvents: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: LABEL_HEIGHT,
  textAlign: 'center',
  // MathJax's container takes the label's line height at its own larger font, which leaves room above the
  // math and sets it lower than the text of an input; without it the container is as tall as the math
  '& mjx-container': {
    lineHeight: 0,
  },
  fontSize: theme.typography.fontSize + 2,
  fontFamily: theme.typography.fontFamily,
  // the same color as a label shown as the input, so math and plain labels on one axis match
  color: color.defaults.TEXT,
  '&.disabledMarkLabel': {
    ...disabled('color'),
    color: disabledLabelColor,
    backgroundColor: 'transparent !important',
  },
  '&.error': {
    border: `2px solid ${theme.palette.error.main}`,
  },
  '&.correct': {
    ...correct('color'),
  },
  '&.incorrect': {
    ...incorrect('color'),
  },
  '&:focus-visible': {
    outline: `2px solid ${color.focusOutline()}`,
    outlineOffset: '2px',
  },
}));

// a plain-text number, optionally negative: integer, decimal, fraction ("1/2") or mixed number ("1 1/2")
const FRACTION_REGEX = /^(-?)(?:(\d+)\s+)?(\d+)\/(\d+)$/;
const NUMBER_REGEX = /^-?(?:\d+\.?\d*|\.\d+)$/;

// numeric labels are all typeset as math so integers, decimals, fractions and mixed numbers
// look alike when mixed on one axis; anything else stays plain text
export function getLabelMathFormat(label) {
  const trimmedLabel = label?.trim() || '';
  const fraction = FRACTION_REGEX.exec(trimmedLabel);

  if (fraction) {
    const [, sign, whole = '', numerator, denominator] = fraction;
    return `\\(${sign}${whole}\\frac{${numerator}}{${denominator}}\\)`;
  }

  if (NUMBER_REGEX.test(trimmedLabel)) {
    return `\\(${trimmedLabel}\\)`;
  }

  return undefined;
}

export const MarkLabel = (props) => {
  // eslint-disable-next-line no-unused-vars
  const [input, setInput] = useState(null);
  const _ref = useCallback((node) => setInput(node), null);

  const {
    mark = {},
    disabled,
    inputRef: externalInputRef,
    barWidth,
    rotate,
    correctness,
    autoFocus,
    error,
    isHiddenLabel,
    limitCharacters,
    correctnessIndicator,
    ariaLabel,
    mathAriaLabel,
  } = props;

  // what the input holds while it is being typed into
  const [label, setLabel] = useState(mark.label);
  // what was last left in the input, or came in from the chart; this is what is shown once typing stops
  const [committedLabel, setCommittedLabel] = useState(mark.label);
  const [isEditing, setIsEditing] = useState(false);
  // a fraction is shown typeset, any other label as the input. Derived from the committed label — not from
  // what is being typed, or the input would turn into a fraction in the middle of typing "1/2" — and
  // not kept as state, where it would go stale.
  const mathLabel = getLabelMathFormat(committedLabel);
  const rootRef = useRef(null);

  const onChange = (e) => {
    if (limitCharacters && e.target.value && e.target.value.length > 20) {
      return;
    }

    setLabel(e.target.value);
  };

  const isMathRendering = () => {
    return isEditing === false && mathLabel !== undefined;
  };

  const openEditing = () => setIsEditing(true);

  const onMathKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEditing();
    }
  };

  const onChangeProp = (e) => {
    setCommittedLabel(e.target.value);
    setIsEditing(false);
    props.onChange(e.target.value);
  };
  let extraStyle = {};

  if (rotate) {
    extraStyle = {
      width: 'unset',
      textAlign: 'left',
    };
  }

  // useState only sets the value once, to synch props to state need useEffect
  useEffect(() => {
    setLabel(mark.label);
    setCommittedLabel(mark.label);
  }, [mark.label]);

  // The fraction is written into its element here, and that element is a new one each time the input is
  // swapped for it: clicking into the fraction and leaving it puts back an empty element, with `mathLabel`
  // unchanged. So this has to run whenever the element has been put back, not only when the label changes.
  useEffect(() => {
    const el = rootRef.current;

    if (el && mathLabel && !isEditing) {
      el.innerHTML = sanitizeModelHtml(mathLabel);
      renderMath(el);
    }
  }, [mathLabel, isEditing]);

  return (
    <StyledContainer>
      {correctnessIndicator}
      {isMathRendering() ? (
        <StyledMathInput
          ref={(r) => {
            rootRef.current = r;
            if (typeof externalInputRef === 'function') {
              externalInputRef(r);
            }
          }}
          data-math-label
          className={classNames({
            disabledMarkLabel: disabled,
            error: error,
            correct: mark.editable && correctness?.label === 'correct',
            incorrect: mark.editable && correctness?.label === 'incorrect',
          })}
          // an editable label in math form is a button that opens the input
          {...(!disabled && {
            role: 'button',
            tabIndex: 0,
            'aria-label': mathAriaLabel || ariaLabel,
            onClick: openEditing,
            onKeyDown: onMathKeyDown,
          })}
          style={{
            minWidth: barWidth,
            position: 'fixed',
            transformOrigin: 'left',
            transform: `rotate(${rotate}deg)`,
            visibility: isHiddenLabel ? 'hidden' : 'unset',
            marginTop: correctnessIndicator ? '24px' : '0',
          }}
        ></StyledMathInput>
      ) : (
        <AutosizeInput
          inputRef={(r) => {
            _ref(r);
            if (typeof externalInputRef === 'function') {
              externalInputRef(r);
            }
          }}
          name="mark-label-input"
          aria-label={ariaLabel}
          autoFocus={isEditing || autoFocus}
          disabled={disabled}
          inputClassName={classNames(
            correctness && mark.editable ? correctness.label : null,
            disabled && 'disabledMarkLabel',
            error && 'error',
          )}
          inputStyle={{
            minWidth: barWidth,
            textAlign: 'center',
            background: 'transparent',
            boxSizing: 'border-box',
            paddingLeft: 0,
            paddingRight: 0,
            border: 'none',
            // set rather than left to the page, whose input color may follow its theme
            ...(disabled
              ? { color: disabledLabelColor, WebkitTextFillColor: disabledLabelColor }
              : { color: color.defaults.TEXT, WebkitTextFillColor: color.defaults.TEXT }),
            ...extraStyle,
          }}
          value={label}
          style={{
            position: 'fixed',
            pointerEvents: 'auto',
            top: 0,
            left: 0,
            minWidth: barWidth,
            transformOrigin: 'left',
            transform: `rotate(${rotate}deg)`,
            visibility: isHiddenLabel ? 'hidden' : 'unset',
            marginTop: correctnessIndicator ? '24px' : '0',
          }}
          onChange={onChange}
          onBlur={onChangeProp}
        />
      )}
    </StyledContainer>
  );
};

MarkLabel.propTypes = {
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.any,
  onChange: PropTypes.func,
  graphProps: types.GraphPropsType,
  inputRef: PropTypes.func,
  mark: PropTypes.object,
  barWidth: PropTypes.number,
  rotate: PropTypes.number,
  correctness: PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
  }),
  isHiddenLabel: PropTypes.bool,
  limitCharacters: PropTypes.bool,
  correctnessIndicator: PropTypes.node,
  ariaLabel: PropTypes.string,
  // names the label while it renders as math, as a button; ariaLabel names the input
  mathAriaLabel: PropTypes.string,
};

export default MarkLabel;
