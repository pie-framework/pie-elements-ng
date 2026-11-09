import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'لون التعبئة',
  outlineColor: 'لون الحد الخارجي',
  colors: {
    noFill: 'بدون تعبئة',
    lightblue: 'أزرق فاتح',
    lightyellow: 'أصفر فاتح',
    red: 'أحمر',
    orange: 'برتقالي',
    yellow: 'أصفر',
    violet: 'بنفسجي',
    blue: 'أزرق',
    green: 'أخضر',
    white: 'أبيض',
    black: 'أسود',
  },
  onDoubleClick: 'انقر نقرًا مزدوجًا لتحرير هذا النص. اضغط على Enter للتأكيد.',
  drawingArea: 'منطقة الرسم',
  drawingAreaOverImage: 'منطقة الرسم فوق صورة خلفية',
  tools: {
    select: 'تحديد',
    freeDraw: 'رسم حر',
    line: 'خط',
    rectangle: 'مستطيل',
    circle: 'دائرة',
    textEntry: 'إدخال نص',
    eraser: 'ممحاة',
  },
  undo: 'تراجع',
  clearAll: 'مسح الكل',
  renderError: 'حدث خطأ: {message}',
} satisfies MessageCatalog;
