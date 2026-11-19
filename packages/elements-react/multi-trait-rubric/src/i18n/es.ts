import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'Mostrar rúbrica',
  hideRubric: 'Ocultar rúbrica',
  halfScoringNote: '* En esta rúbrica se permiten puntuaciones de medio punto o intermedias.',
  tooLargeForPrint: 'La pregunta es demasiado grande para caber en el modo de impresión.',
  standardsHeader: 'Estándar(es)',
  descriptionHeader: 'Descripción',
  scorePoints: {
    one: '{count} punto',
    other: '{count} puntos',
  },
  noDescription: 'Sin descripción',
} satisfies MessageCatalog;
