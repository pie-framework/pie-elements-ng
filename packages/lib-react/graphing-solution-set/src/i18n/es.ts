import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'Gráfica de coordenadas',
  axisRange: 'Eje {axis} de {min} a {max}.',
  plottedNone: 'Nada trazado.',
  plotted: {
    one: '{count} objeto trazado: {marks}.',
    other: '{count} objetos trazados: {marks}.',
  },
  line: 'Línea',
  shadedRegion: 'Región sombreada',
  label: 'Etiqueta',
  markLabel: 'Etiqueta en ({x}, {y})',
  reset: 'Reiniciar',
  lineA: 'Línea A',
  lineB: 'Línea B',
  solutionSet: 'Conjunto solución',
  solid: 'Continua',
  dashed: 'Discontinua',
} satisfies MessageCatalog;
