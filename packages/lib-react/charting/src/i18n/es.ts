import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: 'Acciones',
  add: 'Añadir',
  delete: 'Eliminar',
  newLabel: 'Nueva etiqueta',
  categoryLabel: 'Etiqueta de la categoría {index}',
  categoryLabelValue: 'Etiqueta de la categoría {index}: {label}',
  category: 'Categoría {index}',
  warning: 'Advertencia',
  reachedLimit: {
    other: 'No puede haber más de {count} categorías.',
  },
  key: 'Clave',
  keyLegend: {
    incorrectAnswer: 'Respuesta incorrecta del estudiante',
    correctAnswer: 'Respuesta correcta del estudiante',
    correctKeyAnswer: 'Clave de respuesta correcta',
  },
  chartTypes: {
    bar: 'Gráfico de barras',
    histogram: 'Histograma',
    lineDot: 'Gráfico de líneas con puntos',
    lineCross: 'Gráfico de líneas con cruces',
    dotPlot: 'Diagrama de puntos',
    linePlot: 'Diagrama de líneas',
  },
  categoriesNone: 'Sin categorías.',
  categories: {
    one: '{count} categoría: {categories}.',
    other: '{count} categorías: {categories}.',
  },
  valueRange: 'Valores de {min} a {max}.',
  labelledValueRange: '{label} de {min} a {max}.',
} satisfies MessageCatalog;
