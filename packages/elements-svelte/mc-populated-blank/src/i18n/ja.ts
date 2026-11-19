import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: '解答の選択肢',
  blankLabel: '空欄',
  emptyBlank: '（空欄）',
  blankPreSelectionHint: '選んだ答えが上の空欄に表示されます。',
  correctAnswerSelected: '正解を選択しました',
  incorrectAnswerSelected: '不正解を選択しました',
  selectedAnswerImage: '選択した答えの画像',
  choiceImage: '選択肢 {id}',
  clickToEnableAutoplay: 'クリックすると音声の自動再生が有効になります',
  audioResourceUnavailable: '音声が有効になっていますが、再生できる音声のURLが設定されていません。',
  listen: '聞く',
  listenSilentAlt: '指示をもう一度聞く',
  listenPlayingAlt: '指示を再生しています',
  printAudio: '音声：',
  printTranscript: '書き起こし：',
  showCorrectAnswer: '正解を表示',
  hideCorrectAnswer: '正解を非表示',
  showTeacherInstructions: '教師用指示を表示',
  hideTeacherInstructions: '教師用指示を非表示',
} satisfies MessageCatalog;
