import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'Correct geselecteerd',
  shouldHaveBeenSelected: 'Had geselecteerd moeten worden',
  shouldNotHaveBeenSelected: 'Had niet geselecteerd moeten worden',
  image: {
    one: 'Afbeelding met {count} hotspot',
    other: 'Afbeelding met {count} hotspots',
  },
  shape: 'Hotspot {index} van {total}',
} satisfies MessageCatalog;
