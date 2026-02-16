// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/tools/shared/arrow-head.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { color } from '@pie-lib/render-ui';

export const ArrowHead = ({ size, transform, points }) => (
  <polygon points={points || `0,0 ${size},${size / 2} 0,${size}`} transform={transform} />
);
ArrowHead.propTypes = {
  points: PropTypes.string,
  size: PropTypes.number,
  transform: PropTypes.string,
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
export const ArrowMarker = ({ id, size, className }) => {
  return (
    <marker
      id={id}
      viewBox={`0 0 ${size} ${size}`}
      refX={size / 2}
      refY={size / 2}
      markerWidth={size}
      markerHeight={size}
      orient="auto-start-reverse"
      className={className}
      style={{ fill: color.defaults.BLACK }}
    >
      <ArrowHead size={size} />
    </marker>
  );
};
ArrowMarker.propTypes = {
  id: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
};
ArrowMarker.defaultProps = {
  size: 5,
};
