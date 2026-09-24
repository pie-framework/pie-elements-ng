/**
 * The package gives Svelte components render-ui's colour tokens, so every token render-ui
 * exports has a counterpart here that resolves to the same CSS.
 */
import { describe, expect, it } from 'vitest';
import * as renderUi from '../../../lib-react/render-ui/src/color';
import * as styling from '../src/color';

type Module = Record<string, unknown>;

/** Each exported token function, called, keyed by name. `v` is the factory, not a token. */
function resolvedTokens(module: Module): Record<string, string> {
  return Object.fromEntries(
    Object.entries(module)
      .filter(([name, value]) => name !== 'v' && typeof value === 'function')
      .map(([name, value]) => [name, (value as () => string)()])
  );
}

describe('colour parity with @pie-lib/render-ui', () => {
  it('exports the same token functions, resolving to the same variable chain and fallback', () => {
    expect(resolvedTokens(styling)).toEqual(resolvedTokens(renderUi));
  });

  it('has the same defaults and visual-element colours', () => {
    expect(styling.defaults).toEqual(renderUi.defaults);
    expect(styling.visualElementsColors).toEqual(renderUi.visualElementsColors);
  });

  it('lists every token function on the `color` object', () => {
    expect(Object.keys(styling.color).sort()).toEqual(Object.keys(resolvedTokens(styling)).sort());
  });
});
