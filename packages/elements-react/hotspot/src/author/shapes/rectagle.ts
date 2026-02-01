// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/configure/src/shapes/rectagle.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export class RectangleShape {
  static name = 'rectangle'

  static create(shapes, e) {
    const newShapes = [...shapes];
    const highestId = Math.max(...newShapes.map((shape) => parseInt(shape.id)), 0) || 0;

    const newRectangle = {
      id: `${highestId + 1}`,
      height: 0,
      width: 0,
      x: e.evt.layerX,
      y: e.evt.layerY,
      group: 'rectangles',
      index: newShapes.length,
    };

    newShapes.push(newRectangle);

    return {
      shapes: newShapes,
      isDrawing: true,
      isDrawingShapeId: newRectangle.id,
    };
  }

  static finalizeCreation(state, props) {
    const currentShapeIndex = state.shapes.findIndex((shape) => shape.id === state.isDrawingShapeId);

    if (currentShapeIndex !== -1) {
      const currentShape = state.shapes[currentShapeIndex];

      // Check if the shape is a valid rectangle (has more than 0 width and height) before finalizing
      if (currentShape.width > 0 && currentShape.height > 0) {
        return {
          ...state,
          isDrawing: false,
          stateShapes: false,
          isDrawingShapeId: undefined,
        };
      } else {
        return {
          ...state,
          isDrawing: false,
          stateShapes: false,
          isDrawingShapeId: undefined,
          shapes: state.shapes.filter((shape) => shape.id !== state.isDrawingShapeId),
        };
      }
    }

    // Return current state if not drawing a rectangle
    return {
      ...state,
      isDrawing: false,
      stateShapes: false,
      isDrawingShapeId: undefined,
    };
  }

  static handleMouseMove(state, e) {
    const { isDrawing, isDrawingShapeId, shapes } = state;

    if (isDrawing) {
      const tempShapes = [...shapes];
      const resizingShapeIndex = tempShapes.findIndex((shape) => shape.id === isDrawingShapeId);

      if (resizingShapeIndex !== -1) {
        const resizingShape = tempShapes[resizingShapeIndex];

        resizingShape.width = e.evt.layerX - resizingShape.x;
        resizingShape.height = e.evt.layerY - resizingShape.y;

        return {
          shapes: tempShapes,
        };
      }
    }

    return state;
  }
}
