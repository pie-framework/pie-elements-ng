import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'فيديو',
  transcriptLabel: 'النص المكتوب للفيديو',
  retrying: 'جارٍ إعادة المحاولة…',
  retryingDescription: 'يعيد المتصفح تحميل الفيديو.',
  trackUnavailable: 'مسار النص غير متاح',
  trackErrorDescription: 'تعذّر تحميل مسار نصي. يمكن إعادة تحميل الفيديو.',
  videoUnavailable: 'الفيديو غير متاح',
  missingVideoSource: 'لا يتوفر مصدر فيديو قابل للتشغيل. يظل النص المكتوب متاحًا عند توفيره.',
  videoErrorDescription: 'تحقّق من الاتصال وأعد المحاولة. يظل النص المكتوب متاحًا عند توفيره.',
  retry: 'إعادة المحاولة',
} satisfies MessageCatalog;
