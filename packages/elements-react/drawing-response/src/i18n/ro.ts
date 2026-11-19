import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'Culoare de umplere',
  outlineColor: 'Culoarea conturului',
  colors: {
    noFill: 'Fără umplere',
    lightblue: 'Albastru deschis',
    lightyellow: 'Galben deschis',
    red: 'Roșu',
    orange: 'Portocaliu',
    yellow: 'Galben',
    violet: 'Violet',
    blue: 'Albastru',
    green: 'Verde',
    white: 'Alb',
    black: 'Negru',
  },
  onDoubleClick: 'Fă dublu clic pentru a edita acest text. Apasă Enter pentru a confirma.',
  drawingArea: 'Zonă de desen',
  drawingAreaOverImage: 'Zonă de desen peste o imagine de fundal',
  tools: {
    select: 'Selectează',
    freeDraw: 'Desen liber',
    line: 'Linie',
    rectangle: 'Dreptunghi',
    circle: 'Cerc',
    textEntry: 'Introducere text',
    eraser: 'Radieră',
  },
  undo: 'Anulează',
  clearAll: 'Șterge tot',
  renderError: 'A apărut o eroare: {message}',
} satisfies MessageCatalog;
