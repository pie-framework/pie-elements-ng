/**
 * Stands in for `@mathjax/src/mjs/components/global.js` in the bundled engine, with the same
 * exports (see vite.browser.config.ts). The original binds `GLOBAL` to `window` and creates or
 * wraps `window.MathJax` as it evaluates. Here `MathJax` is an object of this module, which
 * `./mathjax.ts` fills in and the menu reads.
 */
import { VERSION } from '@mathjax/src/js/components/version.js';

type Config = Record<string, any>;

export const GLOBAL: Config = {};

export function isObject(x: unknown): x is Config {
  return typeof x === 'object' && x !== null;
}

export function combineConfig(dst: Config, src: Config, check = false): Config {
  for (const id of Object.keys(src)) {
    if (id === '__esModule' || dst[id] === src[id] || src[id] === null || src[id] === undefined) {
      continue;
    }
    if (isObject(dst[id]) && isObject(src[id])) {
      combineConfig(dst[id], src[id], check || id === '_');
    } else if (!check || !Object.getOwnPropertyDescriptor(dst, id)?.get) {
      dst[id] = src[id];
    }
  }
  return dst;
}

export function combineDefaults(dst: Config, name: string, src: Config): Config {
  if (!dst[name]) dst[name] = {};
  const target = dst[name];
  for (const id of Object.keys(src)) {
    if (isObject(target[id]) && isObject(src[id])) {
      combineDefaults(target, id, src[id]);
    } else if (target[id] == null && src[id] != null) {
      target[id] = src[id];
    }
  }
  return target;
}

export const MathJax: Config = { version: VERSION, _: {}, config: {} };
GLOBAL.MathJax = MathJax;

export function combineWithMathJax(config: Config): Config {
  return combineConfig(MathJax, config);
}
