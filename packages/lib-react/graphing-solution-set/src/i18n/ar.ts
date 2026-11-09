import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'رسم بياني إحداثي',
  axisRange: 'المحور {axis} من {min} إلى {max}.',
  plottedNone: 'لم يُرسم أي شيء.',
  plotted: {
    zero: 'لم يُرسم أي عنصر ({count}): {marks}.',
    one: 'عنصر واحد مرسوم ({count}): {marks}.',
    two: 'عنصران مرسومان ({count}): {marks}.',
    few: '{count} عناصر مرسومة: {marks}.',
    many: '{count} عنصرًا مرسومًا: {marks}.',
    other: '{count} عنصر مرسوم: {marks}.',
  },
  line: 'مستقيم',
  shadedRegion: 'منطقة مظللة',
  label: 'تسمية',
  markLabel: 'تسمية عند النقطة ({x}, {y})',
  reset: 'إعادة تعيين',
  lineA: 'المستقيم A',
  lineB: 'المستقيم B',
  solutionSet: 'مجموعة الحل',
  solid: 'متصل',
  dashed: 'متقطع',
} satisfies MessageCatalog;
