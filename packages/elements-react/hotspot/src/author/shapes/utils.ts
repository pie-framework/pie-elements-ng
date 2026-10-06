// @ts-nocheck

import { CircleShape } from './circle.js';
import { PolygonShape } from './polygon.js';
import { RectangleShape } from './rectagle.js';

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
