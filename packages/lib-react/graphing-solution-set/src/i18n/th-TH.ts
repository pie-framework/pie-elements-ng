import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: 'กราฟบนระนาบพิกัด',
  axisRange: 'แกน {axis} ตั้งแต่ {min} ถึง {max}',
  plottedNone: 'ยังไม่มีการวาดสิ่งใด',
  plotted: {
    other: 'วาดแล้ว {count} รายการ: {marks}',
  },
  line: 'เส้นตรง',
  shadedRegion: 'บริเวณที่แรเงา',
  label: 'ป้ายกำกับ',
  markLabel: 'ป้ายกำกับที่ ({x}, {y})',
  reset: 'รีเซ็ต',
  lineA: 'เส้นตรง A',
  lineB: 'เส้นตรง B',
  solutionSet: 'เซตคำตอบ',
  solid: 'เส้นทึบ',
  dashed: 'เส้นประ',
  lineStyleCorrect: 'รูปแบบเส้นถูกต้อง: {style}',
  lineStyleIncorrect: 'รูปแบบเส้นไม่ถูกต้อง: วาดเป็น {drawn} แต่ควรเป็น {expected}',
  regionVerdict: {
    correct: 'บริเวณที่แรเงาถูกต้อง',
    incorrect: 'บริเวณที่แรเงาไม่ถูกต้อง',
    missing: 'บริเวณที่แรเงาตามเฉลย แต่ไม่ได้แรเงา',
  },
  key: 'คำอธิบายสัญลักษณ์',
  keyLegend: {
    studentCorrect: 'คำตอบที่ถูกต้องของนักเรียน',
    studentIncorrect: 'คำตอบที่ไม่ถูกต้องของนักเรียน',
    answerKeyCorrect: 'ถูกต้องตามเฉลย',
    lineStyleCorrect: 'รูปแบบเส้นถูกต้อง',
    lineStyleIncorrect: 'รูปแบบเส้นไม่ถูกต้อง',
  },
} satisfies MessageCatalog;
