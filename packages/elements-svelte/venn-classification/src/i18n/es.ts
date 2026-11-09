import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: 'Fichas para clasificar',
  unknownTarget: 'desconocido',
  cancelled: 'Cancelado',
  returnedToTray: 'Se devolvió {name} a la bandeja',
  placedIn: 'Se colocó {name} en {target}',
  pickedUp: 'Se tomó {name}',
  pickedUpWithKeyboard:
    'Se tomó {name}, destino: {target}. Usa las flechas para elegir un destino, Enter para soltar y Escape para cancelar.',
  dropTarget: 'Destino: {target}',
  unsupportedCircles: {
    one: 'No se puede mostrar este diagrama: tiene {count} círculo, y solo se admiten {supported}.',
    other:
      'No se puede mostrar este diagrama: tiene {count} círculos, y solo se admiten {supported}.',
  },
  setNumber: 'Conjunto {number}',
  regionOnly: 'Solo {set}',
  regionNeither: 'Ni {first} ni {second}',
  regionNoneOf: 'Ninguno de {sets}',
  regionAndSeparator: ' y ',
  listSeparator: ', ',
  tileFallbackName: 'Ficha',
  tileNotPlaced: 'sin colocar',
  tileInRegion: 'en {region}',
  tileCorrect: 'correcta',
  tileIncorrect: 'incorrecta',
  showCorrectAnswer: 'Mostrar respuesta correcta',
  hideCorrectAnswer: 'Ocultar respuesta correcta',
  showTeacherInstructions: 'Mostrar instrucciones para el maestro',
  hideTeacherInstructions: 'Ocultar instrucciones para el maestro',
} satisfies MessageCatalog;
