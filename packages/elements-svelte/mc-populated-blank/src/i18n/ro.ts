import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'Variante de răspuns',
  blankLabel: 'spațiu liber',
  emptyBlank: '(liber)',
  blankPreSelectionHint: 'Răspunsul pe care îl alegi va apărea pe linia liberă de mai sus.',
  correctAnswerSelected: 'Răspuns corect selectat',
  incorrectAnswerSelected: 'Răspuns greșit selectat',
  selectedAnswerImage: 'Imaginea răspunsului selectat',
  choiceImage: 'Varianta {id}',
  clickToEnableAutoplay: 'Fă clic pentru a activa redarea automată a sunetului',
  audioResourceUnavailable:
    'Sunetul este activat, dar nu este configurată nicio adresă URL audio care poate fi redată.',
  listen: 'Ascultă',
  listenSilentAlt: 'Repetă instrucțiunile',
  listenPlayingAlt: 'Instrucțiunile sunt redate',
  printAudio: 'Audio:',
  printTranscript: 'Transcriere:',
  showCorrectAnswer: 'Afișează răspunsul corect',
  hideCorrectAnswer: 'Ascunde răspunsul corect',
  showTeacherInstructions: 'Afișează instrucțiunile pentru profesor',
  hideTeacherInstructions: 'Ascunde instrucțiunile pentru profesor',
} satisfies MessageCatalog;
