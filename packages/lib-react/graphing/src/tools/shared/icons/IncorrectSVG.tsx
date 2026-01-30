// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/shared/icons/IncorrectSVG.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';

const IncorrectSVG = ({ scale, x, y }) => (
  <svg
    width="14px"
    height="14px"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ffffff"
    strokeWidth="2"
    x={scale.x(x) - 7}
    y={scale.y(y) - 7}
    style={{ pointerEvents: 'none' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.705 7.705l-1.41-1.41L12 10.59 7.705 6.295l-1.41 1.41L10.59 12l-4.295 4.295 1.41 1.41L12 13.41l4.295 4.295 1.41-1.41L13.41 12l4.295-4.295z"></path>
  </svg>
);

IncorrectSVG.propTypes = {
  scale: PropTypes.shape({
    x: PropTypes.func,
    y: PropTypes.func,
  }),
  x: PropTypes.number,
  y: PropTypes.number,
};

export default IncorrectSVG;
