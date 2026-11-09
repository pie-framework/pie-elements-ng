import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'Alternativas de resposta',
  blankLabel: 'lacuna',
  emptyBlank: '(em branco)',
  blankPreSelectionHint: 'A resposta escolhida aparecerá na linha em branco acima.',
  correctAnswerSelected: 'Resposta correta selecionada',
  incorrectAnswerSelected: 'Resposta incorreta selecionada',
  selectedAnswerImage: 'Imagem da resposta selecionada',
  choiceImage: 'Opção {id}',
  clickToEnableAutoplay: 'Clicar para ativar a reprodução automática do áudio',
  audioResourceUnavailable:
    'O áudio está ativado, mas nenhuma URL de áudio reproduzível foi configurada.',
  listen: 'Ouvir',
  listenSilentAlt: 'Repetir as instruções',
  listenPlayingAlt: 'Instruções em reprodução',
  printAudio: 'Áudio:',
  printTranscript: 'Transcrição:',
  showCorrectAnswer: 'Mostrar resposta correta',
  hideCorrectAnswer: 'Ocultar resposta correta',
  showTeacherInstructions: 'Mostrar instruções do professor',
  hideTeacherInstructions: 'Ocultar instruções do professor',
} satisfies MessageCatalog;
