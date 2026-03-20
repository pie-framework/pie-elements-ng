import { describe, expect, it } from 'vitest';
import {
  transformConfigureUtilsImports,
  transformLegacyConfigureLibImports,
  transformSelfReferentialImports,
} from '../src/lib/upstream/sync-imports';

describe('transformLegacyConfigureLibImports', () => {
  it('rewrites @pie-element configure/lib imports to package roots', () => {
    const input = `
import RubricConfigure from '@pie-element/rubric/configure/lib';
import MultiTraitRubricConfigure from "@pie-element/multi-trait-rubric/configure/lib";
`;

    const output = transformLegacyConfigureLibImports(input);

    expect(output).toContain("import RubricConfigure from '@pie-element/rubric';");
    expect(output).toContain(
      "import MultiTraitRubricConfigure from '@pie-element/multi-trait-rubric';"
    );
  });

  it('does not change already-valid package imports', () => {
    const input = `
import RubricConfigure from '@pie-element/rubric';
`;

    const output = transformLegacyConfigureLibImports(input);

    expect(output).toBe(input);
  });
});

describe('transformConfigureUtilsImports', () => {
  it('rewrites configure root util import to explicit .js path', () => {
    const input = `
import { choicesToMarkup } from '../utils';
`;

    const output = transformConfigureUtilsImports(input, 'configure/src/main.jsx');
    expect(output).toContain("from './utils.js'");
  });

  it('is a no-op for non-configure-root files', () => {
    const input = `
import { choicesToMarkup } from '../utils';
`;

    const output = transformConfigureUtilsImports(input, 'configure/src/design/main.jsx');
    expect(output).toBe(input);
  });
});

describe('transformSelfReferentialImports', () => {
  it('rewrites self-package imports to explicit index.js relative path', () => {
    const input = `
import { FractionModelChart } from '@pie-element/fraction-model';
`;

    const output = transformSelfReferentialImports(
      input,
      '@pie-element/fraction-model',
      'configure/src/main.jsx'
    );
    expect(output).toContain("from '../delivery/index.js'");
  });
});
