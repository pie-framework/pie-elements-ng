/**
 * The interface locale a player publishes to the elements inside it.
 *
 * A host sets one locale on its player; the player answers the
 * `interfaceLocaleContext` composition context from `@pie-players/pie-context`
 * for every element in it, and republishes when the locale changes or a lazily
 * loaded catalog becomes resident. With no player the request goes unanswered
 * and the callback never fires, so the caller keeps its fallback
 * (`model.language`, then `en-US` — the transitional precedence while
 * `@pie-lib/translator` has dependents).
 */
import {
  connectContextWithRetry,
  type InterfaceLocaleContextValue,
  interfaceLocaleContext,
} from '@pie-players/pie-context';

export { type InterfaceLocaleContextValue, interfaceLocaleContext };

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
