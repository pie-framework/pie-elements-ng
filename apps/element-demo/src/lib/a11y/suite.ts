import { ELEMENT_REGISTRY, getElement, type ElementMetadata } from '$lib/elements/registry';
import {
  getA11yScenario,
  getA11yScenariosForElement,
  summarizeScenario,
} from './scenarios/catalog';
import { A11Y_SCAN_MODES } from './scenarios/types';
import type {
  A11yScanMode,
  A11yScanRole,
  A11yScenarioDefinition,
  A11yScenarioSummary,
} from './scenarios/types';

export { A11Y_SCAN_MODES };
export type {
  A11yAutomatedCheck,
  A11yConcern,
  A11yScanMode,
  A11yScanRole,
  A11yScenarioDefinition,
  A11yScenarioSummary,
} from './scenarios/types';

export interface A11yDemoConfig {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  model: unknown;
  session?: unknown;
}

export interface A11yElementInventoryEntry extends ElementMetadata {
  demos: A11yDemoSummary[];
  scanModes: readonly A11yScanMode[];
}

export interface A11yScenarioInventoryEntry extends ElementMetadata {
  scenarios: A11yScenarioSummary[];
}

export interface A11yDemoSummary {
  id: string;
  title: string;
  description?: string;
  tags: string[];
}

export interface A11yElementScanData {
  element: ElementMetadata;
  demos: A11yDemoConfig[];
  scenarios: A11yScenarioSummary[];
  activeDemo: A11yDemoConfig;
  activeScenario?: A11yScenarioDefinition;
  coverage: A11yDemoCoverage;
  mode: A11yScanMode;
  role: A11yScanRole;
  player: 'esm' | 'iife';
  scanSource: 'scenario' | 'inventory';
}

export interface A11yDemoCoverage {
  summary: string;
  facts: string[];
}

type SampleModule = {
  default?: {
    demos?: A11yDemoConfig[];
  };
};

export function roleForA11yMode(mode: A11yScanMode): A11yScanRole {
  return mode === 'evaluate' ? 'instructor' : 'student';
}

export function normalizeA11yMode(value: string | null): A11yScanMode {
  return value === 'evaluate' ? 'evaluate' : 'gather';
}

export function describeA11yDemoCoverage(demo: A11yDemoConfig): A11yDemoCoverage {
  const model = isRecord(demo.model) ? demo.model : {};
  const facts: string[] = [];

  addFact(facts, model.element, 'Element model');
  addFact(facts, model.chartType, 'Chart type');
  addFact(facts, model.choiceMode, 'Choice mode');
  addFact(facts, model.scoringType, 'Scoring');

  addCountFact(facts, model.choices, 'Choices');
  addCountFact(facts, model.categories, 'Categories');
  addCountFact(facts, model.data, 'Data points');
  addCountFact(facts, model.tokens, 'Selectable tokens');

  addBooleanFact(facts, model.prompt, model.promptEnabled !== false, 'Prompt content');
  addBooleanFact(
    facts,
    model.teacherInstructions,
    model.teacherInstructionsEnabled !== false,
    'Teacher instructions'
  );
  addBooleanFact(facts, model.rationale, model.rationaleEnabled !== false, 'Rationale');
  addBooleanFact(facts, model.correctAnswer, true, 'Correct answer');
  addBooleanFact(
    facts,
    model.addCategoryEnabled,
    model.addCategoryEnabled,
    'Student add-category flow'
  );
  addBooleanFact(
    facts,
    model.changeEditableEnabled,
    model.changeEditableEnabled,
    'Editable chart/data flow'
  );
  addBooleanFact(
    facts,
    model.changeInteractiveEnabled,
    model.changeInteractiveEnabled,
    'Interactive chart/data flow'
  );

  const sessionKeys = isRecord(demo.session) ? Object.keys(demo.session) : [];
  if (sessionKeys.length > 0) {
    facts.push(`Starts with session fields: ${sessionKeys.join(', ')}`);
  }

  if (demo.tags && demo.tags.length > 0) {
    facts.push(`Tags: ${demo.tags.join(', ')}`);
  }

  return {
    summary:
      demo.description || `Sample "${demo.title}" for ${String(model.element ?? 'this element')}.`,
    facts,
  };
}

export async function loadElementDemos(elementName: string): Promise<A11yDemoConfig[]> {
  try {
    const configModule = (await import(`$lib/samples/${elementName}.json`)) as SampleModule;
    const loadedDemos = configModule.default?.demos;
    if (Array.isArray(loadedDemos) && loadedDemos.length > 0) {
      return loadedDemos;
    }
  } catch {
    // Missing sample files are represented as a default empty demo so inventory stays complete.
  }

  return [
    {
      id: 'default',
      title: 'Default',
      description: 'Generated fallback demo because no sample file was found.',
      tags: ['fallback'],
      model: {},
      session: {},
    },
  ];
}

export async function getA11yInventory(): Promise<A11yElementInventoryEntry[]> {
  const entries = await Promise.all(
    ELEMENT_REGISTRY.map(async (element) => {
      const demos = await loadElementDemos(element.name);
      return {
        ...element,
        demos: demos.map((demo) => ({
          id: demo.id,
          title: demo.title,
          description: demo.description,
          tags: demo.tags ?? [],
        })),
        scanModes: A11Y_SCAN_MODES,
      };
    })
  );

  return entries;
}

export function getA11yScenarioInventory(): A11yScenarioInventoryEntry[] {
  return ELEMENT_REGISTRY.map((element) => ({
    ...element,
    scenarios: getA11yScenariosForElement(element.name).map(summarizeScenario),
  }));
}

export async function loadA11yElementScanData(
  elementName: string,
  requestedScenarioId: string | null,
  requestedDemoId: string | null,
  requestedMode: string | null,
  requestedPlayer: string | null
): Promise<A11yElementScanData | null> {
  const element = getElement(elementName);
  if (!element) {
    return null;
  }

  const demos = await loadElementDemos(elementName);
  const scenarios = getA11yScenariosForElement(elementName);
  const activeScenario = getA11yScenario(elementName, requestedScenarioId ?? null);
  const activeDemo = activeScenario
    ? scenarioToDemo(activeScenario)
    : (demos.find((demo) => demo.id === requestedDemoId) ?? demos[0]);
  const mode = activeScenario?.mode ?? normalizeA11yMode(requestedMode);

  return {
    element,
    demos,
    scenarios: scenarios.map(summarizeScenario),
    activeDemo,
    activeScenario,
    coverage: activeScenario
      ? describeA11yScenarioCoverage(activeScenario)
      : describeA11yDemoCoverage(activeDemo),
    mode,
    role: activeScenario?.role ?? roleForA11yMode(mode),
    player: requestedPlayer === 'iife' ? 'iife' : 'esm',
    scanSource: activeScenario ? 'scenario' : 'inventory',
  };
}

function scenarioToDemo(scenario: A11yScenarioDefinition): A11yDemoConfig {
  return {
    id: scenario.id,
    title: scenario.title,
    description: scenario.purpose,
    tags: [...scenario.concerns, ...scenario.wcagCriteria.map((criterion) => `wcag-${criterion}`)],
    model: scenario.model,
    session: scenario.session ?? {},
  };
}

function describeA11yScenarioCoverage(scenario: A11yScenarioDefinition): A11yDemoCoverage {
  return {
    summary: scenario.purpose,
    facts: [
      `Mode: ${scenario.mode}`,
      `Role: ${scenario.role}`,
      `Concerns: ${scenario.concerns.join(', ')}`,
      `Automated checks: ${scenario.automatedChecks.join(', ')}`,
      ...(scenario.sourceDemoTitle ? [`Fixture source: ${scenario.sourceDemoTitle}`] : []),
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function addFact(facts: string[], value: unknown, label: string) {
  if (typeof value === 'string' && value.trim()) {
    facts.push(`${label}: ${value}`);
  }
}

function addCountFact(facts: string[], value: unknown, label: string) {
  if (Array.isArray(value)) {
    facts.push(`${label}: ${value.length}`);
  }
}

function addBooleanFact(facts: string[], value: unknown, enabled: unknown, label: string) {
  if (value && enabled) {
    facts.push(label);
  }
}
