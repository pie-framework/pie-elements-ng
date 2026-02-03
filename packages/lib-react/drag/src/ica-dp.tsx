// @ts-nocheck
/**
 * @synced-from pie-lib/packages/drag/src/ica-dp.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { DroppablePlaceholder } from './droppable-placeholder';

// With @dnd-kit, the drop logic is handled in the DragProvider's onDragEnd callback
// This component now just wraps DroppablePlaceholder with ICA specific logic

export function ICADroppable({ id, children, disabled, ...rest }) {
  // The actual drop handling will be managed by the parent component
  // through the DragProvider's onDragEnd callback

  return (
    <DroppablePlaceholder id={id} disabled={disabled} {...rest}>
      {children}
    </DroppablePlaceholder>
  );
}

ICADroppable.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  children: PropTypes.node,
  disabled: PropTypes.bool,
};

export default ICADroppable;
