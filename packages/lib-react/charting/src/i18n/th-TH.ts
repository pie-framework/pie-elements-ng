import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  actions: 'การดำเนินการ',
  add: 'เพิ่ม',
  delete: 'ลบ',
  newLabel: 'ป้ายกำกับใหม่',
  categoryLabel: 'ป้ายกำกับของหมวดหมู่ {index}',
  categoryLabelValue: 'ป้ายกำกับของหมวดหมู่ {index}: {label}',
  category: 'หมวดหมู่ {index}',
  warning: 'คำเตือน',
  reachedLimit: {
    other: 'มีหมวดหมู่ได้ไม่เกิน {count} หมวดหมู่',
  },
  key: 'คำอธิบายสัญลักษณ์',
  keyLegend: {
    incorrectAnswer: 'คำตอบที่ไม่ถูกต้องของนักเรียน',
    correctAnswer: 'คำตอบที่ถูกต้องของนักเรียน',
    correctKeyAnswer: 'ถูกต้องตามเฉลย',
  },
  chartTypes: {
    bar: 'แผนภูมิแท่ง',
    histogram: 'ฮิสโทแกรม',
    lineDot: 'กราฟเส้นแบบจุด',
    lineCross: 'กราฟเส้นแบบกากบาท',
    dotPlot: 'แผนภาพจุด',
    linePlot: 'แผนภาพเส้น',
  },
  categoriesNone: 'ไม่มีหมวดหมู่',
  categories: {
    other: '{count} หมวดหมู่: {categories}',
  },
  valueRange: 'ค่าตั้งแต่ {min} ถึง {max}',
  labelledValueRange: '{label} ตั้งแต่ {min} ถึง {max}',
} satisfies MessageCatalog;
