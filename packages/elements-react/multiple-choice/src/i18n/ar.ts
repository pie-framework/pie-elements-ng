import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'سؤال الاختيار من متعدد',
  multipleCorrectAnswerQuestion: 'سؤال متعدد الإجابات الصحيحة',
  multipleSelectQuestion: 'سؤال التحديد المتعدد',
  minSelections: 'اختر {minSelections} على الأقل.',
  minmaxSelectionsEqual: 'اختر {minSelections}.',
  minmaxSelectionsRange: 'اختر بين {minSelections} و{maxSelections}.',
  maxSelections: {
    zero: 'لا يُسمح بأي إجابة ({count}).',
    one: 'يُسمح بإجابة واحدة فقط ({count}).',
    two: 'يُسمح بإجابتين فقط ({count}).',
    few: 'يُسمح بـ{count} إجابات فقط.',
    many: 'يُسمح بـ{count} إجابةً فقط.',
    other: 'يُسمح بـ{count} إجابة فقط.',
  },
  showTeacherInstructions: 'عرض تعليمات المعلم',
  hideTeacherInstructions: 'إخفاء تعليمات المعلم',
} satisfies MessageCatalog;
