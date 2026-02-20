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
  source: 'local';
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
const MODEL_STORAGE_PREFIX = 'pie-element-demo-model:';
const SESSION_STORAGE_PREFIX = 'pie-element-demo-session:';
let currentModelStorageKey: string | null = null;
let currentSessionStorageKey: string | null = null;

function getModelStorageKey(currentElementName: string, currentDemoId: string) {
  return `${MODEL_STORAGE_PREFIX}${currentElementName}:${currentDemoId}`;
}

function getSessionStorageKey(currentElementName: string, currentDemoId: string) {
  return `${SESSION_STORAGE_PREFIX}${currentElementName}:${currentDemoId}`;
}

function normalizeModel(nextModel: any) {
  return nextModel && typeof nextModel === 'object' ? nextModel : {};
}

function readPersistedModel(storageKey: string): any | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return normalizeModel(JSON.parse(raw));
  } catch (error) {
    console.warn('[demo-state] Failed to read persisted model:', error);
    return null;
  }
}

function readPersistedSession(storageKey: string): any | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return normalizeSession(JSON.parse(raw));
  } catch (error) {
    console.warn('[demo-state] Failed to read persisted session:', error);
    return null;
  }
}

function writePersistedModel(nextModel: any) {
  if (typeof window === 'undefined' || !currentModelStorageKey) {
    return;
  }
  try {
    window.sessionStorage.setItem(currentModelStorageKey, JSON.stringify(nextModel || {}));
  } catch (error) {
    console.warn('[demo-state] Failed to persist model:', error);
  }
}

function writePersistedSession(nextSession: any) {
  if (typeof window === 'undefined' || !currentSessionStorageKey) {
    return;
  }
  try {
    window.sessionStorage.setItem(currentSessionStorageKey, JSON.stringify(nextSession || {}));
  } catch (error) {
    console.warn('[demo-state] Failed to persist session:', error);
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
  const resolvedDemoId = data.activeDemoId || 'default';
  currentModelStorageKey = getModelStorageKey(data.elementName, resolvedDemoId);
  currentSessionStorageKey = getSessionStorageKey(data.elementName, resolvedDemoId);
  const persistedModel = readPersistedModel(currentModelStorageKey);
  const persistedSession = readPersistedSession(currentSessionStorageKey);
  const nextModel = persistedModel ?? normalizeModel(data.model);
  const nextSession = persistedSession ?? normalizeSession(data.session);

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
  writePersistedModel(nextModel);
  writePersistedSession(nextSession);
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
  const normalized = normalizeSession(newSession);
  const current = get(session);

  // Check if session actually changed
  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
    session.set(normalized);
    writePersistedSession(normalized);
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
    writePersistedModel(normalized);
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
  writePersistedSession(nextSession);
  sessionVersion.update((v) => v + 1);
}

/**
 * Switch to a different demo by ID
 * This loads the demo's model and session and resets versions
 */
export function switchDemo(demoId: string) {
  const allDemos = get(demos);
  const demo = allDemos.find((d) => d.id === demoId);
  const currentElement = get(elementName);

  if (demo) {
    currentModelStorageKey = getModelStorageKey(currentElement, demoId);
    currentSessionStorageKey = getSessionStorageKey(currentElement, demoId);
    const persistedModel = readPersistedModel(currentModelStorageKey);
    const persistedSession = readPersistedSession(currentSessionStorageKey);
    const nextModel = persistedModel ?? normalizeModel(demo.model || {});
    const nextSession = persistedSession ?? normalizeSession(demo.session || {});
    activeDemoId.set(demoId);
    model.set(nextModel);
    session.set(nextSession);
    writePersistedModel(nextModel);
    writePersistedSession(nextSession);
    modelVersion.update((v) => v + 1);
    sessionVersion.update((v) => v + 1);
  }
}

export function clearPersistedDemoStateForElement(currentElementName: string) {
  if (typeof window === 'undefined') {
    return;
  }
  const modelPrefix = `${MODEL_STORAGE_PREFIX}${currentElementName}:`;
  const prefix = `${SESSION_STORAGE_PREFIX}${currentElementName}:`;
  for (let i = window.sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = window.sessionStorage.key(i);
    if (key?.startsWith(prefix) || key?.startsWith(modelPrefix)) {
      window.sessionStorage.removeItem(key);
    }
  }
}
