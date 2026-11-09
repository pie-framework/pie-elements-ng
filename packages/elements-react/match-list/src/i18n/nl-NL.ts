import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'Lijst met keuzes',
  answerA11y: 'Antwoord {id}',
  responseAreaForA11y: 'Antwoordvak voor {prompt}',
  responseAreaA11y: 'Antwoordvak {id}',
  dragInstructionsA11y: 'Met Spatie of Enter wordt deze antwoordkeuze opgepakt. Daarna gaat Tab of Shift+Tab langs de antwoordvakken en verplaatsen de pijltjestoetsen de keuze vrij. Met Spatie of Enter wordt de keuze neergezet, met Escape wordt het verplaatsen geannuleerd. Een antwoordkeuze kan ook worden geselecteerd door erop te klikken, waarna een klik op een antwoordvak de keuze daar plaatst.',
  pickedUpA11y: '{choice} opgepakt. Met Tab naar een ander antwoordvak gaan, daarna met Spatie of Enter neerzetten.',
  notOverResponseAreaA11y: '{choice} staat niet boven een antwoordvak.',
  overFilledA11y: 'Boven {target}. Bevat nu {choice}.',
  overEmptyA11y: 'Boven {target}. Nu leeg.',
  returnedA11y: '{choice} is teruggezet op de oorspronkelijke plek.',
  droppedA11y: '{choice} neergezet in {target}.',
  cancelledA11y: 'Geannuleerd. {choice} is teruggezet op de oorspronkelijke plek.',
} satisfies MessageCatalog;
