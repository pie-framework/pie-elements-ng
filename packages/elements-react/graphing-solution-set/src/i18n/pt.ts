import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'Aviso',
  resetWarning: 'Isso removerá todos os elementos adicionados ao gráfico e restaurará o gráfico ao estado original. Tem certeza de que deseja continuar?',
  defineLinesFirst: 'Defina a(s) reta(s) e depois selecione um conjunto solução para a questão.',
  lineChangeWarning: "Alterar uma reta depois de adicionar um conjunto solução limpará o conjunto solução selecionado. Clique em 'Limpar conjunto solução' para alterar a reta. Caso contrário, clique em 'Cancelar'.",
  addLineAFirst: 'Adicione a Reta A ao gráfico antes de adicionar a Reta B',
  addLineBFirst: 'Adicione a Reta B ao gráfico antes de mudar para a Reta A',
  clearSolutionSet: 'Limpar conjunto solução',
  confirm: 'OK',
  cancel: 'Cancelar',
} satisfies MessageCatalog;
