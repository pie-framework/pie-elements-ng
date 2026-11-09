// @ts-nocheck

import React, { useCallback, useEffect, useLayoutEffect, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { AutosizeInput } from './autosize-input.js';
import { useDebounce } from './use-debounce.js';
import { types } from '@pie-lib/plot';
import { color } from '@pie-lib/render-ui';
import { roundNumber } from './utils.js';
import { catalogs } from './i18n/index.js';

const StyledAutosizeInput: any = styled(AutosizeInput, {
  shouldForwardProp: (prop) => prop !== 'markDisabled',
})(({ theme, disabled, markDisabled }) => ({
  '& input': {
    float: 'right',
    padding: theme.spacing(0.5),
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,
    border: `solid 1px ${disabled ? color.defaults.PRIMARY_DARK : markDisabled ? color.disabled() : color.defaults.SECONDARY}`,
    borderRadius: '3px',
    color: markDisabled ? color.disabled() : color.defaults.PRIMARY_DARK,
    background: disabled || markDisabled ? theme.palette.background.paper : 'transparent',
  },
}));

export const position = (graphProps, mark, rect) => {
  rect = rect || { width: 0, height: 0 };
  const { scale, domain, range } = graphProps;
  const shift = 10;

  const rightEdge = scale.x(mark.x) + rect.width + shift;
  const bottomEdge = scale.y(mark.y) + rect.height + shift;

  const h = rightEdge >= scale.x(domain.max) ? 'left' : 'right';
  const v = bottomEdge >= scale.y(range.min) ? 'top' : 'bottom';

  return `${v}-${h}`;
};

export const coordinates = (graphProps, mark, rect, position) => {
  const { scale } = graphProps;
  const shift = 10;
  rect = rect || { width: 0, height: 0 };

  switch (position) {
    case 'bottom-right': {
      return { left: scale.x(mark.x) + shift, top: scale.y(mark.y) + shift };
    }
    case 'bottom-left': {
      return { left: scale.x(mark.x) - shift - rect.width, top: scale.y(mark.y) + shift };
    }
    case 'top-left': {
      return {
        left: scale.x(mark.x) - shift - rect.width,
        top: scale.y(mark.y) - shift - rect.height,
      };
    }
    case 'top-right': {
      return {
        left: scale.x(mark.x) + shift,
        top: scale.y(mark.y) - shift - rect.height,
      };
    }
  }
};

// The node's size, measured again whenever it changes. AutosizeInput sets the input's width after
// the label has rendered, so a size read during render is one width behind.
const useSize = (node) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!node) {
      return undefined;
    }

    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => observer.disconnect();
  }, [node]);

  return size;
};

export const MarkLabel = (props) => {
  const [input, setInput] = useState(null);
  const _ref = useCallback((node) => setInput(node));

  const { mark, graphProps, disabled, inputRef: externalInputRef, language } = props;

  const [label, setLabel] = useState(mark.label);
  // Re-renders once the language's catalog lands, for an element that did not preload it.
  const [, relabel] = useReducer((n) => n + 1, 0);

  const onChange = (e) => setLabel(e.target.value);

  const debouncedLabel = useDebounce(label, 200);

  // useState only sets the value once, to synch props to state need useEffect
  useEffect(() => {
    setLabel(mark.label);
  }, [mark.label]);

  // pick up the change to debouncedLabel and save it
  useEffect(() => {
    if (typeof debouncedLabel === 'string' && debouncedLabel !== mark.label) {
      props.onChange(debouncedLabel);
    }
  }, [debouncedLabel]);

  const rect = useSize(input);
  const pos = position(graphProps, mark, rect);
  const leftTop = coordinates(graphProps, mark, rect, pos);

  const style = {
    position: 'fixed',
    pointerEvents: 'auto',
    ...leftTop,
  };

  const disabledInput = disabled || mark.disabled;
  const i18n = catalogs.forLocale(language, relabel);
  const ariaLabel =
    Number.isFinite(mark.x) && Number.isFinite(mark.y)
      ? // as strings: a locale's decimal comma would run into the comma between the two
        i18n.t('markLabel', { x: String(roundNumber(mark.x)), y: String(roundNumber(mark.y)) })
      : i18n.t('label');

  return (
    <StyledAutosizeInput
      inputRef={(r) => {
        _ref(r);
        externalInputRef(r);
      }}
      aria-label={ariaLabel}
      disabled={disabledInput}
      markDisabled={mark.disabled}
      value={label}
      style={style}
      onChange={onChange}
    />
  );
};

MarkLabel.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  graphProps: types.GraphPropsType,
  inputRef: PropTypes.func,
  language: PropTypes.string,
  mark: PropTypes.object,
  theme: PropTypes.object,
};

export default MarkLabel;
