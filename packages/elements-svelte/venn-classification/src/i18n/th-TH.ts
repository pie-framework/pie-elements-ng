import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: 'ไทล์ที่ต้องจัดประเภท',
  unknownTarget: 'ไม่ทราบ',
  cancelled: 'ยกเลิกแล้ว',
  returnedToTray: 'นำ {name} กลับไปที่ถาดแล้ว',
  placedIn: 'วาง {name} ใน {target} แล้ว',
  pickedUp: 'หยิบ {name} แล้ว',
  pickedUpWithKeyboard:
    'หยิบ {name} แล้ว ตำแหน่งที่จะวาง: {target} ใช้ปุ่มลูกศรเพื่อเลือกตำแหน่งที่จะวาง กด Enter เพื่อวาง หรือ Escape เพื่อยกเลิก',
  dropTarget: 'ตำแหน่งที่จะวาง: {target}',
  unsupportedCircles: {
    other: 'ไม่สามารถแสดงแผนภาพนี้ได้ เนื่องจากมีวงกลม {count} วง และรองรับเพียง {supported} วงเท่านั้น',
  },
  setNumber: 'เซต {number}',
  regionOnly: 'เฉพาะ {set}',
  regionNeither: 'ไม่อยู่ทั้งใน {first} และ {second}',
  regionNoneOf: 'ไม่อยู่ใน {sets}',
  regionAndSeparator: ' และ ',
  listSeparator: ', ',
  tileFallbackName: 'ไทล์',
  tileNotPlaced: 'ยังไม่ได้วาง',
  tileInRegion: 'อยู่ใน {region}',
  tileCorrect: 'ถูกต้อง',
  tileIncorrect: 'ไม่ถูกต้อง',
  showCorrectAnswer: 'แสดงคำตอบที่ถูกต้อง',
  hideCorrectAnswer: 'ซ่อนคำตอบที่ถูกต้อง',
  showTeacherInstructions: 'แสดงคำแนะนำสำหรับครู',
  hideTeacherInstructions: 'ซ่อนคำแนะนำสำหรับครู',
} satisfies MessageCatalog;
