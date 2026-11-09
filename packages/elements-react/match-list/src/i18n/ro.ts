import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'Lista de variante',
  answerA11y: 'Răspunsul {id}',
  responseAreaForA11y: 'Zona de răspuns pentru {prompt}',
  responseAreaA11y: 'Zona de răspuns {id}',
  dragInstructionsA11y: 'Apasă Spațiu sau Enter pentru a ridica această variantă de răspuns. După ce ai ridicat-o, folosește Tab sau Shift+Tab pentru a trece prin zonele de răspuns sau tastele săgeți pentru a o muta liber. Apasă Spațiu sau Enter pentru a o plasa sau Escape pentru a anula. Poți, de asemenea, să dai clic pe o variantă de răspuns pentru a o selecta, apoi pe o zonă de răspuns pentru a o plasa acolo.',
  pickedUpA11y: 'Ai ridicat {choice}. Folosește Tab pentru a trece de la o zonă de răspuns la alta, apoi apasă Spațiu sau Enter pentru a plasa.',
  notOverResponseAreaA11y: '{choice} nu se află deasupra unei zone de răspuns.',
  overFilledA11y: 'Deasupra: {target}. Conține acum {choice}.',
  overEmptyA11y: 'Deasupra: {target}. Nu conține nimic momentan.',
  returnedA11y: '{choice} a revenit la poziția inițială.',
  droppedA11y: 'Ai plasat {choice} în {target}.',
  cancelledA11y: 'Anulat. {choice} a revenit la poziția inițială.',
} satisfies MessageCatalog;
