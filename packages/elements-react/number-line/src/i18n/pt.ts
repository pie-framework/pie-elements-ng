import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    one: 'Só é possível adicionar {count} elemento',
    many: 'Só é possível adicionar {count} elementos',
    other: 'Só é possível adicionar {count} elementos',
  },
  undo: 'Desfazer',
  clearAll: 'Limpar tudo',
  graphLabel: 'Reta numérica de {min} a {max}, com uma marcação a cada {interval}',
  closedEnd: 'fechado',
  openEnd: 'aberto',
  elementCorrect: 'Correto.',
  elementIncorrect: 'Incorreto.',
  line: 'Segmento de {left} ({leftEnd}) a {right} ({rightEnd}).',
  plottedNone: 'Nada foi marcado.',
  pointClosed: 'Ponto fechado em {position}.',
  pointOpen: 'Ponto aberto em {position}.',
  rayLeft: 'Semirreta de {position} ({end}) para a esquerda.',
  rayRight: 'Semirreta de {position} ({end}) para a direita.',
} satisfies MessageCatalog;
