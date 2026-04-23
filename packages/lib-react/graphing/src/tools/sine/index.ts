// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/sine/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Sine from './component.js';
import debug from 'debug';
import { equalPoints, sameAxes } from '../../utils.js';

const log = debug('pie-lib:graphing:sine');

export const tool = () => ({
  type: 'sine',
  Component: Sine,
  complete: (data, mark) => {
    return { ...mark, building: false, closed: true };
  },
  addPoint: (point, mark) => {
    log('add point to sine model: ', point, 'mark: ', mark);
    if (mark && (equalPoints(mark.root, point) || sameAxes(mark.root, point))) {
      return mark;
    }

    if (!mark) {
      return {
        type: 'sine',
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
