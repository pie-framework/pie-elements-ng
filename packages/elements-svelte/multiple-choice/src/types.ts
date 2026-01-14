/**
 * Multiple Choice types
 */

import type { PieModel, PieSession, ViewModel } from '@pie-shared/types';

export interface MultipleChoiceModel extends PieModel {
  element: '@pie-elements-ng/multiple-choice';
  prompt?: string;
  promptEnabled?: boolean;
  choices: Choice[];
  choiceMode: 'radio' | 'checkbox';
  choicePrefix: 'letters' | 'numbers' | 'none';
  choicesLayout: 'vertical' | 'horizontal' | 'grid';
  lockChoiceOrder?: boolean;
  partialScoring?: boolean;
  minSelections?: number;
  maxSelections?: number;
  feedbackEnabled: boolean;
  rationaleEnabled: boolean;
  rationale?: string;
  teacherInstructions?: string;
}

export interface Choice {
  value: string;
  label: string;
  correct: boolean;
  feedback?: string;
}

export interface MultipleChoiceSession extends PieSession {
  value?: string[];
  shuffledValues?: string[];
}

export interface MultipleChoiceViewModel extends ViewModel {
  prompt?: string;
  promptEnabled?: boolean;
  choices: ChoiceViewModel[];
  choiceMode: 'radio' | 'checkbox';
  choicePrefix: 'letters' | 'numbers' | 'none';
  choicesLayout: 'vertical' | 'horizontal' | 'grid';
  responseCorrect?: boolean;
  correctResponse?: string[];
  rationale?: string;
  showRationale?: boolean;
}

export interface ChoiceViewModel extends Choice {
  index: number;
  checked?: boolean;
  showFeedback?: boolean;
}

export interface MultipleChoiceAuthor {
  choiceMode?: {
    settings?: boolean;
    label?: string;
  };
  choicePrefix?: {
    settings?: boolean;
    label?: string;
  };
  choicesLayout?: {
    settings?: boolean;
    label?: string;
  };
  feedback?: {
    settings?: boolean;
    label?: string;
    enabled?: boolean;
  };
  rationale?: {
    settings?: boolean;
    label?: string;
    enabled?: boolean;
  };
  partialScoring?: {
    settings?: boolean;
    label?: string;
    enabled?: boolean;
  };
}
