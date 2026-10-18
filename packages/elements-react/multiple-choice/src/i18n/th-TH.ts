import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'คำถามแบบเลือกตอบ',
  multipleCorrectAnswerQuestion: 'คำถามที่มีหลายคำตอบที่ถูกต้อง',
  multipleSelectQuestion: 'คำถามแบบเลือกได้หลายคำตอบ',
  minSelections: 'เลือกอย่างน้อย {minSelections} รายการ',
  minmaxSelectionsEqual: 'เลือก {minSelections} รายการ',
  minmaxSelectionsRange: 'เลือก {minSelections} ถึง {maxSelections} รายการ',
  maxSelections: {
    other: 'ตอบได้เพียง {count} คำตอบ',
  },
  showTeacherInstructions: 'แสดงคำแนะนำสำหรับครู',
  hideTeacherInstructions: 'ซ่อนคำแนะนำสำหรับครู',
} satisfies MessageCatalog;
