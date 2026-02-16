/**
 * Core PIE specification types
 */

// Base PIE model (all elements extend this)
export interface PieModel {
  id: string;
  element: string; // e.g., "@pie-element/multiple-choice"
}

// Theme configuration (from DaisyUI or custom)
export interface PieTheme {
  primary?: string; // Primary brand color
  secondary?: string; // Secondary color
  accent?: string; // Accent color
  neutral?: string; // Neutral color
  'base-100'?: string; // Base background color
  'base-200'?: string; // Secondary background
  'base-300'?: string; // Tertiary background
  'base-content'?: string; // Base text color
  info?: string; // Info color
  success?: string; // Success/correct color
  warning?: string; // Warning color
  error?: string; // Error/incorrect color
}

// Environment configuration
export interface PieEnvironment {
  mode: 'gather' | 'view' | 'evaluate';
  role: 'student' | 'instructor';
  // Optional advanced features
  lockChoiceOrder?: boolean;
  partialScoring?: boolean;
  // Optional theme configuration
  theme?: PieTheme;
}

// Session data (student responses)
export interface PieSession {
  id?: string;
  [key: string]: unknown;
}

// View model (output from controller.model())
export interface ViewModel extends Record<string, unknown> {
  disabled: boolean;
  mode: PieEnvironment['mode'];
}

// Outcome result (output from controller.outcome())
export interface OutcomeResult {
  score: number; // 0-1 scale
  empty: boolean; // True if no response provided
}

// Validation result
export interface ValidationErrors {
  [key: string]: string;
}

// Common configuration settings
export interface CommonConfigSettings {
  settingsPanelDisabled?: boolean;
  spellCheck?: ConfigureProp;
  maxImageWidth?: ConfigureProp;
  maxImageHeight?: ConfigureProp;
  withRubric?: ConfigureProp;
  language?: ConfigureProp;
  languageChoices?: ConfigureLanguageOptions;
}

export interface ConfigureProp {
  settings?: boolean;
  label?: string;
  enabled?: boolean;
}

export interface ConfigureLanguageOptions {
  label: string;
  options: { label: string; value: string }[];
}

// Print options
export interface PrintOptions {
  role: 'student' | 'instructor';
  mode?: PieEnvironment['mode'];
}

// Controller interface
export interface PieController {
  model(
    question: PieModel,
    session: PieSession | null,
    env: PieEnvironment,
    updateSession?: (session: PieSession) => void
  ): Promise<ViewModel>;

  outcome(model: PieModel, session: PieSession, env: PieEnvironment): Promise<OutcomeResult>;

  createDefaultModel(partial?: Partial<PieModel>): PieModel;

  validate(model: PieModel, config: CommonConfigSettings): ValidationErrors;

  createCorrectResponseSession(question: PieModel, env: PieEnvironment): PieSession;
}
