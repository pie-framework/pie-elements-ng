import { describe, expect, it } from 'vitest';
import { transformLegacyConfigureLibImports } from '../src/lib/upstream/sync-imports';

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
