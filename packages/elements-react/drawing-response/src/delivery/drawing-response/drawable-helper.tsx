// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/drawable-helper.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

/**
 * Not using React in order to avoid performance issues.
 * If you switch this class to a React one make sure that
 * this interaction will not have performance leaks in pie-website nor in pits.
 */
export default class DrawableHelper {
  constructor(props, type) {
    const { startx, starty, fillColor, outlineColor, createdAt } = props;
    this.startx = startx;
    this.starty = starty;
    this.createdAt = createdAt;
    this.fillColor = fillColor;
    this.outlineColor = outlineColor;
    this.type = type;
  }

  toJson() {
    const base = JSON.parse(JSON.stringify(this));
    return base;
  }
}
