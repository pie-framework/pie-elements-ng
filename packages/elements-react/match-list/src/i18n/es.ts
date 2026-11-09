import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'Lista de opciones',
  answerA11y: 'Respuesta {id}',
  responseAreaForA11y: 'Área de respuesta para {prompt}',
  responseAreaA11y: 'Área de respuesta {id}',
  dragInstructionsA11y: 'Presiona Espacio o Intro para tomar esta opción de respuesta. Una vez tomada, usa Tab o Mayús+Tab para recorrer las áreas de respuesta, o usa las teclas de flecha para moverla libremente. Presiona Espacio o Intro para soltarla, o Escape para cancelar. También puedes hacer clic en una opción de respuesta para seleccionarla y luego hacer clic en un área de respuesta para colocarla allí.',
  pickedUpA11y: 'Se tomó {choice}. Usa Tab para moverte entre las áreas de respuesta y luego presiona Espacio o Intro para soltarla.',
  notOverResponseAreaA11y: '{choice} no está sobre un área de respuesta.',
  overFilledA11y: 'Sobre {target}. Actualmente contiene {choice}.',
  overEmptyA11y: 'Sobre {target}. Actualmente no contiene nada.',
  returnedA11y: '{choice} volvió a su posición original.',
  droppedA11y: 'Se soltó {choice} en {target}.',
  cancelledA11y: 'Cancelado. {choice} volvió a su posición original.',
} satisfies MessageCatalog;
