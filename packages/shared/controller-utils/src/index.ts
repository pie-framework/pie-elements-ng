/**
 * Controller Utilities
 *
 * Shared utilities for PIE element controllers, including partial scoring
 * and choice persistence/shuffling.
 */

export { lockChoices, getShuffledChoices } from './persistence.js';
export * as partialScoring from './partial-scoring.js';
export { contentLanguage, foldCase, foldDigits, normalizeResponse } from './response-normalizer.js';
export type { NormalizeOptions } from './response-normalizer.js';
