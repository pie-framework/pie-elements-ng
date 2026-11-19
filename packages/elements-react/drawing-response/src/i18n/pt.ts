import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'Cor de preenchimento',
  outlineColor: 'Cor do contorno',
  colors: {
    noFill: 'Sem preenchimento',
    lightblue: 'Azul-claro',
    lightyellow: 'Amarelo-claro',
    red: 'Vermelho',
    orange: 'Laranja',
    yellow: 'Amarelo',
    violet: 'Violeta',
    blue: 'Azul',
    green: 'Verde',
    white: 'Branco',
    black: 'Preto',
  },
  onDoubleClick: 'Clique duas vezes para editar este texto. Pressione Enter para confirmar.',
  drawingArea: 'Área de desenho',
  drawingAreaOverImage: 'Área de desenho sobre uma imagem de fundo',
  tools: {
    select: 'Selecionar',
    freeDraw: 'Desenho livre',
    line: 'Linha',
    rectangle: 'Retângulo',
    circle: 'Círculo',
    textEntry: 'Inserir texto',
    eraser: 'Borracha',
  },
  undo: 'Desfazer',
  clearAll: 'Limpar tudo',
  renderError: 'Ocorreu um erro: {message}',
} satisfies MessageCatalog;
