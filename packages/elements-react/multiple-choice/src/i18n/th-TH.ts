import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  multipleChoiceQuestion: 'คำถามแบบเลือกตอบ',
  multipleCorrectAnswerQuestion: 'คำถามที่มีหลายคำตอบที่ถูกต้อง',
  multipleSelectQuestion: 'คำถามแบบเลือกได้หลายคำตอบ',
  minSelections: 'เลือกอย่างน้อย {minSelections} รายการ',
  minmaxSelectionsEqual: 'เลือก {minSelections} รายการ',
  minmaxSelectionsRange: 'เลือก {minSelections} ถึง {maxSelections} รายการ',
  maxSelections: {
    other: 'เลือกได้เพียง {count} รายการ',
  },
  showTeacherInstructions: 'แสดงคำแนะนำสำหรับครู',
  hideTeacherInstructions: 'ซ่อนคำแนะนำสำหรับครู',
  answerChoicesA11y: 'ตัวเลือกคำตอบ',
  partAnswerChoicesA11y: '{partLabel}, ตัวเลือกคำตอบ',
  pickTheAnswerBelowA11y: 'เลือกคำตอบด้านล่าง',
} satisfies MessageCatalog;
