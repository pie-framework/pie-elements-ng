import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'Fill colour',
  outlineColor: 'Outline colour',
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
  onDoubleClick: 'Double click to edit this text. Press Enter to submit.',
  drawingArea: 'Drawing area',
  drawingAreaOverImage: 'Drawing area over a background image',
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
  renderError: 'An error occurred: {message}',
} satisfies MessageCatalog;
