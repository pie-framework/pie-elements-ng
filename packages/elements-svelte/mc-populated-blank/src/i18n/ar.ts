import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'خيارات الإجابة',
  blankLabel: 'فراغ',
  emptyBlank: '(فارغ)',
  blankPreSelectionHint: 'ستظهر الإجابة التي تختارها على السطر الفارغ أعلاه.',
  correctAnswerSelected: 'تم تحديد إجابة صحيحة',
  incorrectAnswerSelected: 'تم تحديد إجابة غير صحيحة',
  selectedAnswerImage: 'صورة الإجابة المحددة',
  choiceImage: 'الخيار {id}',
  clickToEnableAutoplay: 'انقر لتفعيل التشغيل التلقائي للصوت',
  audioResourceUnavailable: 'الصوت مفعّل، ولكن لم يُضبط عنوان URL لصوت قابل للتشغيل.',
  listen: 'استماع',
  listenSilentAlt: 'إعادة التعليمات',
  listenPlayingAlt: 'جارٍ تشغيل التعليمات',
  printAudio: 'الصوت:',
  printTranscript: 'النص المكتوب:',
  showCorrectAnswer: 'عرض الإجابة الصحيحة',
  hideCorrectAnswer: 'إخفاء الإجابة الصحيحة',
  showTeacherInstructions: 'عرض تعليمات المعلم',
  hideTeacherInstructions: 'إخفاء تعليمات المعلم',
} satisfies MessageCatalog;
