import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    other: 'แบบจำลอง {index} จาก {total}: เลือก {selected} จาก {count} ส่วน',
  },
  numberOfModels: 'จำนวนแบบจำลอง',
  partsPerModel: 'จำนวนส่วนต่อแบบจำลอง',
  warningTitle: 'คำเตือน',
  answerChangeWarning: 'การเปลี่ยนจำนวนแบบจำลองหรือจำนวนส่วนต่อแบบจำลองจะลบคำตอบที่เพิ่มไว้ ต้องการดำเนินการต่อหรือไม่',
  confirm: 'ตกลง',
  cancel: 'ยกเลิก',
} satisfies MessageCatalog;
