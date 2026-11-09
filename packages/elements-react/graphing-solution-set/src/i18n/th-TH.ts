import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'คำเตือน',
  resetWarning: 'การดำเนินการนี้จะลบองค์ประกอบทั้งหมดที่เพิ่มลงในกราฟและรีเซ็ตกราฟกลับสู่สถานะเดิม ต้องการดำเนินการต่อหรือไม่',
  defineLinesFirst: 'โปรดกำหนดเส้นตรงก่อน แล้วจึงเลือกเซตคำตอบสำหรับข้อนี้',
  lineChangeWarning: "การเปลี่ยนเส้นตรงหลังจากเพิ่มเซตคำตอบแล้วจะล้างเซตคำตอบที่เลือกไว้ คลิก 'ล้างเซตคำตอบ' เพื่อเปลี่ยนเส้นตรง หรือคลิก 'ยกเลิก'",
  addLineAFirst: 'โปรดเพิ่มเส้นตรง A ลงในกราฟก่อนเพิ่มเส้นตรง B',
  addLineBFirst: 'โปรดเพิ่มเส้นตรง B ลงในกราฟก่อนสลับไปที่เส้นตรง A',
  clearSolutionSet: 'ล้างเซตคำตอบ',
  confirm: 'ตกลง',
  cancel: 'ยกเลิก',
} satisfies MessageCatalog;
