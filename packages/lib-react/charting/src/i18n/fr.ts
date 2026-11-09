import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: 'Actions',
  add: 'Ajouter',
  delete: 'Supprimer',
  newLabel: 'Nouvelle étiquette',
  categoryLabel: 'Étiquette de la catégorie {index}',
  categoryLabelValue: 'Étiquette de la catégorie {index} : {label}',
  category: 'Catégorie {index}',
  warning: 'Avertissement',
  reachedLimit: {
    one: 'Il ne peut pas y avoir plus de {count} catégorie.',
    many: 'Il ne peut pas y avoir plus de {count} catégories.',
    other: 'Il ne peut pas y avoir plus de {count} catégories.',
  },
  key: 'Légende',
  keyLegend: {
    incorrectAnswer: "Réponse incorrecte de l'élève",
    correctAnswer: "Réponse correcte de l'élève",
    correctKeyAnswer: 'Correct selon le corrigé',
  },
  chartTypes: {
    bar: 'Diagramme en barres',
    histogram: 'Histogramme',
    lineDot: 'Graphique linéaire avec points',
    lineCross: 'Graphique linéaire avec croix',
    dotPlot: 'Diagramme à points',
    linePlot: 'Diagramme linéaire',
  },
  categoriesNone: 'Aucune catégorie.',
  categories: {
    one: '{count} catégorie : {categories}.',
    many: '{count} catégories : {categories}.',
    other: '{count} catégories : {categories}.',
  },
  valueRange: 'Valeurs de {min} à {max}.',
  labelledValueRange: '{label} : de {min} à {max}.',
} satisfies MessageCatalog;
