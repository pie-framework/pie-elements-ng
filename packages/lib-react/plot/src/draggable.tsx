// @ts-nocheck
/**
 * @synced-from pie-lib/packages/plot/src/draggable.jsx
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
