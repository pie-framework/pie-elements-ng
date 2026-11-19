import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: '分類するタイル',
  unknownTarget: '不明',
  cancelled: 'キャンセルしました',
  returnedToTray: '{name}をトレイに戻しました',
  placedIn: '{name}を{target}に置きました',
  pickedUp: '{name}を持ち上げました',
  pickedUpWithKeyboard:
    '{name}を持ち上げました。置き場所：{target}。矢印キーで置き場所を選び、Enterキーで置き、Escキーでキャンセルしてください。',
  dropTarget: '置き場所：{target}',
  unsupportedCircles: {
    other:
      'この図は表示できません。円が{count}個ありますが、対応しているのは{supported}個までです。',
  },
  setNumber: '集合{number}',
  regionOnly: '{set}のみ',
  regionNeither: '{first}でも{second}でもない',
  regionNoneOf: '{sets}のいずれでもない',
  regionAndSeparator: 'と',
  listSeparator: '、',
  tileFallbackName: 'タイル',
  tileNotPlaced: '未配置',
  tileInRegion: '{region}内',
  tileCorrect: '正解',
  tileIncorrect: '不正解',
  showCorrectAnswer: '正解を表示',
  hideCorrectAnswer: '正解を非表示',
  showTeacherInstructions: '教師用指示を表示',
  hideTeacherInstructions: '教師用指示を非表示',
} satisfies MessageCatalog;
