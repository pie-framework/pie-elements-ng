// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/src/number-line/graph/line.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import { color } from '@pie-lib/render-ui';

const style = {
  root: {
    strokeWidth: 2,
    stroke: color.primary(),
  },
};

export function Line({ y, width, classes }) {
  return <line x1={0} y1={y} x2={width} y2={y} className={classes.root} />;
}

Line.propTypes = {
  y: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  classes: PropTypes.object.isRequired,
};

export default injectSheet(style)(Line);
