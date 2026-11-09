import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    one: 'Modelo {index} de {total}: {selected} de {count} parte seleccionada',
    other: 'Modelo {index} de {total}: {selected} de {count} partes seleccionadas',
  },
  numberOfModels: 'Número de modelos',
  partsPerModel: 'Partes por modelo',
  warningTitle: 'Advertencia',
  answerChangeWarning: 'Si cambias el número de modelos o las partes por modelo, se eliminará la respuesta agregada. ¿Seguro que quieres continuar?',
  confirm: 'Aceptar',
  cancel: 'Cancelar',
} satisfies MessageCatalog;
