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
} satisfies MessageCatalog;
