import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: '塗りつぶしの色',
  outlineColor: '輪郭線の色',
  colors: {
    noFill: '塗りつぶしなし',
    lightblue: '水色',
    lightyellow: '薄い黄色',
    red: '赤',
    orange: 'オレンジ',
    yellow: '黄',
    violet: '紫',
    blue: '青',
    green: '緑',
    white: '白',
    black: '黒',
  },
  onDoubleClick: 'このテキストを編集するにはダブルクリックしてください。確定するにはEnterキーを押してください。',
  drawingArea: '描画エリア',
  drawingAreaOverImage: '背景画像上の描画エリア',
  tools: {
    select: '選択',
    freeDraw: 'フリーハンド',
    line: '直線',
    rectangle: '四角形',
    circle: '円',
    textEntry: 'テキスト入力',
    eraser: '消しゴム',
  },
  undo: '元に戻す',
  clearAll: 'すべてクリア',
  renderError: 'エラーが発生しました：{message}',
} satisfies MessageCatalog;
