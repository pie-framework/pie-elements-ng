// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/shared/arrow-head.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';

const StyledArrowHead: any = styled('polygon')(({ disabled, correctness }) => ({
  fill: color.defaults.BLACK,
  ...(disabled && {
    fill: color.disabled(),
  }),
  ...(correctness === 'correct' && {
    fill: color.correctWithIcon(),
  }),
  ...(correctness === 'incorrect' && {
    fill: color.incorrectWithIcon(),
  }),
  ...(correctness === 'missing' && {
    fill: color.missingWithIcon(),
  }),
}));

const StyledMarker: any = styled('marker')(({ disabled, correctness }) => ({
  '& polygon': {
    fill: color.defaults.BLACK,
    ...(disabled && {
      fill: color.disabled(),
    }),
    ...(correctness === 'correct' && {
      fill: color.correctWithIcon(),
    }),
    ...(correctness === 'incorrect' && {
      fill: color.incorrectWithIcon(),
    }),
    ...(correctness === 'missing' && {
      fill: color.missingWithIcon(),
    }),
  },
}));

export const ArrowHead = ({ size, transform, points, disabled, correctness }) => (
  <StyledArrowHead 
    points={points || `0,0 ${size},${size / 2} 0,${size}`} 
    transform={transform}
    disabled={disabled}
    correctness={correctness}
  />
);
ArrowHead.propTypes = {
  points: PropTypes.string,
  size: PropTypes.number,
  transform: PropTypes.string,
  disabled: PropTypes.bool,
  correctness: PropTypes.string,
};
ArrowHead.defaultProps = {
  points: '',
  size: 10,
  transform: '',
};
export const genUid = () => {
  const v = (Math.random() * 1000).toFixed(0);
  return `arrow-${v}`;
};
export const ArrowMarker = ({ id, size, className, disabled, correctness }) => {
  // Parse styling info from className if provided (for backward compatibility)
  const isDisabled = disabled || className?.includes('disabled');
  const parsedCorrectness = correctness || 
    (className?.includes('incorrect') ? 'incorrect' : 
     className?.includes('correct') ? 'correct' : 
     className?.includes('missing') ? 'missing' : null);

  return (
    <StyledMarker
      id={id}
      viewBox={`0 0 ${size} ${size}`}
      refX={size / 2}
      refY={size / 2}
      markerWidth={size}
      markerHeight={size}
      orient="auto-start-reverse"
      disabled={isDisabled}
      correctness={parsedCorrectness}
    >
      <ArrowHead size={size} disabled={isDisabled} correctness={parsedCorrectness} />
    </StyledMarker>
  );
};
ArrowMarker.propTypes = {
  id: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  correctness: PropTypes.string,
};
ArrowMarker.defaultProps = {
  size: 5,
};
