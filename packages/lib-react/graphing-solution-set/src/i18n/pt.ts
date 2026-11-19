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
} satisfies MessageCatalog;
