import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'Mostrar rubrica',
  hideRubric: 'Ocultar rubrica',
  halfScoringNote: '* Esta rubrica permite pontuações de meio ponto ou intermediárias.',
  tooLargeForPrint: 'A questão é grande demais para caber no modo de impressão.',
  standardsHeader: 'Padrão(ões)',
  descriptionHeader: 'Descrição',
  scorePoints: {
    one: '{count} ponto',
    many: '{count} pontos',
    other: '{count} pontos',
  },
  noDescription: 'Sem descrição',
} satisfies MessageCatalog;
