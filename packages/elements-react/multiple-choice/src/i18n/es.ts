import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'Pregunta de opción múltiple',
  multipleCorrectAnswerQuestion: 'Pregunta con varias respuestas correctas',
  multipleSelectQuestion: 'Pregunta de selección múltiple',
  minSelections: 'Seleccione al menos {minSelections}.',
  minmaxSelectionsEqual: 'Seleccione {minSelections}.',
  minmaxSelectionsRange: 'Seleccione entre {minSelections} y {maxSelections}.',
  maxSelections: {
    one: 'Sólo se permite {count} respuesta.',
    other: 'Sólo se permiten {count} respuestas.',
  },
  showTeacherInstructions: 'Mostrar instrucciones para el maestro',
  hideTeacherInstructions: 'Ocultar instrucciones para el maestro',
} satisfies MessageCatalog;
