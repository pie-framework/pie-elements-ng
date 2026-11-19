import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'Opciones de respuesta',
  blankLabel: 'espacio en blanco',
  emptyBlank: '(en blanco)',
  blankPreSelectionHint: 'La respuesta que elijas aparecerá en la línea en blanco de arriba.',
  correctAnswerSelected: 'Respuesta correcta seleccionada',
  incorrectAnswerSelected: 'Respuesta incorrecta seleccionada',
  selectedAnswerImage: 'Imagen de la respuesta seleccionada',
  choiceImage: 'Opción {id}',
  clickToEnableAutoplay: 'Haz clic para activar la reproducción automática del audio',
  audioResourceUnavailable:
    'El audio está activado, pero no hay una URL de audio reproducible configurada.',
  listen: 'Escuchar',
  listenSilentAlt: 'Escuchar. Repetir las instrucciones.',
  listenPlayingAlt: 'Escuchar. Estas son las instrucciones.',
  printAudio: 'Audio:',
  printTranscript: 'Transcripción:',
  showCorrectAnswer: 'Mostrar respuesta correcta',
  hideCorrectAnswer: 'Ocultar respuesta correcta',
  showTeacherInstructions: 'Mostrar instrucciones para el maestro',
  hideTeacherInstructions: 'Ocultar instrucciones para el maestro',
} satisfies MessageCatalog;
