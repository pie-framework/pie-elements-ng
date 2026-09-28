/**
 * Demo State Stores
 *
 * Shared state for the accessibility demo app.
 */

import { writable } from 'svelte/store';

export const theme = writable<'light' | 'dark'>('light');
