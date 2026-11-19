import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoices: '答案选项',
  blankLabel: '空格',
  emptyBlank: '（空）',
  blankPreSelectionHint: '你选择的答案将显示在上方的空格中。',
  correctAnswerSelected: '已选择正确答案',
  incorrectAnswerSelected: '已选择错误答案',
  selectedAnswerImage: '所选答案的图片',
  choiceImage: '选项 {id}',
  clickToEnableAutoplay: '点击以启用音频自动播放',
  audioResourceUnavailable: '已启用音频，但未配置可播放的音频 URL。',
  listen: '收听',
  listenSilentAlt: '重听说明',
  listenPlayingAlt: '正在播放说明',
  printAudio: '音频：',
  printTranscript: '文字稿：',
  showCorrectAnswer: '显示正确答案',
  hideCorrectAnswer: '隐藏正确答案',
  showTeacherInstructions: '显示教师指引',
  hideTeacherInstructions: '隐藏教师指引',
} satisfies MessageCatalog;
