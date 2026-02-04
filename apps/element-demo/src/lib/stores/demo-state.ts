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
  elementName.set(data.elementName);
  elementTitle.set(data.elementTitle);
  model.set(data.model);
  session.set(data.session);
  controller.set(data.controller);
  capabilities.set(data.capabilities);
  if (data.demos) {
    demos.set(data.demos);
  }
  if (data.activeDemoId) {
    activeDemoId.set(data.activeDemoId);
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
  }
}

/**
 * Update model data (called from author/source views)
 * This propagates changes from author/source tabs to deliver tab
 */
export function updateModel(newModel: any) {
  const current = get(model);

  console.log('[demo-state] updateModel called', {
    newModel,
    current,
    changed: JSON.stringify(newModel) !== JSON.stringify(current),
  });

  // Check if model actually changed
  if (JSON.stringify(newModel) !== JSON.stringify(current)) {
    model.set(newModel);
    const newVersion = get(modelVersion) + 1;
    modelVersion.update((v) => v + 1);
    console.log('[demo-state] Model updated, modelVersion incremented to', newVersion);
  } else {
    console.log('[demo-state] Model unchanged, not updating');
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

/**
 * Switch to a different demo by ID
 * This loads the demo's model and session and resets versions
 */
export function switchDemo(demoId: string) {
  const allDemos = get(demos);
  const demo = allDemos.find((d) => d.id === demoId);

  if (demo) {
    activeDemoId.set(demoId);
    model.set(demo.model || {});
    session.set(demo.session || { value: [] });
    modelVersion.update((v) => v + 1);
    sessionVersion.update((v) => v + 1);
  }
}
