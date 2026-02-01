// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/exponential/index.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Exponential from './component';
import debug from 'debug';
import { equalPoints, sameAxes } from '../../utils';

const log = debug('pie-lib:graphing:exponential');

export const tool = () => ({
  type: 'exponential',
  Component: Exponential,
  complete: (data, mark) => ({ ...mark, building: false, closed: true }),
  addPoint: (point, mark) => {
    log('add point to exponential model: ', point, 'mark: ', mark);
    if (mark && (equalPoints(mark.root, point) || sameAxes(mark.root, point))) {
      return mark;
    }

    if (mark && mark.root.y * point.y < 0) {
      return mark;
    }

    if (point.y === 0) {
      return mark;
    }

    if (!mark) {
      return {
        type: 'exponential',
        root: point,
        edge: undefined,
        closed: false,
        building: true,
      };
    } else if (mark && !mark.root) {
      throw new Error('no root - should never happen');
    } else {
      return { ...mark, edge: point, closed: true, building: false };
    }
  },
});
