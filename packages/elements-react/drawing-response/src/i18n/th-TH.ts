import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: 'สีเติม',
  outlineColor: 'สีเส้นขอบ',
  colors: {
    noFill: 'ไม่มีสีเติม',
    lightblue: 'ฟ้าอ่อน',
    lightyellow: 'เหลืองอ่อน',
    red: 'แดง',
    orange: 'ส้ม',
    yellow: 'เหลือง',
    violet: 'ม่วง',
    blue: 'น้ำเงิน',
    green: 'เขียว',
    white: 'ขาว',
    black: 'ดำ',
  },
  onDoubleClick: 'ดับเบิลคลิกเพื่อแก้ไขข้อความนี้ กด Enter เพื่อยืนยัน',
  drawingArea: 'พื้นที่วาดภาพ',
  drawingAreaOverImage: 'พื้นที่วาดภาพบนภาพพื้นหลัง',
  tools: {
    select: 'เลือก',
    freeDraw: 'วาดอิสระ',
    line: 'เส้นตรง',
    rectangle: 'สี่เหลี่ยมผืนผ้า',
    circle: 'วงกลม',
    textEntry: 'ป้อนข้อความ',
    eraser: 'ยางลบ',
  },
  undo: 'เลิกทำ',
  clearAll: 'ล้างทั้งหมด',
  renderError: 'เกิดข้อผิดพลาด: {message}',
} satisfies MessageCatalog;
