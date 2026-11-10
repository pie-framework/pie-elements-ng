import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'คำเตือน',
  limitMaxChoicesPerCategory: 'คุณตอบครบจำนวนสูงสุด {maxChoicesPerCategory} คำตอบต่อพื้นที่แล้ว หากต้องการเพิ่มคำตอบ ต้องนำคำตอบหนึ่งออกก่อน',
  cancel: 'ยกเลิก',
  commonCorrectAnswerWithAlternates: 'หมายเหตุ: คำตอบที่แสดงด้านบนเป็นคำตอบที่ถูกต้องที่พบบ่อยที่สุดสำหรับข้อนี้ มีการกำหนดคำตอบที่ถูกต้องเพิ่มเติมอีกอย่างน้อยหนึ่งคำตอบ ซึ่งจะได้รับการยอมรับว่าถูกต้องเช่นกัน',
  maxChoicesPerCategoryRestriction: 'หากต้องการเปลี่ยนค่านี้เป็น {maxChoicesPerCategory} แต่ละหมวดหมู่ต้องมีตัวเลือกคำตอบไม่เกิน {maxChoicesPerCategory} ตัวเลือก',
} satisfies MessageCatalog;
