/**
 * The interface locale a player publishes to the elements inside it.
 *
 * A host sets one locale on its player; the player answers the
 * `Symbol.for('pie.interfaceLocale')` composition context for every element in
 * it, and republishes when the locale changes or a lazily loaded catalog
 * becomes resident. With no player the request goes unanswered and the
 * callback never fires, so the caller keeps its fallback (`model.language`,
 * then `en-US` — the transitional precedence while `@pie-lib/translator` has
 * dependents).
 *
 * The key is the cross-repo contract, shared with pie-players'
 * `@pie-players/pie-context` `interfaceLocaleContext` (PRD: Interface locale).
 * It is declared here rather than imported because the pie-context version this
 * repository pins predates that export; the subscription machinery comes from
 * the package, which is key-agnostic, so switching the constant to the package
 * import once the contract releases is a one-line change.
 */
import { connectContextWithRetry, createContext } from '@pie-players/pie-context';

/** The value a player publishes: what the chrome should speak, and which way it flows. */
export interface InterfaceLocaleContextValue {
  locale: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Built with pie-context's own factory, exactly as the player half builds its
 * `interfaceLocaleContext`: the `Symbol.for` registration makes the two the
 * same key on the page, and this constant is what the package import replaces
 * once the contract releases.
 */
export const interfaceLocaleContext = createContext<InterfaceLocaleContextValue>(
  Symbol.for('pie.interfaceLocale')
);

/**
 * Calls `onLocale` with the interface locale in effect for `host` whenever a
 * player publishes it, including a change the host makes later. With no
 * player it is never called. Call it from `connectedCallback`, where the
 * request can reach the player; returns the cleanup for `disconnectedCallback`.
 */
export function subscribeInterfaceLocale(
  host: Element,
  onLocale: (value: InterfaceLocaleContextValue) => void
): () => void {
  return connectContextWithRetry(host, interfaceLocaleContext, onLocale);
}
