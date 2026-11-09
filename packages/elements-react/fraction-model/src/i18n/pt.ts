import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    one: 'Modelo {index} de {total}: {selected} de {count} parte selecionada',
    many: 'Modelo {index} de {total}: {selected} de {count} partes selecionadas',
    other: 'Modelo {index} de {total}: {selected} de {count} partes selecionadas',
  },
  numberOfModels: 'Número de modelos',
  partsPerModel: 'Partes por modelo',
  warningTitle: 'Aviso',
  answerChangeWarning: 'Alterar o número de modelos ou de partes por modelo removerá a resposta adicionada. Tem certeza de que deseja continuar?',
  confirm: 'OK',
  cancel: 'Cancelar',
} satisfies MessageCatalog;
