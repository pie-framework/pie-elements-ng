import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'Sélectionnée correctement',
  shouldHaveBeenSelected: 'Aurait dû être sélectionnée',
  shouldNotHaveBeenSelected: "N'aurait pas dû être sélectionnée",
  image: {
    one: 'Image avec {count} zone interactive',
    many: 'Image avec {count} zones interactives',
    other: 'Image avec {count} zones interactives',
  },
  shape: 'Zone interactive {index} sur {total}',
} satisfies MessageCatalog;
