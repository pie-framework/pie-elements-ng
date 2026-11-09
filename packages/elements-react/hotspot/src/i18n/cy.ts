import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: "Wedi'i dewis yn gywir",
  shouldHaveBeenSelected: "Dylid bod wedi'i dewis",
  shouldNotHaveBeenSelected: "Ni ddylid bod wedi'i dewis",
  image: {
    zero: 'Delwedd gyda {count} o fannau gweithredol',
    one: 'Delwedd gyda {count} man gweithredol',
    two: 'Delwedd gyda {count} fan gweithredol',
    few: 'Delwedd gyda {count} man gweithredol',
    many: 'Delwedd gyda {count} man gweithredol',
    other: 'Delwedd gyda {count} o fannau gweithredol',
  },
  shape: 'Man gweithredol {index} o {total}',
} satisfies MessageCatalog;
