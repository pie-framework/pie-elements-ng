import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'تحذير',
  resetWarning: 'سيؤدي هذا إلى إزالة جميع العناصر المضافة إلى التمثيل البياني وإعادته إلى حالته الأصلية. هل تريد المتابعة؟',
  defineLinesFirst: 'يُرجى تحديد المستقيم أو المستقيمات أولًا، ثم اختيار مجموعة الحل لهذا السؤال.',
  lineChangeWarning: 'سيؤدي تغيير مستقيم بعد إضافة مجموعة الحل إلى مسح مجموعة الحل المحددة. انقر على «مسح مجموعة الحل» لتغيير المستقيم، أو انقر على «إلغاء».',
  addLineAFirst: 'يُرجى إضافة المستقيم A إلى التمثيل البياني قبل إضافة المستقيم B',
  addLineBFirst: 'يُرجى إضافة المستقيم B إلى التمثيل البياني قبل التبديل إلى المستقيم A',
  clearSolutionSet: 'مسح مجموعة الحل',
  confirm: 'موافق',
  cancel: 'إلغاء',
} satisfies MessageCatalog;
