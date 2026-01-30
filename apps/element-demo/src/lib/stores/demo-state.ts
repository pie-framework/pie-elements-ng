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

// Element metadata
export const elementName = writable<string>('');
export const elementTitle = writable<string>('');
export const capabilities = writable<string[]>([]);

// Element data - these are the source of truth shared across all routes
export const model = writable<any>({});
export const session = writable<any>({});
export const controller = writable<any>(null);

// View mode and role
export const mode = writable<'gather' | 'view' | 'evaluate'>('gather');
export const role = writable<'student' | 'instructor'>('student');
export const partialScoring = writable<boolean>(true);
export const addCorrectResponse = writable<boolean>(false);

// Math renderer
export const mathRenderer = writable<any>(null);

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
  mathRenderer?: any;
}) {
  elementName.set(data.elementName);
  elementTitle.set(data.elementTitle);
  model.set(data.model);
  session.set(data.session);
  controller.set(data.controller);
  capabilities.set(data.capabilities);
  if (data.mathRenderer) {
    mathRenderer.set(data.mathRenderer);
  }
}

/**
 * Normalize session to ensure it has required structure
 */
function normalizeSession(nextSession: any) {
  const normalized = nextSession && typeof nextSession === 'object' ? nextSession : {};
  if ((normalized as any).value === undefined) {
    (normalized as any).value = [];
  }
  return normalized;
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
    sessionVersion.update((v) => v + 1);
    console.log('[demo-state] session updated', normalized);
  }
}

/**
 * Update model data (called from author/source views)
 * This propagates changes from author/source tabs to deliver tab
 */
export function updateModel(newModel: any) {
  const current = get(model);

  // Check if model actually changed
  if (JSON.stringify(newModel) !== JSON.stringify(current)) {
    model.set(newModel);
    modelVersion.update((v) => v + 1);
    console.log('[demo-state] model updated', newModel);
  }
}

/**
 * Reset session to initial state
 */
export function resetSession() {
  session.update(($session) => ({
    ...$session,
    value: [],
  }));
  sessionVersion.update((v) => v + 1);
}
