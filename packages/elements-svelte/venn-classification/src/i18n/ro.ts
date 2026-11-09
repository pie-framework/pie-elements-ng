import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: 'Plăcuțe de clasificat',
  unknownTarget: 'necunoscut',
  cancelled: 'Anulat',
  returnedToTray: '{name} a revenit în tavă',
  placedIn: '{name} a fost plasat în {target}',
  pickedUp: 'Ai ridicat {name}',
  pickedUpWithKeyboard:
    'Ai ridicat {name}, țintă: {target}. Folosește săgețile pentru a alege o țintă, Enter pentru a plasa, Escape pentru a anula.',
  dropTarget: 'Țintă: {target}',
  unsupportedCircles: {
    one: 'Această diagramă nu poate fi afișată: are {count} cerc și sunt acceptate doar {supported}.',
    few: 'Această diagramă nu poate fi afișată: are {count} cercuri și sunt acceptate doar {supported}.',
    other:
      'Această diagramă nu poate fi afișată: are {count} de cercuri și sunt acceptate doar {supported}.',
  },
  setNumber: 'Mulțimea {number}',
  regionOnly: 'Doar {set}',
  regionNeither: 'Nici {first}, nici {second}',
  regionNoneOf: 'Niciuna dintre {sets}',
  regionAndSeparator: ' și ',
  listSeparator: ', ',
  tileFallbackName: 'Plăcuță',
  tileNotPlaced: 'neplasată',
  tileInRegion: 'în {region}',
  tileCorrect: 'corectă',
  tileIncorrect: 'greșită',
  showCorrectAnswer: 'Afișează răspunsul corect',
  hideCorrectAnswer: 'Ascunde răspunsul corect',
  showTeacherInstructions: 'Afișează instrucțiunile pentru profesor',
  hideTeacherInstructions: 'Ascunde instrucțiunile pentru profesor',
} satisfies MessageCatalog;
