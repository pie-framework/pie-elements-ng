import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'Color de relleno',
  outlineColor: 'Color del contorno',
  colors: {
    noFill: 'Sin relleno',
    lightblue: 'Azul claro',
    lightyellow: 'Amarillo claro',
    red: 'Rojo',
    orange: 'Naranja',
    yellow: 'Amarillo',
    violet: 'Violeta',
    blue: 'Azul',
    green: 'Verde',
    white: 'Blanco',
    black: 'Negro',
  },
  onDoubleClick: 'Haz doble clic para revisar este texto. Presiona el botón de ingreso para enviar',
  drawingArea: 'Área de dibujo',
  drawingAreaOverImage: 'Área de dibujo sobre una imagen de fondo',
  tools: {
    select: 'Seleccionar',
    freeDraw: 'Dibujo libre',
    line: 'Línea',
    rectangle: 'Rectángulo',
    circle: 'Círculo',
    textEntry: 'Entrada de texto',
    eraser: 'Borrador',
  },
  undo: 'Deshacer',
  clearAll: 'Borrar todo',
  renderError: 'Se produjo un error: {message}',
} satisfies MessageCatalog;
