export const A11Y_SCAN_MODES = ['gather', 'evaluate'] as const;

export type A11yScanMode = (typeof A11Y_SCAN_MODES)[number];
export type A11yScanRole = 'student' | 'instructor';

export type A11yConcern =
  | 'semantics'
  | 'keyboard-focus'
  | 'input-assistance'
  | 'status-feedback'
  | 'visual-contrast'
  | 'target-size'
  | 'media-alternatives'
  | 'math-accessibility'
  | 'spatial-interaction'
  | 'table-structure'
  | 'reading-structure';

export type A11yAutomatedCheck =
  | 'axe'
  | 'group-label'
  | 'interactive-control-name'
  | 'keyboard-tab-reach'
  | 'math-alternative'
  | 'media-alternative'
  | 'target-size'
  | 'status-message';

export interface A11yScenarioDefinition {
  id: string;
  element: string;
  title: string;
  purpose: string;
  mode: A11yScanMode;
  role: A11yScanRole;
  wcagCriteria: string[];
  concerns: A11yConcern[];
  automatedChecks: A11yAutomatedCheck[];
  model: unknown;
  session?: unknown;
  sourceDemoId?: string;
  sourceDemoTitle?: string;
  manualReviewNotes?: string[];
}

export interface A11yScenarioSummary {
  id: string;
  element: string;
  title: string;
  purpose: string;
  mode: A11yScanMode;
  role: A11yScanRole;
  wcagCriteria: string[];
  concerns: A11yConcern[];
  automatedChecks: A11yAutomatedCheck[];
  sourceDemoId?: string;
  sourceDemoTitle?: string;
  manualReviewNotes?: string[];
}
