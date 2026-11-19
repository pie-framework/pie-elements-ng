import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: 'Ações',
  add: 'Adicionar',
  delete: 'Excluir',
  newLabel: 'Novo rótulo',
  categoryLabel: 'Rótulo da categoria {index}',
  categoryLabelValue: 'Rótulo da categoria {index}: {label}',
  category: 'Categoria {index}',
  warning: 'Aviso',
  reachedLimit: {
    one: 'Não pode haver mais de {count} categoria.',
    many: 'Não pode haver mais de {count} categorias.',
    other: 'Não pode haver mais de {count} categorias.',
  },
  key: 'Legenda',
  keyLegend: {
    incorrectAnswer: 'Resposta incorreta do estudante',
    correctAnswer: 'Resposta correta do estudante',
    correctKeyAnswer: 'Correto segundo o gabarito',
  },
  chartTypes: {
    bar: 'Gráfico de barras',
    histogram: 'Histograma',
    lineDot: 'Gráfico de linhas com pontos',
    lineCross: 'Gráfico de linhas com cruzes',
    dotPlot: 'Diagrama de pontos',
    linePlot: 'Diagrama de linha',
  },
  categoriesNone: 'Nenhuma categoria.',
  categories: {
    one: '{count} categoria: {categories}.',
    many: '{count} categorias: {categories}.',
    other: '{count} categorias: {categories}.',
  },
  valueRange: 'Valores de {min} a {max}.',
  labelledValueRange: '{label}: de {min} a {max}.',
} satisfies MessageCatalog;
