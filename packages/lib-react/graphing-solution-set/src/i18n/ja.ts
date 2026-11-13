import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: '座標平面のグラフ',
  axisRange: '{axis}軸：{min}から{max}まで。',
  plottedNone: '何も描かれていません。',
  plotted: {
    other: '描かれたオブジェクト{count}個：{marks}。',
  },
  line: '線',
  shadedRegion: '網掛け領域',
  label: 'ラベル',
  markLabel: '（{x}, {y}）のラベル',
  reset: 'リセット',
  lineA: '線A',
  lineB: '線B',
  solutionSet: '解の集合',
  solid: '実線',
  dashed: '破線',
  lineStyleCorrect: '線の種類は正解: {style}',
  lineStyleIncorrect: '線の種類は不正解: 描いた線は{drawn}、正解は{expected}',
  regionVerdict: {
    correct: '網掛け領域は正解',
    incorrect: '網掛け領域は不正解',
    missing: '解答キーの網掛け領域、網掛けなし',
  },
  key: '凡例',
  keyLegend: {
    studentCorrect: '生徒の正解',
    studentIncorrect: '生徒の不正解',
    answerKeyCorrect: '正解（解答キー）',
    lineStyleCorrect: '線の種類：正解',
    lineStyleIncorrect: '線の種類：不正解',
  },
} satisfies MessageCatalog;
