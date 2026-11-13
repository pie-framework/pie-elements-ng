/**
 * The ECMAScript version the bundles compile to. esbuild lowers newer syntax to it, and what it
 * cannot lower can break at run time: `**` becomes `Math.pow`, which throws on a BigInt. Keep it
 * the same as the pie-api-aws bundler's target; `tests/bundle-target.test.ts` runs the shared
 * scoring code compiled to it.
 */
export const BUNDLE_TARGET = 'es2015';
