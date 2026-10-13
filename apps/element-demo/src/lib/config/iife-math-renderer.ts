/**
 * MathJax 3 for the IIFE player, as @pie-players/pie-item-player installs it under the `iife`
 * strategy: the legacy @pie-lib/math-rendering-module renderer on the two globals elements read.
 * pie-element-player then uses it, so no MathJax 4 loads. ESM pages keep the player's MathJax 4.
 */

const GLOBAL_KEY = '@pie-lib/math-rendering';
const GLOBAL_DLL_KEY = '_dll_pie_lib__math_rendering';

let installing: Promise<void> | null = null;

export function installIifeMathRenderer(): Promise<void> {
  const page = window as unknown as Record<string, unknown>;
  if (page[GLOBAL_KEY]) return Promise.resolve();

  installing ??= import('@pie-lib/math-rendering-module/module/index.js').then(
    ({ _dll_pie_lib__math_rendering }) => {
      // A renderer installed while the module loaded stays authoritative.
      if (page[GLOBAL_KEY]) return;
      page[GLOBAL_KEY] = _dll_pie_lib__math_rendering;
      page[GLOBAL_DLL_KEY] = _dll_pie_lib__math_rendering;
    }
  );
  return installing;
}
