import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: "Afficher la grille d'évaluation",
  hideRubric: "Masquer la grille d'évaluation",
  halfScoringNote: '* Les notes avec demi-points ou intermédiaires sont autorisées dans cette grille.',
  tooLargeForPrint: 'La question est trop grande pour tenir en mode impression.',
  standardsHeader: 'Norme(s)',
  descriptionHeader: 'Description',
  scorePoints: {
    one: '{count} point',
    many: '{count} points',
    other: '{count} points',
  },
  noDescription: 'Aucune description',
} satisfies MessageCatalog;
