/**
 * Slider Element Types
 *
 * Corresponds to QTI 2.2 sliderInteraction
 * https://www.imsglobal.org/question/qtiv2p2/imsqti_infov2p2.html#element10594
 */

/**
 * Slider orientation
 */
export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * Slider model - configuration and correct response
 */
export interface SliderModel {
  /** Unique identifier for this element instance */
  id: string;

  /** Element type identifier */
  element: '@pie-element/slider';

  /** Question prompt/stem */
  prompt?: string;

  /** Minimum selectable value (required) */
  lowerBound: number;

  /** Maximum selectable value (required) */
  upperBound: number;

  /** Increment between valid values (default: 1) */
  step?: number;

  /** Display labels at step intervals */
  stepLabel?: boolean;

  /** Slider orientation (default: horizontal) */
  orientation?: SliderOrientation;

  /** Reverse the slider direction (max on left/top) */
  reverse?: boolean;

  /** Correct answer value */
  correctResponse?: number;

  /** Rationale explaining the correct answer (shown to instructors) */
  rationale?: string;

  /** Allow partial credit based on proximity to correct answer */
  partialScoring?: boolean;

  /** Partial scoring tolerance (how close counts as partial credit) */
  scoringTolerance?: number;

  /** Whether prompt is enabled */
  promptEnabled?: boolean;

  /** Whether rationale is enabled */
  rationaleEnabled?: boolean;
}

/**
 * Slider session - student's response
 */
export interface SliderSession {
  /** Selected numeric value (undefined if not yet answered) */
  value?: number;
}

/**
 * Slider evaluation result
 */
export interface SliderEvaluation {
  /** Score (0-1 normalized) */
  score: number;

  /** Whether the response is correct */
  correct: boolean;

  /** Partial credit awarded (0-1) if partialScoring enabled */
  partialCredit?: number;

  /** Difference from correct answer */
  difference?: number;
}

/**
 * PIE Environment - runtime context
 */
export interface PieEnvironment {
  /** Current mode */
  mode: 'gather' | 'view' | 'evaluate';

  /** Current role */
  role: 'student' | 'instructor';
}

/**
 * Component props for SliderComponent
 */
export interface SliderComponentProps {
  /** Element model/configuration */
  model: SliderModel;

  /** Current session state */
  session: SliderSession;

  /** Evaluation result (only in evaluate mode) */
  evaluation?: SliderEvaluation;

  /** PIE environment */
  env: PieEnvironment;

  /** Callback when session changes */
  onSessionChange: (session: SliderSession) => void;
}
