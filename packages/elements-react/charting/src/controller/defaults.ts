import type { ChartingCategory, ChartingCorrectAnswer, ChartingDomain, ChartingModel } from '../types.js';

/**
 * NOTE: There's no functionality described for graphTitle,
 * rationale, scoringType, studentInstructions, teacherInstructions
 * so there's no implementation (they are only added in model)
 */

export default {
  addCategoryEnabled: true,
  changeAddCategoryEnabled: false,
  changeEditableEnabled: false,
  changeInteractiveEnabled: false,
  chartType: 'lineCross',
  correctAnswer: {} as ChartingCorrectAnswer,
  data: [] as ChartingCategory[],
  domain: {} as ChartingDomain,
  graph: { width: 480, height: 480 },
  prompt: '',
  promptEnabled: true,
  range: { label: '', max: 1, min: 0, labelStep: 1 },
  rationale: '',
  rationaleEnabled: true,
  scoringType: 'all or nothing',
  studentInstructionsEnabled: true,
  studentNewCategoryDefaultLabel: 'New Category',
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  title: '',
} satisfies Omit<ChartingModel, 'id' | 'element'>;
