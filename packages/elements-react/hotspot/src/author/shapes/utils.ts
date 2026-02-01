// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/configure/src/shapes/utils.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { CircleShape } from './circle';
import { PolygonShape } from './polygon';
import { RectangleShape } from './rectagle';

export const SUPPORTED_SHAPES = {
  CIRCLE: CircleShape.name,
  POLYGON: PolygonShape.name,
  RECTANGLE: RectangleShape.name,
  NONE: 'none',
};

export const SHAPE_GROUPS = {
  CIRCLES: 'circles',
  POLYGONS: 'polygons',
  RECTANGLES: 'rectangles',
};
