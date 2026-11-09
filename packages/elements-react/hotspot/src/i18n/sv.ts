import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'Rätt markerad',
  shouldHaveBeenSelected: 'Borde ha markerats',
  shouldNotHaveBeenSelected: 'Borde inte ha markerats',
  image: {
    one: 'Bild med {count} aktivt område',
    other: 'Bild med {count} aktiva områden',
  },
  shape: 'Aktivt område {index} av {total}',
} satisfies MessageCatalog;
