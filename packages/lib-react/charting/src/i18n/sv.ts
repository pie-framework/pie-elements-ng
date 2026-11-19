import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: 'Åtgärder',
  add: 'Lägg till',
  delete: 'Ta bort',
  newLabel: 'Ny etikett',
  categoryLabel: 'Etikett för kategori {index}',
  categoryLabelValue: 'Etikett för kategori {index}: {label}',
  category: 'Kategori {index}',
  warning: 'Varning',
  reachedLimit: {
    one: 'Det får inte finnas fler än {count} kategori.',
    other: 'Det får inte finnas fler än {count} kategorier.',
  },
  key: 'Teckenförklaring',
  keyLegend: {
    incorrectAnswer: 'Elevens felaktiga svar',
    correctAnswer: 'Elevens rätta svar',
    correctKeyAnswer: 'Rätt enligt facit',
  },
  chartTypes: {
    bar: 'Stapeldiagram',
    histogram: 'Histogram',
    lineDot: 'Linjediagram med punkter',
    lineCross: 'Linjediagram med kryss',
    dotPlot: 'Punktdiagram',
    linePlot: 'Linjeplott',
  },
  categoriesNone: 'Inga kategorier.',
  categories: {
    one: '{count} kategori: {categories}.',
    other: '{count} kategorier: {categories}.',
  },
  valueRange: 'Värden från {min} till {max}.',
  labelledValueRange: '{label} från {min} till {max}.',
} satisfies MessageCatalog;
