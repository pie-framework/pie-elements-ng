import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    one: 'Solo puedes agregar {count} elemento',
    other: 'Solo puedes agregar {count} elementos',
  },
  undo: 'Deshacer',
  clearAll: 'Borrar todo',
  graphLabel: 'Recta numérica de {min} a {max}, con una marca cada {interval}',
  closedEnd: 'cerrado',
  openEnd: 'abierto',
  elementCorrect: 'Correcto.',
  elementIncorrect: 'Incorrecto.',
  line: 'Línea de {left} ({leftEnd}) a {right} ({rightEnd}).',
  plottedNone: 'No hay nada marcado en la recta.',
  pointClosed: 'Punto cerrado en {position}.',
  pointOpen: 'Punto abierto en {position}.',
  rayLeft: 'Rayo desde {position} ({end}) hacia la izquierda.',
  rayRight: 'Rayo desde {position} ({end}) hacia la derecha.',
} satisfies MessageCatalog;
