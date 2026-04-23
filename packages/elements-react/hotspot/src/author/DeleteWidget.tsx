// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/configure/src/DeleteWidget.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Group as GroupImport } from 'react-konva';

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
const Group = unwrapReactInteropSymbol(GroupImport, 'Group');
import { faDelete } from './icons.js';
import ImageComponent from './image-konva.js';
import { calculate } from './utils.js';

const DeleteWidget = ({ height, id, width, x, y, points, isCircle, radius, handleWidgetClick }) => {
  let positionX, positionY;
  const offset = 20;

  if (isCircle) {
    // For circles, position the delete icon above the circle
    positionX = x + radius - offset;
    positionY = y;
  } else if (points) {
    // For polygons, compute position based on points
    const calculated = calculate(points);
    positionX = calculated.x;
    positionY = calculated.y;
  } else {
    // For rectangles
    positionX = x + width - offset;
    positionY = y + height - offset;
  }

  return (
    <Group onClick={() => handleWidgetClick(id)}>
      <ImageComponent x={positionX} y={positionY} src={faDelete} />
    </Group>
  );
};

DeleteWidget.propTypes = {
  id: PropTypes.string.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  handleWidgetClick: PropTypes.func.isRequired,
  radius: PropTypes.number,
  isCircle: PropTypes.bool,
  points: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ),
};

export default DeleteWidget;
