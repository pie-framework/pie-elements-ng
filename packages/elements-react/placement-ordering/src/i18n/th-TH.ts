import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  dragInstructions: 'กด Space หรือ Enter เพื่อหยิบตัวเลือกคำตอบนี้ เมื่อหยิบแล้ว ให้ใช้ Tab หรือ Shift+Tab เพื่อเลื่อนไปยังพื้นที่คำตอบต่าง ๆ หรือใช้ปุ่มลูกศรเพื่อย้ายได้อย่างอิสระ กด Space หรือ Enter เพื่อวาง หรือกด Escape เพื่อยกเลิก',
  commonCorrectAnswerWithAlternates: 'หมายเหตุ: คำตอบที่แสดงด้านบนเป็นคำตอบที่ถูกต้องที่พบบ่อยที่สุดสำหรับข้อนี้ มีการกำหนดคำตอบที่ถูกต้องเพิ่มเติมอีกอย่างน้อยหนึ่งคำตอบ ซึ่งจะได้รับการยอมรับว่าถูกต้องเช่นกัน',
  readingInstructions: 'สร้างรายการที่เรียงลำดับแล้วโดยย้ายแต่ละออบเจ็กต์ไปยังตำแหน่งที่ถูกต้อง ใช้ Tab เพื่อเลื่อนระหว่างออบเจ็กต์และพื้นที่วาง ใช้ Enter เพื่อเลือกหรือวาง และใช้ Esc เพื่อยกเลิก',
  objectsAreOnSortedList: {
    other: 'มี {sorted} จาก {total} ออบเจ็กต์อยู่ในรายการที่เรียงลำดับแล้ว',
  },
  unsortedObjects: {
    other: '{count} ออบเจ็กต์ที่ยังไม่ได้เรียงลำดับ',
  },
  sortedObjects: {
    other: '{count} ออบเจ็กต์ที่เรียงลำดับแล้ว',
  },
  unsortedObjectPrefix: 'ออบเจ็กต์:',
  sortedObjectPrefix: 'ตำแหน่งที่ {position}:',
  endOfUnsorted: 'สิ้นสุดออบเจ็กต์ที่ยังไม่ได้เรียงลำดับ',
  endOfSorted: 'สิ้นสุดออบเจ็กต์ที่เรียงลำดับแล้ว',
  useTabToObject: 'ใช้ Tab เพื่อไปยังออบเจ็กต์',
  unsortedObjectFocus: 'ออบเจ็กต์ที่ยังไม่ได้เรียงลำดับ {text} กด Enter เพื่อเลือก หรือกด Tab เพื่อไปยังออบเจ็กต์อื่น',
  sortedObjectFocus: 'ออบเจ็กต์ที่เรียงลำดับแล้ว {text} ในตำแหน่งที่ {position} จาก {total} กด Enter เพื่อเลือก หรือกด Tab เพื่อไปยังออบเจ็กต์อื่น',
  emptyPositionFocus: 'ตำแหน่งที่ {position} จาก {total} ซึ่งว่างอยู่ กด Enter เพื่อย้ายออบเจ็กต์ที่เลือก {text} มาไว้ที่นี่ หรือใช้ Tab เพื่อไปยังตำแหน่งอื่น',
  occupiedPositionFocus: 'ตำแหน่งที่ {position} จาก {total} ซึ่งมีออบเจ็กต์ {occupant} อยู่ ใช้ Tab เพื่อไปยังตำแหน่งอื่น หรือกด Enter เพื่อย้ายออบเจ็กต์ที่เลือก {text} มาไว้ที่นี่ ซึ่งจะส่งออบเจ็กต์ที่อยู่ในตำแหน่งที่ {position} ตอนนี้กลับไปยังรายการที่ยังไม่ได้เรียงลำดับ',
  unsortedListReturnFocus: 'อยู่ที่รายการที่ยังไม่ได้เรียงลำดับ กด Enter เพื่อส่งออบเจ็กต์ที่เลือก {text} กลับไปยังรายการที่ยังไม่ได้เรียงลำดับ หรือใช้ Tab เพื่อไปยังตำแหน่ง',
  unsortedListLeaveFocus: 'อยู่ที่รายการที่ยังไม่ได้เรียงลำดับ กด Enter เพื่อให้ออบเจ็กต์ {text} คงอยู่โดยไม่เรียงลำดับ หรือใช้ Tab เพื่อไปยังตำแหน่ง',
  selectedUnsorted: 'เลือกออบเจ็กต์ {text} ใช้ Tab เพื่อไปยังตำแหน่งในรายการที่เรียงลำดับแล้ว',
  selectedSorted: 'เลือกออบเจ็กต์ {text} ซึ่งอยู่ในตำแหน่งที่ {position} จาก {total} ใช้ Tab เพื่อไปยังตำแหน่งอื่น',
  placed: 'วางออบเจ็กต์ {text} ในตำแหน่งที่ {position} จาก {total} แล้ว',
  moved: 'ย้ายออบเจ็กต์ {text} จากตำแหน่งที่ {from} ไปยังตำแหน่งที่ {to} แล้ว',
  removed: 'นำออบเจ็กต์ {text} ออกจากตำแหน่งที่ {position} แล้ว',
  returnedToUnsorted: 'ออบเจ็กต์ {text} ถูกส่งกลับไปยังรายการที่ยังไม่ได้เรียงลำดับแล้ว',
  answerComplete: {
    other: 'คำตอบสมบูรณ์ มี {total} จาก {total} ออบเจ็กต์อยู่ในรายการที่เรียงลำดับแล้ว',
  },
  objectsOnSortedList: {
    other: 'มี {sorted} จาก {total} ออบเจ็กต์อยู่ในรายการที่เรียงลำดับแล้ว',
  },
  useTabToAnotherObject: 'ใช้ Tab เพื่อไปยังออบเจ็กต์อื่น',
  noLongerSelected: 'ออบเจ็กต์ {text} ไม่ได้ถูกเลือกอีกต่อไป',
} satisfies MessageCatalog;
