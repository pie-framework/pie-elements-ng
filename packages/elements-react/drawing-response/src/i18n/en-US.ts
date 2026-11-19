/** The interface strings `@pie-element/drawing-response` renders; the source for every other locale. */
export default {
  /** Labels of the two color selects above the canvas. */
  fillColor: 'Fill color',
  outlineColor: 'Outline color',
  /** Color names in the fill and outline selects. */
  colors: {
    noFill: 'No fill',
    lightblue: 'Light blue',
    lightyellow: 'Light yellow',
    red: 'Red',
    orange: 'Orange',
    yellow: 'Yellow',
    violet: 'Violet',
    blue: 'Blue',
    green: 'Green',
    white: 'White',
    black: 'Black',
  },
  /** Placeholder of a new text entry on the canvas. */
  onDoubleClick: 'Double click to edit this text. Press Enter to submit.',
  /** Accessible names of the canvas, without and with a background image. */
  drawingArea: 'Drawing area',
  drawingAreaOverImage: 'Drawing area over a background image',
  /** Titles of the toolbar buttons. */
  tools: {
    select: 'Select',
    freeDraw: 'Free Draw',
    line: 'Line',
    rectangle: 'Rectangle',
    circle: 'Circle',
    textEntry: 'Text Entry',
    eraser: 'Eraser',
  },
  undo: 'Undo',
  clearAll: 'Clear all',
  /** Shown in place of the item when it fails to render; `message` is the error's own text. */
  renderError: 'An error occurred: {message}',
};
