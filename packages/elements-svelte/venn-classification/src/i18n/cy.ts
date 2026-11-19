import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: "Teils i'w dosbarthu",
  unknownTarget: 'anhysbys',
  cancelled: 'Wedi canslo',
  returnedToTray: "{name} wedi'i ddychwelyd i'r hambwrdd",
  placedIn: "{name} wedi'i osod yn {target}",
  pickedUp: 'Wedi codi {name}',
  pickedUpWithKeyboard:
    'Wedi codi {name}, targed gollwng: {target}. Defnyddiwch y bysellau saeth i ddewis targed gollwng, Enter i ollwng, Escape i ganslo.',
  dropTarget: 'Targed gollwng: {target}',
  unsupportedCircles: {
    zero: "Does dim modd dangos y diagram hwn: mae ganddo {count} cylch, a dim ond {supported} sy'n cael eu cefnogi.",
    one: "Does dim modd dangos y diagram hwn: mae ganddo {count} cylch, a dim ond {supported} sy'n cael eu cefnogi.",
    two: "Does dim modd dangos y diagram hwn: mae ganddo {count} gylch, a dim ond {supported} sy'n cael eu cefnogi.",
    few: "Does dim modd dangos y diagram hwn: mae ganddo {count} chylch, a dim ond {supported} sy'n cael eu cefnogi.",
    many: "Does dim modd dangos y diagram hwn: mae ganddo {count} chylch, a dim ond {supported} sy'n cael eu cefnogi.",
    other:
      "Does dim modd dangos y diagram hwn: mae ganddo {count} cylch, a dim ond {supported} sy'n cael eu cefnogi.",
  },
  setNumber: 'Set {number}',
  regionOnly: '{set} yn unig',
  regionNeither: 'Nid {first} na {second}',
  regionNoneOf: 'Dim un o {sets}',
  regionAndSeparator: ' a ',
  listSeparator: ', ',
  tileFallbackName: 'Teilsen',
  tileNotPlaced: 'heb ei gosod',
  tileInRegion: 'yn {region}',
  tileCorrect: 'cywir',
  tileIncorrect: 'anghywir',
  showCorrectAnswer: 'Dangos yr ateb cywir',
  hideCorrectAnswer: "Cuddio'r ateb cywir",
  showTeacherInstructions: "Dangos cyfarwyddiadau'r athro",
  hideTeacherInstructions: "Cuddio cyfarwyddiadau'r athro",
} satisfies MessageCatalog;
