import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'Întrebare cu alegere multiplă',
  multipleCorrectAnswerQuestion: 'Întrebare cu mai multe răspunsuri corecte',
  multipleSelectQuestion: 'Întrebare cu selecție multiplă',
  minSelections: 'Selectează cel puțin {minSelections}.',
  minmaxSelectionsEqual: 'Selectează {minSelections}.',
  minmaxSelectionsRange: 'Selectează între {minSelections} și {maxSelections}.',
  maxSelections: {
    one: 'Este permis doar {count} răspuns.',
    few: 'Sunt permise doar {count} răspunsuri.',
    other: 'Sunt permise doar {count} de răspunsuri.',
  },
  showTeacherInstructions: 'Afișează instrucțiunile pentru profesor',
  hideTeacherInstructions: 'Ascunde instrucțiunile pentru profesor',
  answerChoicesA11y: 'Variante de răspuns',
  partAnswerChoicesA11y: '{partLabel}, variante de răspuns',
  pickTheAnswerBelowA11y: 'Alege răspunsul de mai jos',
} satisfies MessageCatalog;
