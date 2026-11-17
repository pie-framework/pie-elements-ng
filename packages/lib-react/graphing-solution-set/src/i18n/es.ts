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
  lineStyleCorrect: 'Estilo de línea correcto: {style}',
  lineStyleIncorrect: 'Estilo de línea incorrecto: dibujada {drawn}, esperada {expected}',
  regionVerdict: {
    correct: 'Región sombreada correcta',
    incorrect: 'Región sombreada incorrecta',
    missing: 'Región sombreada en la clave de respuesta, no sombreada',
  },
  key: 'Clave',
  keyLegend: {
    studentCorrect: 'Respuesta correcta del estudiante',
    studentIncorrect: 'Respuesta incorrecta del estudiante',
    answerKeyCorrect: 'Clave de respuesta correcta',
    lineStyleCorrect: 'Estilo de línea correcto',
    lineStyleIncorrect: 'Estilo de línea incorrecto',
  },
} satisfies MessageCatalog;
