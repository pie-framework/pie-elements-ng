import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'วิดีโอ',
  transcriptLabel: 'บทถอดความวิดีโอ',
  retrying: 'กำลังลองอีกครั้ง…',
  retryingDescription: 'เบราว์เซอร์กำลังโหลดวิดีโออีกครั้ง',
  trackUnavailable: 'แทร็กข้อความไม่พร้อมใช้งาน',
  trackErrorDescription: 'ไม่สามารถโหลดแทร็กข้อความได้ ลองโหลดวิดีโออีกครั้งได้',
  videoUnavailable: 'วิดีโอไม่พร้อมใช้งาน',
  missingVideoSource: 'ไม่มีแหล่งวิดีโอที่เล่นได้ ยังคงดูบทถอดความได้หากมีให้',
  videoErrorDescription: 'ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง ยังคงดูบทถอดความได้หากมีให้',
  retry: 'ลองอีกครั้ง',
} satisfies MessageCatalog;
