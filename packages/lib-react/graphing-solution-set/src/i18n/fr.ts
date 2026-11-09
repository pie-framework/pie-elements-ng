import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'Graphique cartésien',
  axisRange: 'Axe {axis} de {min} à {max}.',
  plottedNone: 'Aucun objet tracé.',
  plotted: {
    one: '{count} objet tracé : {marks}.',
    many: '{count} objets tracés : {marks}.',
    other: '{count} objets tracés : {marks}.',
  },
  line: 'Droite',
  shadedRegion: 'Zone ombrée',
  label: 'Étiquette',
  markLabel: 'Étiquette au point ({x} ; {y})',
  reset: 'Réinitialiser',
  lineA: 'Droite A',
  lineB: 'Droite B',
  solutionSet: 'Ensemble des solutions',
  solid: 'Continue',
  dashed: 'Pointillée',
} satisfies MessageCatalog;
