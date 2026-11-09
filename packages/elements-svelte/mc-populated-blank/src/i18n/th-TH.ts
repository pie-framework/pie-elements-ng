import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: 'ตัวเลือกคำตอบ',
  blankLabel: 'ช่องว่าง',
  emptyBlank: '(ว่าง)',
  blankPreSelectionHint: 'คำตอบที่เลือกจะปรากฏในช่องว่างด้านบน',
  correctAnswerSelected: 'เลือกคำตอบที่ถูกต้องแล้ว',
  incorrectAnswerSelected: 'เลือกคำตอบที่ไม่ถูกต้องแล้ว',
  selectedAnswerImage: 'รูปภาพของคำตอบที่เลือก',
  choiceImage: 'ตัวเลือก {id}',
  clickToEnableAutoplay: 'คลิกเพื่อเปิดการเล่นเสียงอัตโนมัติ',
  audioResourceUnavailable: 'เปิดใช้เสียงแล้ว แต่ไม่ได้กำหนด URL ของเสียงที่เล่นได้',
  listen: 'ฟัง',
  listenSilentAlt: 'ฟังคำแนะนำอีกครั้ง',
  listenPlayingAlt: 'กำลังเล่นคำแนะนำ',
  printAudio: 'เสียง:',
  printTranscript: 'บทถอดความ:',
  showCorrectAnswer: 'แสดงคำตอบที่ถูกต้อง',
  hideCorrectAnswer: 'ซ่อนคำตอบที่ถูกต้อง',
  showTeacherInstructions: 'แสดงคำแนะนำสำหรับครู',
  hideTeacherInstructions: 'ซ่อนคำแนะนำสำหรับครู',
} satisfies MessageCatalog;
