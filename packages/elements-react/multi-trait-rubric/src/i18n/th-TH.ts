import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  showRubric: 'แสดงเกณฑ์การให้คะแนน',
  hideRubric: 'ซ่อนเกณฑ์การให้คะแนน',
  halfScoringNote: '* เกณฑ์การให้คะแนนนี้อนุญาตให้ให้คะแนนครึ่งคะแนนหรือคะแนนระหว่างระดับได้',
  tooLargeForPrint: 'คำถามมีขนาดใหญ่เกินกว่าจะแสดงในโหมดพิมพ์ได้',
  standardsHeader: 'มาตรฐาน',
  descriptionHeader: 'คำอธิบาย',
  scorePoints: {
    other: '{count} คะแนน',
  },
  noDescription: 'ไม่มีคำอธิบาย',
} satisfies MessageCatalog;
