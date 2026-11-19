import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'Vulkleur',
  outlineColor: 'Omtrekkleur',
  colors: {
    noFill: 'Geen vulling',
    lightblue: 'Lichtblauw',
    lightyellow: 'Lichtgeel',
    red: 'Rood',
    orange: 'Oranje',
    yellow: 'Geel',
    violet: 'Violet',
    blue: 'Blauw',
    green: 'Groen',
    white: 'Wit',
    black: 'Zwart',
  },
  onDoubleClick: 'Dubbelklik om deze tekst te bewerken. Druk op Enter om te bevestigen.',
  drawingArea: 'Tekengebied',
  drawingAreaOverImage: 'Tekengebied over een achtergrondafbeelding',
  tools: {
    select: 'Selecteren',
    freeDraw: 'Vrij tekenen',
    line: 'Lijn',
    rectangle: 'Rechthoek',
    circle: 'Cirkel',
    textEntry: 'Tekst invoeren',
    eraser: 'Gum',
  },
  undo: 'Ongedaan maken',
  clearAll: 'Alles wissen',
  renderError: 'Er is een fout opgetreden: {message}',
} satisfies MessageCatalog;
