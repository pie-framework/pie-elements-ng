import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'قائمة الخيارات',
  answerA11y: 'الإجابة {id}',
  responseAreaForA11y: 'منطقة الإجابة الخاصة بـ {prompt}',
  responseAreaA11y: 'منطقة الإجابة {id}',
  dragInstructionsA11y: 'يؤدي الضغط على مفتاح المسافة أو Enter إلى التقاط خيار الإجابة هذا. بعد التقاطه، يُستخدم Tab أو Shift+Tab للتنقل بين مناطق الإجابة، أو مفاتيح الأسهم لتحريكه بحرية. يؤدي الضغط على مفتاح المسافة أو Enter إلى إفلاته، والضغط على Escape إلى الإلغاء. يمكن أيضًا النقر على خيار إجابة لتحديده، ثم النقر على منطقة إجابة لوضعه فيها.',
  pickedUpA11y: 'تم التقاط {choice}. يُستخدم Tab للتنقل بين مناطق الإجابة، ثم يُضغط على مفتاح المسافة أو Enter للإفلات.',
  notOverResponseAreaA11y: '{choice} ليس فوق منطقة إجابة.',
  overFilledA11y: 'فوق {target}. يحتوي حاليًا على {choice}.',
  overEmptyA11y: 'فوق {target}. فارغ حاليًا.',
  returnedA11y: 'تمت إعادة {choice} إلى موضعه الأصلي.',
  droppedA11y: 'تم إفلات {choice} في {target}.',
  cancelledA11y: 'تم الإلغاء. تمت إعادة {choice} إلى موضعه الأصلي.',
} satisfies MessageCatalog;
