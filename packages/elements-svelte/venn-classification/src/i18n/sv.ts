import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: 'Brickor att sortera',
  unknownTarget: 'okänt',
  cancelled: 'Avbrutet',
  returnedToTray: '{name} tillbaka i facket',
  placedIn: '{name} placerad i {target}',
  pickedUp: 'Tog upp {name}',
  pickedUpWithKeyboard:
    'Tog upp {name}, släppmål: {target}. Använd piltangenterna för att välja ett släppmål, Enter för att släppa och Esc för att avbryta.',
  dropTarget: 'Släppmål: {target}',
  unsupportedCircles: {
    one: 'Diagrammet kan inte visas: det har {count} cirkel, och endast {supported} stöds.',
    other: 'Diagrammet kan inte visas: det har {count} cirklar, och endast {supported} stöds.',
  },
  setNumber: 'Mängd {number}',
  regionOnly: 'Endast {set}',
  regionNeither: 'Varken {first} eller {second}',
  regionNoneOf: 'Ingen av {sets}',
  regionAndSeparator: ' och ',
  listSeparator: ', ',
  tileFallbackName: 'Bricka',
  tileNotPlaced: 'inte placerad',
  tileInRegion: 'i {region}',
  tileCorrect: 'rätt',
  tileIncorrect: 'fel',
  showCorrectAnswer: 'Visa rätt svar',
  hideCorrectAnswer: 'Dölj rätt svar',
  showTeacherInstructions: 'Visa lärarinstruktioner',
  hideTeacherInstructions: 'Dölj lärarinstruktioner',
} satisfies MessageCatalog;
