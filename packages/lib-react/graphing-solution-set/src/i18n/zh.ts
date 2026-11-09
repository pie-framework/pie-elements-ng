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
} satisfies MessageCatalog;
