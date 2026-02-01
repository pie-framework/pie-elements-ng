// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/tools/polygon/index.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Polygon from './component';
import { equalPoints } from '../../utils';

export const addPointToArray = (point, arr) => {
  arr = arr || [];

  if (arr.length === 0) {
    return { points: [point], closed: false };
  } else if (arr.length === 1) {
    if (equalPoints(point, arr[0])) {
      return { points: arr, closed: false };
    } else {
      return { points: [...arr, point], closed: false };
    }
  } else if (arr.length >= 2) {
    const closed = equalPoints(point, arr[0]);

    if (closed) {
      return { points: arr, closed };
    } else {
      const hasPoint = !!arr.find((p) => equalPoints(p, point));

      if (hasPoint) {
        return { points: arr, closed: false };
      } else {
        return { points: [...arr, point], closed: false };
      }
    }
  }
};

export const tool = () => ({
  type: 'polygon',
  Component: Polygon,
  complete: (data, mark) => {
    return { ...mark, building: false, closed: true };
  },
  addPoint: (point, mark) => {
    if (!mark) {
      return {
        type: 'polygon',
        points: [point],
        closed: false,
        building: true,
      };
    } else {
      const { closed, points } = addPointToArray(point, mark.points);

      return { ...mark, closed, points, building: !closed };
    }
  },
});
