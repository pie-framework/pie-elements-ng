import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'إظهار سلم التقدير',
  hideRubric: 'إخفاء سلم التقدير',
  halfScoringNote: '* يُسمح في سلم التقدير هذا بالدرجات النصفية أو الدرجات البينية.',
  tooLargeForPrint: 'السؤال أكبر من أن يتسع في وضع الطباعة.',
  standardsHeader: 'المعيار (المعايير)',
  descriptionHeader: 'الوصف',
  scorePoints: {
    zero: '{count} درجة',
    one: 'درجة واحدة ({count})',
    two: 'درجتان ({count})',
    few: '{count} درجات',
    many: '{count} درجةً',
    other: '{count} درجة',
  },
  noDescription: 'لا يوجد وصف',
} satisfies MessageCatalog;
