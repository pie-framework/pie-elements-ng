import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  addElementLimit: {
    other: '追加できる要素は {count} 個までです。',
  },
  undo: '元に戻す',
  clearAll: 'すべてクリア',
  graphLabel: '{min} から {max} までの数直線、目盛りの間隔は {interval}',
  closedEnd: '黒丸',
  openEnd: '白丸',
  elementCorrect: '正解です。',
  elementIncorrect: '不正解です。',
  line: '{left}（{leftEnd}）から {right}（{rightEnd}）までの線分です。',
  plottedNone: '何も表示されていません。',
  pointClosed: '{position} に黒丸の点があります。',
  pointOpen: '{position} に白丸の点があります。',
  rayLeft: '{position}（{end}）から左向きの半直線です。',
  rayRight: '{position}（{end}）から右向きの半直線です。',
} satisfies MessageCatalog;
