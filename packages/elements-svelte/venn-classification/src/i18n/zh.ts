import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  tray: '待分类的卡片',
  unknownTarget: '未知',
  cancelled: '已取消',
  returnedToTray: '已将{name}放回托盘',
  placedIn: '已将{name}放入{target}',
  pickedUp: '已拿起{name}',
  pickedUpWithKeyboard:
    '已拿起{name}，放置目标：{target}。使用方向键选择放置目标，按 Enter 键放置，按 Esc 键取消。',
  dropTarget: '放置目标：{target}',
  unsupportedCircles: {
    other: '无法显示此图：它有 {count} 个圆，但仅支持 {supported} 个。',
  },
  setNumber: '集合 {number}',
  regionOnly: '仅{set}',
  regionNeither: '既不属于{first}也不属于{second}',
  regionNoneOf: '不属于{sets}中的任何一个',
  regionAndSeparator: '和',
  listSeparator: '，',
  tileFallbackName: '卡片',
  tileNotPlaced: '未放置',
  tileInRegion: '在{region}中',
  tileCorrect: '正确',
  tileIncorrect: '错误',
  showCorrectAnswer: '显示正确答案',
  hideCorrectAnswer: '隐藏正确答案',
  showTeacherInstructions: '显示教师指引',
  hideTeacherInstructions: '隐藏教师指引',
} satisfies MessageCatalog;
