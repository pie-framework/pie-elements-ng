import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Opción de respuesta {index} de {total}',
  image: {
    one: 'Imagen con {count} área de respuesta',
    other: 'Imagen con {count} áreas de respuesta',
  },
  reachedLimit: {
    one: 'Has alcanzado el límite de {count} respuesta por área. Para agregar otra respuesta, primero se debe eliminar una respuesta.',
    other: 'Lleno',
  },
  responseArea: 'Área de respuesta {index} de {total}',
} satisfies MessageCatalog;
