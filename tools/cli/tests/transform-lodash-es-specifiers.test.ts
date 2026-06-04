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

  it('does not rewrite lodash-looking text in comments or string literals', () => {
    const input = `// import get from 'lodash-es/get' remains documentation text.
const staticLiteral = "from 'lodash-es'";
const dynamicLiteral = "import('lodash-es/get.js')";
import get from 'lodash-es/get';
import { isEmpty } from "lodash-es";
const mod = await import('lodash-es/omit.js');
`;

    const output = transformLodashToVendoredLodash(input);

    expect(output).toContain("// import get from 'lodash-es/get' remains documentation text.");
    expect(output).toContain('const staticLiteral = "from \'lodash-es\'";');
    expect(output).toContain('const dynamicLiteral = "import(\'lodash-es/get.js\')";');
    expect(output).toContain("import { get } from '@pie-element/shared-lodash';");
    expect(output).toContain('import { isEmpty } from "@pie-element/shared-lodash";');
    expect(output).toContain("import { omit } from '@pie-element/shared-lodash';");
    expect(output).toContain('const mod = await Promise.resolve({ default: omit, omit });');
    expect(transformLodashToVendoredLodash(output)).toBe(output);
  });

  it('vendors every executable lodash module specifier after transform', () => {
    const input = `
import same from 'lodash/isEqual';
import { default as getValue } from 'lodash-es/get.js';
export { default as throttle } from 'lodash/throttle';
export { debounce as debounceFn } from 'lodash-es';
const lodash = await import('lodash');
const mod = await import('lodash-es/omit.js');
`;

    const output = transformLodashToVendoredLodash(input);

    expect(output).toContain("import { isEqual as same } from '@pie-element/shared-lodash';");
    expect(output).toContain("import { get as getValue } from '@pie-element/shared-lodash';");
    expect(output).toContain("export { throttle } from '@pie-element/shared-lodash';");
    expect(output).toContain(
      "export { debounce as debounceFn } from '@pie-element/shared-lodash';"
    );
    expect(output).toContain("const lodash = await import('@pie-element/shared-lodash');");
    expect(output).toContain('const mod = await Promise.resolve({ default: omit, omit });');
    expect(output).not.toMatch(/from ['"]lodash(?:-es)?(?:\/|['"])/);
    expect(output).not.toMatch(/import\(['"]lodash(?:-es)?(?:\/|['"])/);
  });
});
