import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'Advertencia',
  resetWarning: 'Se eliminarán todos los elementos agregados al gráfico y el gráfico volverá a su estado original. ¿Seguro que quieres continuar?',
  defineLinesFirst: 'Define la(s) línea(s) y luego selecciona un conjunto solución para la pregunta.',
  lineChangeWarning: "Si cambias una línea después de agregar un conjunto solución, se borrará el conjunto solución seleccionado. Haz clic en 'Borrar conjunto solución' para cambiar la línea. De lo contrario, haz clic en 'Cancelar'.",
  addLineAFirst: 'Agrega la Línea A al gráfico antes de agregar la Línea B',
  addLineBFirst: 'Agrega la Línea B al gráfico antes de cambiar a la Línea A',
  clearSolutionSet: 'Borrar conjunto solución',
  confirm: 'Aceptar',
  cancel: 'Cancelar',
} satisfies MessageCatalog;
