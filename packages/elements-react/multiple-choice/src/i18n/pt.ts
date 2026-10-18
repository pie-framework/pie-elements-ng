import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'Pergunta de múltipla escolha',
  multipleCorrectAnswerQuestion: 'Pergunta com várias respostas corretas',
  multipleSelectQuestion: 'Pergunta de seleção múltipla',
  minSelections: 'Selecione pelo menos {minSelections}.',
  minmaxSelectionsEqual: 'Selecione {minSelections}.',
  minmaxSelectionsRange: 'Selecione entre {minSelections} e {maxSelections}.',
  maxSelections: {
    one: 'Somente {count} resposta é permitida.',
    many: 'Somente {count} respostas são permitidas.',
    other: 'Somente {count} respostas são permitidas.',
  },
  showTeacherInstructions: 'Mostrar instruções do professor',
  hideTeacherInstructions: 'Ocultar instruções do professor',
} satisfies MessageCatalog;
