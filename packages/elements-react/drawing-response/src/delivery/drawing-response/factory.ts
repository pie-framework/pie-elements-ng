// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/factory.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import FreePathDrawable from './drawable-free-path.js';
import LineDrawable from './drawable-line.js';
import RectangleDrawable from './drawable-rectangle.js';
import CircleDrawable from './drawable-circle.js';
import EraserDrawable from './drawable-eraser.js';

const DRAWABLES = [FreePathDrawable, LineDrawable, RectangleDrawable, CircleDrawable, EraserDrawable];

export default (type, props) => {
  const T = DRAWABLES.find((D) => D.TYPE === type);

  if (T) {
    return new T(props);
  }

  throw new Error(`Can't find drawable for type: ${type} and props: ${JSON.stringify(props)}`);
};
