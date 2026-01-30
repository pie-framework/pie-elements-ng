// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/factory.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import FreePathDrawable from './drawable-free-path';
import LineDrawable from './drawable-line';
import RectangleDrawable from './drawable-rectangle';
import CircleDrawable from './drawable-circle';
import EraserDrawable from './drawable-eraser';

const DRAWABLES = [FreePathDrawable, LineDrawable, RectangleDrawable, CircleDrawable, EraserDrawable];

export default (type, props) => {
  const T = DRAWABLES.find((D) => D.TYPE === type);

  if (T) {
    return new T(props);
  }

  throw new Error(`Can't find drawable for type: ${type} and props: ${JSON.stringify(props)}`);
};
