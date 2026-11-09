import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    other: 'เพิ่มองค์ประกอบได้ไม่เกิน {count} รายการ',
  },
  undo: 'เลิกทำ',
  clearAll: 'ล้างทั้งหมด',
  graphLabel: 'เส้นจำนวนตั้งแต่ {min} ถึง {max} มีขีดแบ่งทุก ๆ {interval}',
  closedEnd: 'จุดทึบ',
  openEnd: 'จุดโปร่ง',
  elementCorrect: 'ถูกต้อง',
  elementIncorrect: 'ไม่ถูกต้อง',
  line: 'ส่วนของเส้นตรงจาก {left} ({leftEnd}) ถึง {right} ({rightEnd})',
  plottedNone: 'ยังไม่มีสิ่งใดถูกวาดบนเส้นจำนวน',
  pointClosed: 'จุดทึบที่ {position}',
  pointOpen: 'จุดโปร่งที่ {position}',
  rayLeft: 'รังสีจาก {position} ({end}) ไปทางซ้าย',
  rayRight: 'รังสีจาก {position} ({end}) ไปทางขวา',
} satisfies MessageCatalog;
