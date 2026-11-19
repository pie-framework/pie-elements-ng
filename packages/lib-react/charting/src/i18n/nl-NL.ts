import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: 'Acties',
  add: 'Toevoegen',
  delete: 'Verwijderen',
  newLabel: 'Nieuw label',
  categoryLabel: 'Label van categorie {index}',
  categoryLabelValue: 'Label van categorie {index}: {label}',
  category: 'Categorie {index}',
  warning: 'Waarschuwing',
  reachedLimit: {
    one: 'Er kan niet meer dan {count} categorie zijn.',
    other: 'Er kunnen niet meer dan {count} categorieën zijn.',
  },
  key: 'Legenda',
  keyLegend: {
    incorrectAnswer: 'Onjuist antwoord van de leerling',
    correctAnswer: 'Juist antwoord van de leerling',
    correctKeyAnswer: 'Juist volgens de antwoordsleutel',
  },
  chartTypes: {
    bar: 'Staafdiagram',
    histogram: 'Histogram',
    lineDot: 'Lijndiagram met punten',
    lineCross: 'Lijndiagram met kruisjes',
    dotPlot: 'Stippendiagram',
    linePlot: 'Lijnplot',
  },
  categoriesNone: 'Geen categorieën.',
  categories: {
    one: '{count} categorie: {categories}.',
    other: '{count} categorieën: {categories}.',
  },
  valueRange: 'Waarden van {min} tot {max}.',
  labelledValueRange: '{label} van {min} tot {max}.',
} satisfies MessageCatalog;
