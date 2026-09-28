/**
 * Reporting for pages that run MathJax 3 beside this adapter's MathJax 4. PIE supports one
 * MathJax major version per page; on a mixed page rendering is best effort, and the developer
 * learns why from the console and from {@link MATHJAX_CONFLICT_EVENT}.
 */

export const UNSUPPORTED_PAGE_DOCS_URL =
  'https://github.com/pie-framework/pie-players/blob/develop/docs/item-player/loading-strategies.md#one-mathjax-version-per-page';

/**
 * Dispatched on `window` once per condition per page, with a {@link MathjaxConflictDetail}.
 * Hosts and players forward it to their instrumentation.
 */
export const MATHJAX_CONFLICT_EVENT = 'pie-mathjax-version-conflict';

export type MathjaxConflictCondition =
  /** `window.MathJax` is a MathJax 3 build. */
  | 'mathjax-3-global'
  /** Another MathJax output stylesheet was added to `<head>` beside this adapter's. */
  | 'foreign-output-stylesheet'
  /** `window['@pie-lib/math-rendering']` routes ESM element math to MathJax 3. */
  | 'legacy-renderer-delegation';

export interface MathjaxConflictDetail {
  condition: MathjaxConflictCondition;
  message: string;
  docsUrl: string;
}

// Every element bundles its own copy of this module, so what was reported is kept on the page.
const REPORTED: unique symbol = Symbol.for(
  '@pie-element/shared-math-rendering-mathjax/unsupported-page'
);

type ReportRegistry = {
  [REPORTED]?: { logged: boolean; conditions: MathjaxConflictCondition[] };
};

/**
 * Logs one `console.error` per page, for the first condition seen, and dispatches
 * {@link MATHJAX_CONFLICT_EVENT} once for each condition.
 */
export function reportUnsupportedPage(condition: MathjaxConflictCondition, detail: string): void {
  if (typeof window === 'undefined') return;
  const registry = globalThis as ReportRegistry;
  registry[REPORTED] ??= { logged: false, conditions: [] };
  const reported = registry[REPORTED];
  if (reported.conditions.includes(condition)) return;
  reported.conditions.push(condition);

  const message =
    `[math-rendering] Unsupported page (${condition}): ${detail}. ` +
    'PIE supports one MathJax major version per page; with MathJax 3 and 4 on one page, math ' +
    `rendering is best effort and may break. See ${UNSUPPORTED_PAGE_DOCS_URL}`;
  if (!reported.logged) {
    reported.logged = true;
    console.error(message);
  }
  window.dispatchEvent(
    new CustomEvent<MathjaxConflictDetail>(MATHJAX_CONFLICT_EVENT, {
      detail: { condition, message, docsUrl: UNSUPPORTED_PAGE_DOCS_URL },
    })
  );
}

/** The version of `window.MathJax` when it is a MathJax 3 build. */
export function mathjax3Version(): string | undefined {
  const version = (window as { MathJax?: { version?: unknown } }).MathJax?.version;
  return typeof version === 'string' && version.startsWith('3.') ? version : undefined;
}
