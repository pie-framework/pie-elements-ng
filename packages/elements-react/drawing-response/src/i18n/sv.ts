import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'Fyllnadsfärg',
  outlineColor: 'Konturfärg',
  colors: {
    noFill: 'Ingen fyllning',
    lightblue: 'Ljusblå',
    lightyellow: 'Ljusgul',
    red: 'Röd',
    orange: 'Orange',
    yellow: 'Gul',
    violet: 'Violett',
    blue: 'Blå',
    green: 'Grön',
    white: 'Vit',
    black: 'Svart',
  },
  onDoubleClick: 'Dubbelklicka för att redigera texten. Tryck på Enter för att bekräfta.',
  drawingArea: 'Ritområde',
  drawingAreaOverImage: 'Ritområde över en bakgrundsbild',
  tools: {
    select: 'Markera',
    freeDraw: 'Frihandsritning',
    line: 'Linje',
    rectangle: 'Rektangel',
    circle: 'Cirkel',
    textEntry: 'Textinmatning',
    eraser: 'Suddgummi',
  },
  undo: 'Ångra',
  clearAll: 'Rensa allt',
  renderError: 'Ett fel uppstod: {message}',
} satisfies MessageCatalog;
