import { describe, expect, it } from 'vitest';
import { transformLodashEsDeepImportsToFullySpecified } from '../src/lib/upstream/sync-imports';

describe('transformLodashEsDeepImportsToFullySpecified', () => {
  it('adds .js extension to deep lodash-es import specifiers', () => {
    const input = `
import compact from 'lodash-es/compact';
import isEqual from "lodash-es/isEqual";
`;

    const output = transformLodashEsDeepImportsToFullySpecified(input);

    expect(output).toContain("import compact from 'lodash-es/compact.js';");
    expect(output).toContain('import isEqual from "lodash-es/isEqual.js";');
  });

  it('keeps already fully specified lodash-es imports unchanged', () => {
    const input = `
import omit from 'lodash-es/omit.js';
const mod = await import("lodash-es/get.js");
`;

    const output = transformLodashEsDeepImportsToFullySpecified(input);

    expect(output).toBe(input);
  });

  it('does not modify root lodash-es imports', () => {
    const input = `
import { isEmpty } from 'lodash-es';
`;

    const output = transformLodashEsDeepImportsToFullySpecified(input);

    expect(output).toBe(input);
  });
});
