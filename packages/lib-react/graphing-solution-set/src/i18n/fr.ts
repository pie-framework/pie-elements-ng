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
  lineStyleCorrect: 'Style de droite correct : {style}',
  lineStyleIncorrect: 'Style de droite incorrect : tracée {drawn}, attendue {expected}',
  regionVerdict: {
    correct: 'Zone ombrée correcte',
    incorrect: 'Zone ombrée incorrecte',
    missing: 'Zone ombrée du corrigé, non ombrée',
  },
  key: 'Légende',
  keyLegend: {
    studentCorrect: "Réponse correcte de l'élève",
    studentIncorrect: "Réponse incorrecte de l'élève",
    answerKeyCorrect: 'Correct selon le corrigé',
    lineStyleCorrect: 'Style de droite correct',
    lineStyleIncorrect: 'Style de droite incorrect',
  },
} satisfies MessageCatalog;
