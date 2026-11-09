import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'รายการตัวเลือก',
  answerA11y: 'คำตอบ {id}',
  responseAreaForA11y: 'พื้นที่คำตอบสำหรับ {prompt}',
  responseAreaA11y: 'พื้นที่คำตอบ {id}',
  dragInstructionsA11y: 'กด Space หรือ Enter เพื่อหยิบตัวเลือกคำตอบนี้ เมื่อหยิบแล้ว ใช้ Tab หรือ Shift+Tab เพื่อเลื่อนไปยังพื้นที่คำตอบต่าง ๆ หรือใช้ปุ่มลูกศรเพื่อย้ายได้อย่างอิสระ กด Space หรือ Enter เพื่อวาง หรือกด Escape เพื่อยกเลิก นอกจากนี้ยังสามารถคลิกตัวเลือกคำตอบเพื่อเลือก แล้วคลิกพื้นที่คำตอบเพื่อวางไว้ที่นั่น',
  pickedUpA11y: 'หยิบ {choice} แล้ว ใช้ Tab เพื่อเลื่อนไปมาระหว่างพื้นที่คำตอบ แล้วกด Space หรือ Enter เพื่อวาง',
  notOverResponseAreaA11y: '{choice} ไม่ได้อยู่เหนือพื้นที่คำตอบ',
  overFilledA11y: 'อยู่เหนือ {target} ขณะนี้มี {choice}',
  overEmptyA11y: 'อยู่เหนือ {target} ขณะนี้ว่างอยู่',
  returnedA11y: 'นำ {choice} กลับไปยังตำแหน่งเดิมแล้ว',
  droppedA11y: 'วาง {choice} ใน {target} แล้ว',
  cancelledA11y: 'ยกเลิกแล้ว นำ {choice} กลับไปยังตำแหน่งเดิมแล้ว',
} satisfies MessageCatalog;
