import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'Gráfico no plano cartesiano',
  axisRange: 'Eixo {axis} de {min} a {max}.',
  plottedNone: 'Nenhum objeto traçado.',
  plotted: {
    one: '{count} objeto traçado: {marks}.',
    many: '{count} objetos traçados: {marks}.',
    other: '{count} objetos traçados: {marks}.',
  },
  line: 'Reta',
  shadedRegion: 'Região sombreada',
  label: 'Rótulo',
  markLabel: 'Rótulo no ponto ({x}; {y})',
  reset: 'Redefinir',
  lineA: 'Reta A',
  lineB: 'Reta B',
  solutionSet: 'Conjunto solução',
  solid: 'Contínua',
  dashed: 'Tracejada',
  lineStyleCorrect: 'Estilo da reta correto: {style}',
  lineStyleIncorrect: 'Estilo da reta incorreto: desenhada {drawn}, esperada {expected}',
  regionVerdict: {
    correct: 'Região sombreada correta',
    incorrect: 'Região sombreada incorreta',
    missing: 'Região sombreada do gabarito, não sombreada',
  },
  key: 'Legenda',
  keyLegend: {
    studentCorrect: 'Resposta correta do estudante',
    studentIncorrect: 'Resposta incorreta do estudante',
    answerKeyCorrect: 'Correto segundo o gabarito',
    lineStyleCorrect: 'Estilo da reta correto',
    lineStyleIncorrect: 'Estilo da reta incorreto',
  },
} satisfies MessageCatalog;
