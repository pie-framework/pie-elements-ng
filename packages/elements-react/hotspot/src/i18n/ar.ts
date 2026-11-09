import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'تم التحديد بشكل صحيح',
  shouldHaveBeenSelected: 'كان يجب تحديدها',
  shouldNotHaveBeenSelected: 'ما كان يجب تحديدها',
  image: {
    zero: 'صورة بلا مناطق نشطة ({count})',
    one: 'صورة بها منطقة نشطة واحدة ({count})',
    two: 'صورة بها منطقتان نشطتان ({count})',
    few: 'صورة بها {count} مناطق نشطة',
    many: 'صورة بها {count} منطقةً نشطة',
    other: 'صورة بها {count} منطقة نشطة',
  },
  shape: 'المنطقة النشطة {index} من {total}',
} satisfies MessageCatalog;
