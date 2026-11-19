import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: 'Acțiuni',
  add: 'Adaugă',
  delete: 'Șterge',
  newLabel: 'Etichetă nouă',
  categoryLabel: 'Eticheta categoriei {index}',
  categoryLabelValue: 'Eticheta categoriei {index}: {label}',
  category: 'Categoria {index}',
  warning: 'Avertisment',
  reachedLimit: {
    one: 'Nu poate exista mai mult de {count} categorie.',
    few: 'Nu pot exista mai mult de {count} categorii.',
    other: 'Nu pot exista mai mult de {count} de categorii.',
  },
  key: 'Legendă',
  keyLegend: {
    incorrectAnswer: 'Răspuns greșit al elevului',
    correctAnswer: 'Răspuns corect al elevului',
    correctKeyAnswer: 'Corect conform baremului',
  },
  chartTypes: {
    bar: 'Diagramă cu bare',
    histogram: 'Histogramă',
    lineDot: 'Diagramă liniară cu puncte',
    lineCross: 'Diagramă liniară cu cruciulițe',
    dotPlot: 'Diagramă cu puncte',
    linePlot: 'Diagramă cu linii',
  },
  categoriesNone: 'Nicio categorie.',
  categories: {
    one: '{count} categorie: {categories}.',
    few: '{count} categorii: {categories}.',
    other: '{count} de categorii: {categories}.',
  },
  valueRange: 'Valori de la {min} la {max}.',
  labelledValueRange: '{label} de la {min} la {max}.',
} satisfies MessageCatalog;
