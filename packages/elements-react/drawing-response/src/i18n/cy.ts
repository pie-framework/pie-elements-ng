import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'Lliw llenwi',
  outlineColor: 'Lliw amlinell',
  colors: {
    noFill: 'Dim llenwad',
    lightblue: 'Glas golau',
    lightyellow: 'Melyn golau',
    red: 'Coch',
    orange: 'Oren',
    yellow: 'Melyn',
    violet: 'Fioled',
    blue: 'Glas',
    green: 'Gwyrdd',
    white: 'Gwyn',
    black: 'Du',
  },
  onDoubleClick: "Cliciwch ddwywaith i olygu'r testun hwn. Pwyswch Enter i gadarnhau.",
  drawingArea: 'Ardal luniadu',
  drawingAreaOverImage: 'Ardal luniadu dros ddelwedd gefndir',
  tools: {
    select: 'Dewis',
    freeDraw: 'Lluniadu rhydd',
    line: 'Llinell',
    rectangle: 'Petryal',
    circle: 'Cylch',
    textEntry: 'Mewnbynnu testun',
    eraser: 'Rhwbiwr',
  },
  undo: 'Dadwneud',
  clearAll: "Clirio'r cyfan",
  renderError: 'Digwyddodd gwall: {message}',
} satisfies MessageCatalog;
