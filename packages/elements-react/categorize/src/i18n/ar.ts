import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'تحذير',
  limitMaxChoicesPerCategory: 'لقد بلغت الحد الأقصى لعدد الإجابات في كل منطقة ({maxChoicesPerCategory}). لإضافة إجابة أخرى، يجب إزالة إجابة أولًا.',
  cancel: 'إلغاء',
  commonCorrectAnswerWithAlternates: 'ملاحظة: الإجابة المعروضة أعلاه هي الإجابة الصحيحة الأكثر شيوعًا لهذا السؤال. توجد أيضًا إجابة صحيحة إضافية واحدة أو أكثر، وستُعدّ صحيحة كذلك.',
} satisfies MessageCatalog;
