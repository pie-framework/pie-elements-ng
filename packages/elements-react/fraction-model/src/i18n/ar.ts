import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    zero: 'النموذج {index} من {total}: تم تحديد {selected} من أصل {count} جزء',
    one: 'النموذج {index} من {total}: تم تحديد {selected} من أصل جزء واحد ({count})',
    two: 'النموذج {index} من {total}: تم تحديد {selected} من أصل جزأين ({count})',
    few: 'النموذج {index} من {total}: تم تحديد {selected} من أصل {count} أجزاء',
    many: 'النموذج {index} من {total}: تم تحديد {selected} من أصل {count} جزءًا',
    other: 'النموذج {index} من {total}: تم تحديد {selected} من أصل {count} جزء',
  },
  numberOfModels: 'عدد النماذج',
  partsPerModel: 'عدد الأجزاء في كل نموذج',
  warningTitle: 'تحذير',
  answerChangeWarning: 'سيؤدي تغيير عدد النماذج أو عدد الأجزاء في كل نموذج إلى حذف الإجابة المضافة. هل تريد المتابعة؟',
  confirm: 'موافق',
  cancel: 'إلغاء',
} satisfies MessageCatalog;
