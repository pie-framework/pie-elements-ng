// @ts-nocheck
/**
 * @synced-from pie-elements/packages/graphing/src/utils.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

const completePoint = (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y);
const completeFromTo = (item) => item && completeMark.point(item.from) && completeMark.point(item.to);
const completeRootEdge = (item) => item && completeMark.point(item.edge) && completeMark.point(item.root);
const completePoints = (item) =>
  item &&
  item.points &&
  item.points.length &&
  (item.points.filter((point) => completePoint(point)) || []).length === item.points.length;

const completeMark = {
  point: completePoint,
  line: completeFromTo,
  ray: completeFromTo,
  segment: completeFromTo,
  vector: completeFromTo,
  circle: completeRootEdge,
  parabola: completeRootEdge,
  absolute: completeRootEdge,
  exponential: completeRootEdge,
  sine: completeRootEdge,
  polygon: completePoints,
};

export { completeMark };
