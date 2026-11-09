import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'Seleccionada correctamente',
  shouldHaveBeenSelected: 'Debía seleccionarse',
  shouldNotHaveBeenSelected: 'No debía seleccionarse',
  image: {
    one: 'Imagen con {count} zona activa',
    other: 'Imagen con {count} zonas activas',
  },
  shape: 'Zona activa {index} de {total}',
} satisfies MessageCatalog;
