import type { Circle, HotspotModel, Polygon, Rectangle } from '../types.js';

export default {
  dimensions: { height: 0, width: 0 },
  hotspotColor: 'rgba(137, 183, 244, 0.25)',
  hotspotList: ['rgba(137, 183, 244, 0.25)'],
  imageUrl: '',
  multipleCorrect: true,
  outlineColor: 'blue',
  outlineList: ['blue'],
  partialScoring: false,
  prompt: '',
  promptEnabled: true,
  rationaleEnabled: true,
  shapes: { rectangles: [] as Rectangle[], polygons: [] as Polygon[], circles: [] as Circle[] },
  strokeWidth: 5,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
} satisfies Omit<HotspotModel, 'id' | 'element'>;
