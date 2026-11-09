import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'เลือกถูกต้อง',
  shouldHaveBeenSelected: 'ควรเลือกส่วนนี้',
  shouldNotHaveBeenSelected: 'ไม่ควรเลือกส่วนนี้',
  image: {
    other: 'ภาพที่มีจุดโต้ตอบ {count} จุด',
  },
  shape: 'จุดโต้ตอบที่ {index} จาก {total}',
} satisfies MessageCatalog;
