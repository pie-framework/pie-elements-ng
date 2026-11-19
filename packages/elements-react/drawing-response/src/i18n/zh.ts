import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  fillColor: '填充颜色',
  outlineColor: '轮廓颜色',
  colors: {
    noFill: '无填充',
    lightblue: '浅蓝色',
    lightyellow: '浅黄色',
    red: '红色',
    orange: '橙色',
    yellow: '黄色',
    violet: '紫色',
    blue: '蓝色',
    green: '绿色',
    white: '白色',
    black: '黑色',
  },
  onDoubleClick: '双击可编辑此文本。按 Enter 键确认。',
  drawingArea: '绘图区域',
  drawingAreaOverImage: '背景图片上的绘图区域',
  tools: {
    select: '选择',
    freeDraw: '自由绘制',
    line: '直线',
    rectangle: '矩形',
    circle: '圆形',
    textEntry: '文本输入',
    eraser: '橡皮擦',
  },
  undo: '撤销',
  clearAll: '全部清除',
  renderError: '发生错误：{message}',
} satisfies MessageCatalog;
