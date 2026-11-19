import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    other: '모델 {index}/{total}: {count}개 부분 중 {selected}개 선택됨',
  },
  numberOfModels: '모델 수',
  partsPerModel: '모델당 부분 수',
  warningTitle: '경고',
  answerChangeWarning: '모델 수나 모델당 부분 수를 바꾸면 추가한 답이 삭제됩니다. 계속하시겠습니까?',
  confirm: '확인',
  cancel: '취소',
} satisfies MessageCatalog;
