import { describe, expect, it } from 'vitest';
import { transformCommonJsNamedImports } from '../src/lib/upstream/sync-imports';
import {
  createControllerTransformPipeline,
  createReactComponentTransformPipeline,
} from '../src/lib/upstream/sync-transforms';

describe('transformCommonJsNamedImports', () => {
  it('rewrites a named humps import to a default import and a destructure', () => {
    const input = `import debug from 'debug';
import { camelizeKeys } from 'humps';

export const model = (question) => camelizeKeys(question);
`;

    const output = transformCommonJsNamedImports(input);

    expect(output).toBe(`import debug from 'debug';
import humps from 'humps';
const { camelizeKeys } = humps;

export const model = (question) => camelizeKeys(question);
`);
    expect(transformCommonJsNamedImports(output)).toBe(output);
  });

  it('keeps aliases and the quote style', () => {
    const input = `import { camelizeKeys as camelize, decamelizeKeys } from "humps";\n`;

    expect(transformCommonJsNamedImports(input)).toBe(
      `import humps from "humps";\nconst { camelizeKeys: camelize, decamelizeKeys } = humps;\n`
    );
  });

  it('destructures from an existing default binding', () => {
    const input = `import h, { camelizeKeys } from 'humps';\n`;

    expect(transformCommonJsNamedImports(input)).toBe(
      `import h from 'humps';\nconst { camelizeKeys } = h;\n`
    );
  });

  it('leaves other modules and default-only imports alone', () => {
    const input = `import { camelizeKeys } from './humps';
import humps from 'humps';
import { camelize } from 'humps-extra';
`;

    expect(transformCommonJsNamedImports(input)).toBe(input);
  });

  it('runs in the controller and component sync pipelines', () => {
    const input = `import { camelizeKeys } from 'humps';\nexport const run = (value) => camelizeKeys(value);\n`;

    for (const output of [
      createControllerTransformPipeline()(input, 'controller/src/index.js'),
      createReactComponentTransformPipeline('@pie-element/test')(input, 'src/utils.js'),
    ]) {
      expect(output).toContain(`import humps from 'humps';\nconst { camelizeKeys } = humps;`);
      expect(output).not.toContain(`import { camelizeKeys } from 'humps'`);
    }
  });
});
