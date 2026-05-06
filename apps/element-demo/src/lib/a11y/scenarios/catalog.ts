import categorizeSamples from '../../samples/categorize.json' with { type: 'json' };
import chartingSamples from '../../samples/charting.json' with { type: 'json' };
import complexRubricSamples from '../../samples/complex-rubric.json' with { type: 'json' };
import dragInTheBlankSamples from '../../samples/drag-in-the-blank.json' with { type: 'json' };
import drawingResponseSamples from '../../samples/drawing-response.json' with { type: 'json' };
import ebsrSamples from '../../samples/ebsr.json' with { type: 'json' };
import explicitConstructedResponseSamples from '../../samples/explicit-constructed-response.json' with {
  type: 'json',
};
import extendedTextEntrySamples from '../../samples/extended-text-entry.json' with { type: 'json' };
import fractionModelSamples from '../../samples/fraction-model.json' with { type: 'json' };
import graphingSamples from '../../samples/graphing.json' with { type: 'json' };
import graphingSolutionSetSamples from '../../samples/graphing-solution-set.json' with {
  type: 'json',
};
import hotspotSamples from '../../samples/hotspot.json' with { type: 'json' };
import imageClozeAssociationSamples from '../../samples/image-cloze-association.json' with {
  type: 'json',
};
import inlineDropdownSamples from '../../samples/inline-dropdown.json' with { type: 'json' };
import likertSamples from '../../samples/likert.json' with { type: 'json' };
import matchSamples from '../../samples/match.json' with { type: 'json' };
import matchListSamples from '../../samples/match-list.json' with { type: 'json' };
import mathInlineSamples from '../../samples/math-inline.json' with { type: 'json' };
import mathTemplatedSamples from '../../samples/math-templated.json' with { type: 'json' };
import matrixSamples from '../../samples/matrix.json' with { type: 'json' };
import mcPopulatedBlankSamples from '../../samples/mc-populated-blank.json' with { type: 'json' };
import multiTraitRubricSamples from '../../samples/multi-trait-rubric.json' with { type: 'json' };
import multipleChoiceSamples from '../../samples/multiple-choice.json' with { type: 'json' };
import numberLineSamples from '../../samples/number-line.json' with { type: 'json' };
import passageSamples from '../../samples/passage.json' with { type: 'json' };
import placementOrderingSamples from '../../samples/placement-ordering.json' with { type: 'json' };
import rubricSamples from '../../samples/rubric.json' with { type: 'json' };
import selectTextSamples from '../../samples/select-text.json' with { type: 'json' };
import simpleClozeSamples from '../../samples/simple-cloze.json' with { type: 'json' };
import vennClassificationSamples from '../../samples/venn-classification.json' with {
  type: 'json',
};
import type {
  A11yAutomatedCheck,
  A11yConcern,
  A11yScanMode,
  A11yScanRole,
  A11yScenarioDefinition,
  A11yScenarioSummary,
} from './types';

type SampleDemo = {
  id: string;
  title: string;
  model: unknown;
  session?: unknown;
};

type SampleFile = {
  demos: SampleDemo[];
};

type ScenarioInput = {
  element: string;
  id: string;
  title: string;
  purpose: string;
  sample: SampleFile;
  sampleIndex?: number;
  mode?: A11yScanMode;
  role?: A11yScanRole;
  wcagCriteria: string[];
  concerns: A11yConcern[];
  automatedChecks?: A11yAutomatedCheck[];
  manualReviewNotes?: string[];
};

const interactiveChecks: A11yAutomatedCheck[] = [
  'axe',
  'interactive-control-name',
  'keyboard-tab-reach',
  'target-size',
];

const feedbackChecks: A11yAutomatedCheck[] = [...interactiveChecks, 'status-message'];

function roleForMode(mode: A11yScanMode): A11yScanRole {
  return mode === 'evaluate' ? 'instructor' : 'student';
}

function defineScenario(input: ScenarioInput): A11yScenarioDefinition {
  const sampleDemo = input.sample.demos[input.sampleIndex ?? 0];
  if (!sampleDemo) {
    throw new Error(`Missing sample demo for ${input.element}/${input.id}`);
  }

  const mode = input.mode ?? 'gather';

  return {
    id: input.id,
    element: input.element,
    title: input.title,
    purpose: input.purpose,
    mode,
    role: input.role ?? roleForMode(mode),
    wcagCriteria: input.wcagCriteria,
    concerns: input.concerns,
    automatedChecks: input.automatedChecks ?? interactiveChecks,
    model: sampleDemo.model,
    session: sampleDemo.session ?? {},
    sourceDemoId: sampleDemo.id,
    sourceDemoTitle: sampleDemo.title,
    manualReviewNotes: input.manualReviewNotes,
  };
}

export const A11Y_SCENARIOS: readonly A11yScenarioDefinition[] = [
  defineScenario({
    element: 'categorize',
    id: 'category-dropzone-keyboard-names',
    title: 'Category drop zones expose names and keyboard reachability',
    purpose:
      'Mounts a multi-category classification task to check labelled category regions, draggable choices, and keyboard-reachable controls.',
    sample: categorizeSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '2.5.7', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'spatial-interaction', 'target-size'],
  }),
  defineScenario({
    element: 'charting',
    id: 'editable-bar-chart-controls',
    title: 'Editable bar chart exposes data controls',
    purpose:
      'Checks that an interactive chart with editable data points exposes labelled controls, visible focus targets, and non-text chart affordances.',
    sample: chartingSamples,
    wcagCriteria: ['1.3.1', '1.4.1', '1.4.11', '2.1.1', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'visual-contrast', 'target-size'],
    manualReviewNotes: ['Confirm data values are understandable without relying on color alone.'],
  }),
  defineScenario({
    element: 'charting',
    id: 'line-chart-add-points',
    title: 'Line chart add-point workflow is keyboard reachable',
    purpose:
      'Exercises a line chart that asks students to add values, focusing on add controls, labels, and chart non-text contrast.',
    sample: chartingSamples,
    sampleIndex: 1,
    wcagCriteria: ['1.3.1', '1.4.11', '2.1.1', '2.5.8', '4.1.2'],
    concerns: ['keyboard-focus', 'visual-contrast', 'target-size'],
  }),
  defineScenario({
    element: 'complex-rubric',
    id: 'rubric-scale-structure',
    title: 'Complex rubric scale structure is programmatic',
    purpose:
      'Checks rubric scoring structure for headings, labels, table-like relationships, and readable long descriptors.',
    sample: complexRubricSamples,
    wcagCriteria: ['1.3.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'table-structure', 'reading-structure'],
    automatedChecks: ['axe', 'interactive-control-name', 'keyboard-tab-reach'],
  }),
  defineScenario({
    element: 'drag-in-the-blank',
    id: 'blank-drop-keyboard-alternative',
    title: 'Drag-in-the-blank exposes keyboard-operable blanks',
    purpose:
      'Checks draggable choices and blank targets for names, tab reachability, and single-pointer/keyboard alternatives.',
    sample: dragInTheBlankSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '2.5.7', '4.1.2'],
    concerns: ['keyboard-focus', 'spatial-interaction', 'semantics', 'target-size'],
  }),
  defineScenario({
    element: 'drawing-response',
    id: 'drawing-toolbar-controls',
    title: 'Drawing toolbar controls have names and target size',
    purpose:
      'Mounts the drawing canvas and toolbar to check labelled tool buttons, focus reachability, and minimum target size.',
    sample: drawingResponseSamples,
    wcagCriteria: ['1.1.1', '2.1.1', '2.5.1', '2.5.8', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'spatial-interaction', 'target-size'],
    manualReviewNotes: ['Confirm the drawing task has a meaningful non-pointer alternative.'],
  }),
  defineScenario({
    element: 'ebsr',
    id: 'two-part-choice-groups',
    title: 'Two-part EBSR choice groups are independently labelled',
    purpose:
      'Checks that Part A and Part B expose separate labelled choice groups with keyboard-reachable answers.',
    sample: ebsrSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance'],
  }),
  defineScenario({
    element: 'explicit-constructed-response',
    id: 'embedded-response-fields',
    title: 'Embedded response fields have labels and constraints',
    purpose:
      'Checks constructed-response blanks embedded in rich text for focus order, labels, and input-assistance metadata.',
    sample: explicitConstructedResponseSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance'],
  }),
  defineScenario({
    element: 'extended-text-entry',
    id: 'extended-text-editor-labels',
    title: 'Extended text editor exposes the response area',
    purpose:
      'Checks the response editor for a programmatic name, keyboard entry path, and target sizing for editor controls.',
    sample: extendedTextEntrySamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance', 'target-size'],
  }),
  defineScenario({
    element: 'fraction-model',
    id: 'fraction-segment-controls',
    title: 'Fraction segment controls are operable and named',
    purpose:
      'Checks a fraction model with visible segment controls for names, focus reachability, and non-text visual contrast.',
    sample: fractionModelSamples,
    wcagCriteria: ['1.3.1', '1.4.11', '2.1.1', '2.5.8', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'visual-contrast', 'target-size'],
  }),
  defineScenario({
    element: 'fraction-model',
    id: 'student-configurable-fraction-model',
    title: 'Student-configurable fraction model controls are labelled',
    purpose:
      'Exercises a configurable fraction model where students can change model structure, checking labels and target size.',
    sample: fractionModelSamples,
    sampleIndex: 2,
    wcagCriteria: ['1.3.1', '2.1.1', '2.5.8', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance', 'target-size'],
  }),
  defineScenario({
    element: 'graphing',
    id: 'graph-toolbar-keyboard-reach',
    title: 'Graphing toolbar is keyboard reachable',
    purpose:
      'Checks graphing tools, coordinate controls, and graph affordances for labels, keyboard reachability, and target size.',
    sample: graphingSamples,
    wcagCriteria: ['1.3.1', '1.4.11', '2.1.1', '2.5.1', '2.5.8', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'spatial-interaction', 'visual-contrast'],
    manualReviewNotes: ['Confirm graph drawing has a complete keyboard alternative.'],
  }),
  defineScenario({
    element: 'graphing-solution-set',
    id: 'solution-region-semantics',
    title: 'Graphing solution region communicates meaning without color only',
    purpose:
      'Checks shaded solution-set regions, graph controls, and axis labels for automated semantics and non-text contrast issues.',
    sample: graphingSolutionSetSamples,
    wcagCriteria: ['1.3.1', '1.4.1', '1.4.11', '2.1.1', '4.1.2'],
    concerns: ['semantics', 'visual-contrast', 'spatial-interaction'],
    manualReviewNotes: [
      'Confirm the solution region is understandable without relying only on color/shading.',
    ],
  }),
  defineScenario({
    element: 'hotspot',
    id: 'hotspot-region-names',
    title: 'Hotspot regions expose meaningful names',
    purpose:
      'Checks an image hotspot task for labelled interactive regions, keyboard reachability, and image/region alternatives.',
    sample: hotspotSamples,
    wcagCriteria: ['1.1.1', '1.3.1', '2.1.1', '2.5.1', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'media-alternatives', 'spatial-interaction'],
    manualReviewNotes: ['Confirm hotspot labels describe the target without revealing the answer.'],
  }),
  defineScenario({
    element: 'image-cloze-association',
    id: 'image-drop-target-alternatives',
    title: 'Image cloze targets and responses expose alternatives',
    purpose:
      'Checks image-based drop targets and possible responses for non-empty names, image alternatives, and keyboard reachability.',
    sample: imageClozeAssociationSamples,
    wcagCriteria: ['1.1.1', '1.3.1', '2.1.1', '2.5.7', '4.1.2'],
    concerns: ['media-alternatives', 'keyboard-focus', 'spatial-interaction', 'semantics'],
  }),
  defineScenario({
    element: 'inline-dropdown',
    id: 'inline-dropdown-combobox-labels',
    title: 'Inline dropdown blanks are labelled comboboxes',
    purpose:
      'Checks dropdown blanks embedded in text for labels, keyboard reachability, and expanded listbox semantics.',
    sample: inlineDropdownSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance'],
  }),
  defineScenario({
    element: 'likert',
    id: 'likert-scale-radio-group',
    title: 'Likert scale exposes radio-group semantics',
    purpose:
      'Checks scale labels, radio values, keyboard selection, and logical order for a Likert response.',
    sample: likertSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '2.4.6', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance'],
  }),
  defineScenario({
    element: 'match',
    id: 'matching-row-choice-labels',
    title: 'Matching rows expose prompt and answer controls',
    purpose: 'Checks row headers, answer controls, and per-row labels in a matching interaction.',
    sample: matchSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'table-structure'],
  }),
  defineScenario({
    element: 'match-list',
    id: 'match-list-association-controls',
    title: 'Match list association controls are labelled',
    purpose:
      'Checks two-column association prompts and answers for keyboard reachability and meaningful labels.',
    sample: matchListSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'table-structure'],
  }),
  defineScenario({
    element: 'math-inline',
    id: 'inline-math-editor-controls',
    title: 'Inline math editor exposes math input controls',
    purpose:
      'Checks inline math entry for editor naming, keyboard reachability, and MathJax/rendered math semantics.',
    sample: mathInlineSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['math-accessibility', 'keyboard-focus', 'input-assistance', 'semantics'],
  }),
  defineScenario({
    element: 'math-templated',
    id: 'templated-math-response-fields',
    title: 'Templated math fields expose response labels',
    purpose:
      'Checks math response blanks embedded in a template for names, focus order, and equation-editor affordances.',
    sample: mathTemplatedSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '3.3.2', '4.1.2'],
    concerns: ['math-accessibility', 'keyboard-focus', 'input-assistance', 'semantics'],
  }),
  defineScenario({
    element: 'matrix',
    id: 'matrix-row-column-relationships',
    title: 'Matrix rows and columns keep programmatic relationships',
    purpose:
      'Checks row labels, column labels, and selectable cells for table-like structure and keyboard reachability.',
    sample: matrixSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'table-structure'],
  }),
  defineScenario({
    element: 'mc-populated-blank',
    id: 'populated-blank-choice-labels',
    title: 'Populated blank answer choices are named',
    purpose:
      'Checks populated blank choices and stem text for labels, keyboard reachability, and target size.',
    sample: mcPopulatedBlankSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance', 'target-size'],
  }),
  defineScenario({
    element: 'mc-populated-blank',
    id: 'populated-blank-audio-transcript',
    title: 'Audio populated blank exposes transcript alternatives',
    purpose:
      'Checks the audio/transcript variant for media alternatives, labelled controls, and keyboard reachability.',
    sample: mcPopulatedBlankSamples,
    sampleIndex: 1,
    wcagCriteria: ['1.1.1', '1.2.1', '1.2.2', '2.1.1', '4.1.2'],
    concerns: ['media-alternatives', 'keyboard-focus', 'semantics'],
  }),
  defineScenario({
    element: 'multi-trait-rubric',
    id: 'multi-trait-rubric-table-structure',
    title: 'Multi-trait rubric traits and score points are structured',
    purpose:
      'Checks trait headings, score point descriptors, and scoring controls for programmatic relationships.',
    sample: multiTraitRubricSamples,
    wcagCriteria: ['1.3.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'table-structure', 'reading-structure'],
    automatedChecks: ['axe', 'interactive-control-name', 'keyboard-tab-reach'],
  }),
  defineScenario({
    element: 'multiple-choice',
    id: 'single-select-radio-group',
    title: 'Single-select choices expose radio semantics',
    purpose:
      'Checks a radio-style multiple-choice question for group labelling, keyboard selection, and state exposure.',
    sample: multipleChoiceSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance', 'target-size'],
  }),
  defineScenario({
    element: 'multiple-choice',
    id: 'evaluate-feedback-status',
    title: 'Evaluate feedback and correctness state are announced',
    purpose:
      'Mounts a scored multiple-choice state to check feedback, correctness indicators, and status-message semantics.',
    sample: multipleChoiceSamples,
    sampleIndex: 1,
    mode: 'evaluate',
    wcagCriteria: ['1.3.1', '3.3.1', '3.3.3', '4.1.2', '4.1.3'],
    concerns: ['status-feedback', 'semantics', 'input-assistance'],
    automatedChecks: feedbackChecks,
  }),
  defineScenario({
    element: 'number-line',
    id: 'number-line-point-controls',
    title: 'Number line point controls are keyboard reachable',
    purpose:
      'Checks number-line graph controls, tick labels, and point interactions for labels and keyboard reachability.',
    sample: numberLineSamples,
    wcagCriteria: ['1.3.1', '1.4.11', '2.1.1', '2.5.1', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'spatial-interaction', 'visual-contrast'],
  }),
  defineScenario({
    element: 'passage',
    id: 'passage-reading-structure',
    title: 'Passage text exposes reading structure',
    purpose:
      'Checks passage headings, body text, and navigation structure for automated semantics and reading order issues.',
    sample: passageSamples,
    wcagCriteria: ['1.3.1', '1.3.2', '2.4.6', '3.1.1'],
    concerns: ['reading-structure', 'semantics'],
    automatedChecks: ['axe'],
    manualReviewNotes: [
      'Confirm hidden layout text does not create confusing screen-reader output.',
    ],
  }),
  defineScenario({
    element: 'placement-ordering',
    id: 'ordering-keyboard-reorder',
    title: 'Placement ordering exposes keyboard reorder controls',
    purpose:
      'Checks ordered placement choices, guide labels, and reorder/drop interactions for keyboard accessibility.',
    sample: placementOrderingSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '2.5.7', '4.1.2'],
    concerns: ['keyboard-focus', 'spatial-interaction', 'semantics', 'target-size'],
  }),
  defineScenario({
    element: 'rubric',
    id: 'rubric-score-structure',
    title: 'Rubric score points expose labels and relationships',
    purpose:
      'Checks rubric score levels and descriptors for labels, headings, and programmatic structure.',
    sample: rubricSamples,
    wcagCriteria: ['1.3.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'table-structure', 'reading-structure'],
    automatedChecks: ['axe', 'interactive-control-name', 'keyboard-tab-reach'],
  }),
  defineScenario({
    element: 'select-text',
    id: 'select-text-token-semantics',
    title: 'Selectable text tokens expose selection state',
    purpose:
      'Checks tokenized passage selection for names, state exposure, keyboard reachability, and focus order.',
    sample: selectTextSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'reading-structure', 'target-size'],
  }),
  defineScenario({
    element: 'simple-cloze',
    id: 'simple-cloze-input-label',
    title: 'Simple cloze response input is labelled',
    purpose:
      'Checks a single cloze response input for a programmatic label, keyboard entry path, and input assistance.',
    sample: simpleClozeSamples,
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.6', '3.3.2', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'input-assistance'],
  }),
  defineScenario({
    element: 'venn-classification',
    id: 'venn-tile-region-keyboard',
    title: 'Venn tiles and regions expose names and keyboard placement',
    purpose:
      'Checks diagram regions and draggable tiles for names, keyboard reachability, and image/diagram semantics.',
    sample: vennClassificationSamples,
    wcagCriteria: ['1.1.1', '1.3.1', '2.1.1', '2.5.7', '4.1.2'],
    concerns: ['semantics', 'keyboard-focus', 'spatial-interaction', 'media-alternatives'],
  }),
];

export function getAllA11yScenarios(): readonly A11yScenarioDefinition[] {
  return A11Y_SCENARIOS;
}

export function getA11yScenariosForElement(elementName: string): A11yScenarioDefinition[] {
  return A11Y_SCENARIOS.filter((scenario) => scenario.element === elementName);
}

export function getA11yScenario(
  elementName: string,
  scenarioId: string | null
): A11yScenarioDefinition | undefined {
  const scenarios = getA11yScenariosForElement(elementName);
  return scenarioId ? scenarios.find((scenario) => scenario.id === scenarioId) : scenarios[0];
}

export function summarizeScenario(scenario: A11yScenarioDefinition): A11yScenarioSummary {
  return {
    id: scenario.id,
    element: scenario.element,
    title: scenario.title,
    purpose: scenario.purpose,
    mode: scenario.mode,
    role: scenario.role,
    wcagCriteria: scenario.wcagCriteria,
    concerns: scenario.concerns,
    automatedChecks: scenario.automatedChecks,
    sourceDemoId: scenario.sourceDemoId,
    sourceDemoTitle: scenario.sourceDemoTitle,
    manualReviewNotes: scenario.manualReviewNotes,
  };
}
