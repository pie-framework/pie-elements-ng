import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: '답안 선택지',
  blankLabel: '빈칸',
  emptyBlank: '(빈칸)',
  blankPreSelectionHint: '선택한 답이 위의 빈칸에 표시됩니다.',
  correctAnswerSelected: '정답을 선택했습니다',
  incorrectAnswerSelected: '오답을 선택했습니다',
  selectedAnswerImage: '선택한 답 이미지',
  choiceImage: '선택지 {id}',
  clickToEnableAutoplay: '클릭하여 오디오 자동 재생 사용',
  audioResourceUnavailable:
    '오디오가 사용 설정되었지만 재생 가능한 오디오 URL이 구성되지 않았습니다.',
  listen: '듣기',
  listenSilentAlt: '지시 사항 다시 듣기',
  listenPlayingAlt: '지시 사항 재생 중',
  printAudio: '오디오:',
  printTranscript: '대본:',
  showCorrectAnswer: '정답 표시',
  hideCorrectAnswer: '정답 숨기기',
  showTeacherInstructions: '교사 지침 표시',
  hideTeacherInstructions: '교사 지침 숨기기',
} satisfies MessageCatalog;
