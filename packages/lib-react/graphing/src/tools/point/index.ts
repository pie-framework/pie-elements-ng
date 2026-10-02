// @ts-nocheck

import Point from './component.js';

export const tool = () => ({
  label: 'Point',
  type: 'point',
  Component: Point,
  addPoint: (point) => ({
    type: 'point',
    ...point,
  }),
});
