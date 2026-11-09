import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: 'Tegels om in te delen',
  unknownTarget: 'onbekend',
  cancelled: 'Geannuleerd',
  returnedToTray: '{name} teruggezet in het vak',
  placedIn: '{name} geplaatst in {target}',
  pickedUp: '{name} opgepakt',
  pickedUpWithKeyboard:
    '{name} opgepakt, doel: {target}. Kies met de pijltjestoetsen een doel, druk op Enter om neer te zetten of op Esc om te annuleren.',
  dropTarget: 'Doel: {target}',
  unsupportedCircles: {
    one: 'Dit diagram kan niet worden weergegeven: het heeft {count} cirkel, en alleen {supported} worden ondersteund.',
    other:
      'Dit diagram kan niet worden weergegeven: het heeft {count} cirkels, en alleen {supported} worden ondersteund.',
  },
  setNumber: 'Verzameling {number}',
  regionOnly: 'Alleen {set}',
  regionNeither: 'Noch {first} noch {second}',
  regionNoneOf: 'Geen van {sets}',
  regionAndSeparator: ' en ',
  listSeparator: ', ',
  tileFallbackName: 'Tegel',
  tileNotPlaced: 'niet geplaatst',
  tileInRegion: 'in {region}',
  tileCorrect: 'juist',
  tileIncorrect: 'onjuist',
  showCorrectAnswer: 'Juist antwoord weergeven',
  hideCorrectAnswer: 'Juist antwoord verbergen',
  showTeacherInstructions: 'Instructies voor de leraar weergeven',
  hideTeacherInstructions: 'Instructies voor de leraar verbergen',
} satisfies MessageCatalog;
