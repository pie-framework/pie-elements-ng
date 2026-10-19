import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'Meerkeuzevraag',
  multipleCorrectAnswerQuestion: 'Vraag met meerdere juiste antwoorden',
  multipleSelectQuestion: 'Vraag met meerdere antwoorden',
  minSelections: 'Selecteer minimaal {minSelections}.',
  minmaxSelectionsEqual: 'Selecteer {minSelections}.',
  minmaxSelectionsRange: 'Selecteer tussen {minSelections} en {maxSelections}.',
  maxSelections: {
    one: 'Er is slechts {count} antwoord toegestaan.',
    other: 'Er zijn slechts {count} antwoorden toegestaan.',
  },
  showTeacherInstructions: 'Instructies voor de leraar weergeven',
  hideTeacherInstructions: 'Instructies voor de leraar verbergen',
  answerChoicesA11y: 'Antwoordkeuzes',
  partAnswerChoicesA11y: '{partLabel}, antwoordkeuzes',
  pickTheAnswerBelowA11y: 'Selecteer het antwoord hieronder',
} satisfies MessageCatalog;
