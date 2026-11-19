import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'خيار الإجابة {index} من {total}',
  image: {
    zero: 'صورة بلا مناطق إجابة ({count})',
    one: 'صورة بها منطقة إجابة واحدة ({count})',
    two: 'صورة بها منطقتا إجابة ({count})',
    few: 'صورة بها {count} مناطق إجابة',
    many: 'صورة بها {count} منطقةً للإجابة',
    other: 'صورة بها {count} منطقة إجابة',
  },
  reachedLimit: {
    zero: 'ممتلئة',
    one: 'لقد بلغت الحد الأقصى وهو إجابة واحدة ({count}) في كل منطقة. لإضافة إجابة أخرى، يجب إزالة إجابة أولًا.',
    two: 'ممتلئة',
    few: 'ممتلئة',
    many: 'ممتلئة',
    other: 'ممتلئة',
  },
  responseArea: 'منطقة الإجابة {index} من {total}',
} satisfies MessageCatalog;
