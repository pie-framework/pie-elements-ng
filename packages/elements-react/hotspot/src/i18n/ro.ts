import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'Selectată corect',
  shouldHaveBeenSelected: 'Trebuia selectată',
  shouldNotHaveBeenSelected: 'Nu trebuia selectată',
  image: {
    one: 'Imagine cu {count} zonă activă',
    few: 'Imagine cu {count} zone active',
    other: 'Imagine cu {count} de zone active',
  },
  shape: 'Zona activă {index} din {total}',
} satisfies MessageCatalog;
