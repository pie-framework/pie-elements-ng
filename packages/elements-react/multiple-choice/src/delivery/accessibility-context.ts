/**
 * The student's accessibility supports, read from the Player through the `pie.accessibility`
 * context (pie-players ADR 0003).
 *
 * The key is the cross-repo contract. It is declared here with pie-context's own factory rather
 * than imported, because no `@pie-players/pie-context` release exports it yet; the `Symbol.for`
 * registration makes the two the same key on the page, so switching to the package import once it
 * releases is a one-line change, as for `@pie-element/shared-i18n`'s interface locale. The
 * subscription comes from the package: it re-requests when a provider announces itself after the
 * element connected. An unanswered request means the Player provides no context, so the element
 * keeps its defaults and never waits. Lives here until a second element reads the context.
 */
import { connectContextWithRetry, createContext } from '@pie-players/pie-context';

/** The value a Player answers with: the support ids in effect after its policy. */
export interface AccessibilityContextValue {
  supports: readonly string[];
}

export const accessibilityContext = createContext<AccessibilityContextValue>(
  Symbol.for('pie.accessibility')
);

/**
 * The support id that keeps math out of choice names, naming a choice from its key and a note so
 * the screen reader reads the math in the content (PIE-1244). A prototype id for comparing that
 * pattern with spoken names: keep it out of profiles until the comparison decides the default.
 */
export const MATH_OUTSIDE_NAMES = 'mathOutsideNames';

/** The `supports` of a context value, or none when the value has another shape. */
function supportsOf(value: unknown): readonly string[] {
  const supports = (value as { supports?: unknown } | null | undefined)?.supports;
  return Array.isArray(supports) ? supports.filter((id): id is string => typeof id === 'string') : [];
}

/**
 * Calls `onChange` with the supports in effect for `element` each time its Player answers,
 * including a change the Player makes later. Call it from `connectedCallback`; returns the
 * cleanup for `disconnectedCallback`.
 */
export function subscribeAccessibilitySupports(
  element: Element,
  onChange: (supports: readonly string[]) => void
): () => void {
  return connectContextWithRetry(element, accessibilityContext, (value) => onChange(supportsOf(value)));
}
