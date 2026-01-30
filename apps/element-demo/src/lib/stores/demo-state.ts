/**
 * Demo State Stores
 *
 * Shared state management for the element demo app using SvelteKit stores.
 * This allows state to persist across routes and enables bookmarkable URLs.
 */

import { writable, derived } from 'svelte/store';

// Element metadata
export const elementName = writable<string>('');
export const elementTitle = writable<string>('');
export const capabilities = writable<string[]>([]);

// Element data
export const model = writable<any>({});
export const session = writable<any>({});
export const controller = writable<any>(null);

// View mode and role
export const mode = writable<'gather' | 'view' | 'evaluate'>('gather');
export const role = writable<'student' | 'instructor'>('student');

// Theme
export const theme = writable<'light' | 'dark'>('light');

// Derived: Can access evaluate mode
export const canEvaluate = derived(role, ($role) => $role === 'instructor');

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
}) {
  elementName.set(data.elementName);
  elementTitle.set(data.elementTitle);
  model.set(data.model);
  session.set(data.session);
  controller.set(data.controller);
  capabilities.set(data.capabilities);
}

/**
 * Update session data (called when elements fire session-changed events)
 */
export function updateSession(newSession: any) {
  session.set(newSession);
}

/**
 * Update model data (called from author/source views)
 */
export function updateModel(newModel: any) {
  model.set(newModel);
}

/**
 * Reset session to initial state
 */
export function resetSession() {
  session.update(($session) => ({
    ...$session,
    value: [],
  }));
}
