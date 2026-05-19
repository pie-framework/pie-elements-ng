/**
 * Demo State Stores
 *
 * Shared state management for the element demo app using SvelteKit stores.
 * This allows state to persist across routes and enables bookmarkable URLs.
 *
 * State synchronization flow:
 * - Changes in source tab (when accepted) -> update model store -> triggers rebuild in deliver/author
 * - Changes in author tab -> update model store -> triggers rebuild in deliver/source
 * - Changes in deliver tab (session) -> update session store -> visible in all tabs
 */

import { writable, derived, get } from 'svelte/store';

// Demo configuration
export interface DemoConfig {
  id: string;
  title: string;
  description: string;
  tags: string[];
  model: any;
  session?: any;
}

// Element metadata
export const elementName = writable<string>('');
export const elementTitle = writable<string>('');
export const capabilities = writable<string[]>([]);

// Demo management
export const demos = writable<DemoConfig[]>([]);
export const activeDemoId = writable<string>('default');
export const activeDemoIndex = derived([demos, activeDemoId], ([$demos, $activeDemoId]) => {
  const index = $demos.findIndex((d) => d.id === $activeDemoId);
  return index >= 0 ? index : 0;
});

// Element data - these are the source of truth shared across all routes
export const model = writable<any>({});
export const session = writable<any>({});
export const controller = writable<any>(null);

export interface IifeBuildMeta {
  hash?: string;
  duration?: number;
  cached?: boolean;
  source: 'local' | 'hosted';
  url: string;
  stage?: string;
  error?: string | null;
}
export const iifeBuildMeta = writable<IifeBuildMeta | null>(null);
export const iifeBuildLoading = writable<boolean>(false);
export const iifeBuildRequestVersion = writable<number>(0);

// View mode and role
export const mode = writable<'gather' | 'view' | 'evaluate'>('gather');
export const role = writable<'student' | 'instructor'>('student');
export const partialScoring = writable<boolean>(true);
export const addCorrectResponse = writable<boolean>(false);

// Theme
export const theme = writable<'light' | 'dark'>('light');

// Derived: Can access evaluate mode
export const canEvaluate = derived(role, ($role) => $role === 'instructor');

// Has configure/print capabilities
export const hasConfigure = derived(capabilities, ($caps) => $caps.includes('author'));
export const hasPrint = derived(capabilities, ($caps) => $caps.includes('print'));

// Version tracking for change detection
export const modelVersion = writable<number>(0);
export const sessionVersion = writable<number>(0);

function normalizeModel(nextModel: any) {
  return nextModel && typeof nextModel === 'object' ? nextModel : {};
}

function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value)) as T;
    } catch {
      return value;
    }
  }
}

function createValueSignature(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? '__undefined__' : serialized;
  } catch {
    return `__unserializable__:${String(value)}`;
  }
}

/**
 * Initialize stores from loaded data
 */
export function initializeDemo(data: {
  elementName: string;
  elementTitle: string;
  model: any;
  session: any;
  controller: any;
  capabilities: string[];
  demos?: DemoConfig[];
  activeDemoId?: string;
}) {
  const incomingModel = normalizeModel(data.model);
  // Always start from canonical sample model so demo updates are reflected immediately.
  const nextModel = cloneValue(incomingModel);
  const nextSession = cloneValue(normalizeSession(data.session));

  elementName.set(data.elementName);
  elementTitle.set(data.elementTitle);
  model.set(nextModel);
  session.set(nextSession);
  controller.set(data.controller);
  capabilities.set(data.capabilities);
  if (data.demos) {
    demos.set(data.demos);
  }
  if (data.activeDemoId) {
    activeDemoId.set(data.activeDemoId);
  }
  iifeBuildMeta.set(null);
  iifeBuildLoading.set(false);
  iifeBuildRequestVersion.set(0);
}

export function requestIifeRebuild() {
  iifeBuildRequestVersion.update((v) => v + 1);
}

/**
 * Normalize session to ensure it has required structure
/**
 * Normalize session to ensure it's an object
 * Note: Don't impose a specific structure like {value: []} as different elements
 * use different session structures (e.g., graphing-solution-set uses {answer: []})
 */
function normalizeSession(nextSession: any) {
  return nextSession && typeof nextSession === 'object' ? nextSession : {};
}

/**
 * Update session data (called when elements fire session-changed events)
 * This propagates changes from deliver tab to all other tabs
 */
export function updateSession(newSession: any) {
  const normalized = cloneValue(normalizeSession(newSession));
  const current = cloneValue(normalizeSession(get(session)));

  // Check if session actually changed
  if (createValueSignature(normalized) !== createValueSignature(current)) {
    session.set(normalized);
    sessionVersion.update((v) => v + 1);
  }
}

/**
 * Update model data (called from author/source views)
 * This propagates changes from author/source tabs to deliver tab
 */
export function updateModel(newModel: any) {
  const normalized = normalizeModel(newModel);
  const current = get(model);

  console.log('[demo-state] updateModel called', {
    newModel: normalized,
    current,
    changed: JSON.stringify(normalized) !== JSON.stringify(current),
  });

  // Check if model actually changed
  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
    model.set(normalized);
    const newVersion = get(modelVersion) + 1;
    modelVersion.update((v) => v + 1);
    console.log('[demo-state] Model updated, modelVersion incremented to', newVersion);
  } else {
    console.log('[demo-state] Model unchanged, not updating');
  }
}

/**
 * Reset session to initial state
/**
 * Reset session to initial state
 * Note: This clears the session but keeps its structure
 */
export function resetSession() {
  const nextSession = {};
  session.set(nextSession);
  sessionVersion.update((v) => v + 1);
}

/**
 * Switch to a different demo by ID
 * This loads the demo's model and session and resets versions
 */
export function switchDemo(demoId: string) {
  const allDemos = get(demos);
  const demo = allDemos.find((d) => d.id === demoId);

  if (demo) {
    const incomingModel = normalizeModel(demo.model || {});
    // Always switch to canonical sample model for selected demo.
    const nextModel = cloneValue(incomingModel);
    const nextSession = cloneValue(normalizeSession(demo.session || {}));
    activeDemoId.set(demoId);
    model.set(nextModel);
    session.set(nextSession);
    modelVersion.update((v) => v + 1);
    sessionVersion.update((v) => v + 1);
  }
}

export function clearPersistedDemoStateForElement(currentElementName: string) {
  // Intentionally a no-op: demo model/session caching is disabled.
  void currentElementName;
}
