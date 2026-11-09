import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'Correctly selected',
  shouldHaveBeenSelected: 'Should have been selected',
  shouldNotHaveBeenSelected: 'Should not have been selected',
  image: {
    one: 'Image with {count} hotspot',
    other: 'Image with {count} hotspots',
  },
  shape: 'Hotspot {index} of {total}',
} satisfies MessageCatalog;
