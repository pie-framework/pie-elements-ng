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

/**
 * This used to subclass Draggable to zero its internal x/y drag offset on every prop
 * change. react-draggable v4 moved that position sync to a static getDerivedStateFromProps,
 * which React prefers over the legacy componentWillReceiveProps, so the override stopped
 * running. Nothing imports this Draggable - the drag handles all go through
 * gridDraggable/DraggableCore - so it is re-exported unchanged rather than reworked.
 */
export default Draggable;

export { DraggableCore };
