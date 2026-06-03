import { describe, expect, it } from 'vitest';
import { transformLodashToVendoredLodash } from '../src/lib/upstream/sync-imports';

describe('transformLodashToVendoredLodash deep imports', () => {
  it('rewrites deep lodash-es import specifiers to vendored named imports', () => {
    const input = `
import compact from 'lodash-es/compact';
import isEqual from "lodash-es/isEqual";
`;

    const output = transformLodashToVendoredLodash(input);

    expect(output).toContain("import { compact } from '@pie-element/shared-lodash';");
    expect(output).toContain('import { isEqual } from "@pie-element/shared-lodash";');
  });

  it('rewrites already fully specified lodash-es imports and preserves dynamic deep default shape', () => {
    const input = `
import omit from 'lodash-es/omit.js';
const mod = await import("lodash-es/get.js");
`;

    const output = transformLodashToVendoredLodash(input);

    expect(output).toContain("import { omit } from '@pie-element/shared-lodash';");
    expect(output).toContain("import { get } from '@pie-element/shared-lodash';");
    expect(output).toContain('const mod = await Promise.resolve({ default: get, get });');
  });

  it('rewrites root lodash-es imports', () => {
    const input = `
import { isEmpty } from 'lodash-es';
`;

    const output = transformLodashToVendoredLodash(input);

    expect(output).toBe(`
import { isEmpty } from '@pie-element/shared-lodash';
`);
  });
});
