// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/shared/point/index.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import { gridDraggable } from '@pie-lib/plot';
import * as utils from '../../../utils.js';
import { RawBp } from './base-point.js';
import { RawArrow } from './arrow-point.js';
import { BaseArrow } from './arrow.js';

// Drag & bounds options
const opts = {
  bounds: (props, { domain, range }) => {
    const { x, y } = props;
    const area = { left: x, top: y, bottom: y, right: x };
    return utils.bounds(area, domain, range);
  },
  anchorPoint: (props) => {
    const { x, y } = props;
    return { x, y };
  },
  fromDelta: (props, delta) => {
    return utils.point(props).add(utils.point(delta));
  },
};

// Common styled point
const PointStyle: any = styled('g')(() => ({
  '& circle, & polygon': {
    cursor: 'pointer',
  },
}));

export const BasePoint = gridDraggable(opts)((props) => (
  <PointStyle {...props}>
    <RawBp {...props} />
  </PointStyle>
));

export const ArrowPoint = gridDraggable(opts)((props) => (
  <PointStyle {...props}>
    <RawArrow {...props} />
  </PointStyle>
));

export const Arrow = gridDraggable(opts)((props) => (
  <PointStyle {...props}>
    <BaseArrow {...props} />
  </PointStyle>
));
