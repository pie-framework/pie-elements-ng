import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: 'Fichas para classificar',
  unknownTarget: 'desconhecido',
  cancelled: 'Cancelado',
  returnedToTray: '{name} devolvido à bandeja',
  placedIn: '{name} colocado em {target}',
  pickedUp: '{name} selecionado',
  pickedUpWithKeyboard:
    '{name} selecionado, destino: {target}. Usar as setas para escolher um destino, Enter para soltar e Esc para cancelar.',
  dropTarget: 'Destino: {target}',
  unsupportedCircles: {
    one: 'Não é possível exibir este diagrama: ele tem {count} círculo, e apenas {supported} são aceitos.',
    many: 'Não é possível exibir este diagrama: ele tem {count} círculos, e apenas {supported} são aceitos.',
    other:
      'Não é possível exibir este diagrama: ele tem {count} círculos, e apenas {supported} são aceitos.',
  },
  setNumber: 'Conjunto {number}',
  regionOnly: 'Somente {set}',
  regionNeither: 'Nem {first} nem {second}',
  regionNoneOf: 'Nenhum de {sets}',
  regionAndSeparator: ' e ',
  listSeparator: ', ',
  tileFallbackName: 'Ficha',
  tileNotPlaced: 'não colocada',
  tileInRegion: 'em {region}',
  tileCorrect: 'correta',
  tileIncorrect: 'incorreta',
  showCorrectAnswer: 'Mostrar resposta correta',
  hideCorrectAnswer: 'Ocultar resposta correta',
  showTeacherInstructions: 'Mostrar instruções do professor',
  hideTeacherInstructions: 'Ocultar instruções do professor',
} satisfies MessageCatalog;
