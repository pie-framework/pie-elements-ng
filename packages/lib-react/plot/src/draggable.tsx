// @ts-nocheck
/**
 * @synced-from pie-lib/packages/plot/src/draggable.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Draggable, { DraggableCore } from 'react-draggable';

export default class LocalDraggable extends Draggable {
  componentWillReceiveProps(next) {
    super.componentWillReceiveProps(next);
    //Remove the x/y state as these values have now been updated and will come through as props.
    this.setState({ x: 0, y: 0 });
  }
}

export { DraggableCore };
