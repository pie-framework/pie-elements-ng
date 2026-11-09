import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: '경고',
  resetWarning: '그래프에 추가한 모든 요소가 삭제되고 그래프가 원래 상태로 초기화됩니다. 계속하시겠습니까?',
  defineLinesFirst: '먼저 선을 정의한 다음 이 문항의 해집합을 선택하세요.',
  lineChangeWarning: "해집합을 추가한 후 선을 변경하면 선택한 해집합이 지워집니다. 선을 변경하려면 '해집합 지우기'를 클릭하세요. 그렇지 않으면 '취소'를 클릭하세요.",
  addLineAFirst: '선 B를 추가하기 전에 그래프에 선 A를 추가하세요',
  addLineBFirst: '선 A로 전환하기 전에 그래프에 선 B를 추가하세요',
  clearSolutionSet: '해집합 지우기',
  confirm: '확인',
  cancel: '취소',
} satisfies MessageCatalog;
