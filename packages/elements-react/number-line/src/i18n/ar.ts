import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    zero: 'لا يمكن إضافة أكثر من {count} عنصر.',
    one: 'لا يمكن إضافة أكثر من عنصر واحد ({count}).',
    two: 'لا يمكن إضافة أكثر من عنصرين ({count}).',
    few: 'لا يمكن إضافة أكثر من {count} عناصر.',
    many: 'لا يمكن إضافة أكثر من {count} عنصرًا.',
    other: 'لا يمكن إضافة أكثر من {count} عنصر.',
  },
  undo: 'تراجع',
  clearAll: 'مسح الكل',
  graphLabel: 'خط الأعداد من {min} إلى {max}، مع علامة كل {interval}',
  closedEnd: 'مغلق',
  openEnd: 'مفتوح',
  elementCorrect: 'صحيح.',
  elementIncorrect: 'غير صحيح.',
  line: 'قطعة مستقيمة من {left} ({leftEnd}) إلى {right} ({rightEnd}).',
  plottedNone: 'لم يُرسم أي شيء.',
  pointClosed: 'نقطة مغلقة عند {position}.',
  pointOpen: 'نقطة مفتوحة عند {position}.',
  rayLeft: 'شعاع من {position} ({end}) نحو اليسار.',
  rayRight: 'شعاع من {position} ({end}) نحو اليمين.',
} satisfies MessageCatalog;
