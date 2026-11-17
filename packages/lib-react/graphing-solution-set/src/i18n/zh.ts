import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  graph: '坐标图',
  axisRange: '{axis} 轴范围为 {min} 至 {max}。',
  plottedNone: '尚未绘制任何对象。',
  plotted: {
    other: '已绘制 {count} 个对象：{marks}。',
  },
  line: '直线',
  shadedRegion: '阴影区域',
  label: '标签',
  markLabel: '位于（{x}, {y}）的标签',
  reset: '重置',
  lineA: '直线 A',
  lineB: '直线 B',
  solutionSet: '解集',
  solid: '实线',
  dashed: '虚线',
  lineStyleCorrect: '线型正确：{style}',
  lineStyleIncorrect: '线型错误：所画为{drawn}，应为{expected}',
  regionVerdict: {
    correct: '阴影区域正确',
    incorrect: '阴影区域错误',
    missing: '标准答案中的阴影区域，未涂阴影',
  },
  key: '图例',
  keyLegend: {
    studentCorrect: '学生正确答案',
    studentIncorrect: '学生错误答案',
    answerKeyCorrect: '标准答案',
    lineStyleCorrect: '线型正确',
    lineStyleIncorrect: '线型错误',
  },
} satisfies MessageCatalog;
