import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  dragInstructions: 'Tryck på blanksteg eller Enter för att plocka upp svarsalternativet. När det är upplockat använder du Tabb eller Skift+Tabb för att gå mellan svarsområdena, eller piltangenterna för att flytta det fritt. Tryck på blanksteg eller Enter för att släppa det, eller på Esc för att avbryta.',
  commonCorrectAnswerWithAlternates: 'Obs! Svaret som visas ovan är det vanligaste rätta svaret på uppgiften. Ett eller flera ytterligare rätta svar har också angetts, och även de räknas som rätt.',
  readingInstructions: 'Bygg en sorterad lista genom att flytta varje objekt till rätt position. Använd Tabb för att flytta mellan objekt och släppområden, Enter för att markera eller släppa och Esc för att avbryta.',
  objectsAreOnSortedList: {
    one: '{sorted} av {total} objekt finns i den sorterade listan.',
    other: '{sorted} av {total} objekt finns i den sorterade listan.',
  },
  unsortedObjects: {
    one: '{count} osorterat objekt',
    other: '{count} osorterade objekt',
  },
  sortedObjects: {
    one: '{count} sorterat objekt',
    other: '{count} sorterade objekt',
  },
  unsortedObjectPrefix: 'objekt:',
  sortedObjectPrefix: 'Position {position}:',
  endOfUnsorted: 'Slut på osorterade objekt',
  endOfSorted: 'Slut på sorterade objekt.',
  useTabToObject: 'Använd Tabb för att gå till ett objekt.',
  unsortedObjectFocus: 'Osorterat objekt {text} Tryck på Enter för att markera eller på Tabb för att gå till ett annat objekt.',
  sortedObjectFocus: 'Sorterat objekt {text} På position {position} av {total}. Tryck på Enter för att markera eller på Tabb för att gå till ett annat objekt',
  emptyPositionFocus: 'På position {position} av {total}, som är tom. Tryck på Enter för att flytta det markerade objektet {text} hit eller använd Tabb för att gå till en annan position.',
  occupiedPositionFocus: 'På position {position} av {total}, som innehåller objektet {occupant}. Använd Tabb för att gå till en annan position eller tryck på Enter för att flytta det markerade objektet {text} hit, vilket skickar tillbaka objektet som nu ligger på position {position} till den osorterade listan.',
  unsortedListReturnFocus: 'I den osorterade listan. Tryck på Enter för att skicka tillbaka det markerade objektet {text} till osorterade eller använd Tabb för att gå till en position.',
  unsortedListLeaveFocus: 'I den osorterade listan. Tryck på Enter för att låta objektet {text} vara osorterat eller använd Tabb för att gå till en position.',
  selectedUnsorted: 'Markerat objekt {text} Använd Tabb för att gå till en position i den sorterade listan.',
  selectedSorted: 'Markerat objekt {text}, som ligger på position {position} av {total}. Använd Tabb för att gå till en annan position.',
  placed: 'Objektet {text} placerades på position {position} av {total}.',
  moved: 'Objektet {text} flyttades från position {from} till position {to}.',
  removed: 'Objektet {text} togs bort från position {position}.',
  returnedToUnsorted: 'Objektet {text} har skickats tillbaka till den osorterade listan.',
  answerComplete: {
    one: 'Svaret är komplett. {total} av {total} objekt i den sorterade listan.',
    other: 'Svaret är komplett. {total} av {total} objekt i den sorterade listan.',
  },
  objectsOnSortedList: {
    one: '{sorted} av {total} objekt i den sorterade listan.',
    other: '{sorted} av {total} objekt i den sorterade listan.',
  },
  useTabToAnotherObject: 'Använd Tabb för att gå till ett annat objekt.',
  noLongerSelected: 'Objektet {text} är inte längre markerat.',
} satisfies MessageCatalog;
