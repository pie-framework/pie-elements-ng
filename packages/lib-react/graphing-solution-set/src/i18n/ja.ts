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
} satisfies MessageCatalog;
