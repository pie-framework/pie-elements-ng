// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/circle/index.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Circle from './component';
import { equalPoints } from '../../utils';

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
