// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/circle/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Circle from './component.js';
import { equalPoints } from '../../utils.js';

export const tool = () => ({
  type: 'circle',
  Component: Circle,
  hover: (point, mark) => {
    return { ...mark, edge: point };
  },
  addPoint: (point, mark) => {
    if (mark && equalPoints(mark.root, point)) {
      return mark;
    }

    if (!mark) {
      return {
        type: 'circle',
        root: point,
        building: true,
      };
    } else {
      return { ...mark, edge: point, building: false };
    }
  },
});
