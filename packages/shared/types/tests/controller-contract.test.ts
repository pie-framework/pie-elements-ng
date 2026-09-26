import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const sharedDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONTRACT_FILE = join(sharedDir, 'types', 'tests', '__controller-contract__.ts');

// A controller written against PieController persists its choice order the way every ng
// controller does: through getShuffledChoices, and by calling updateSession directly. Players
// implement updateSession as pie-players' players-shared/src/pie/updates.ts does.
const CONTRACT_SOURCE = `
import type { PieController, PieUpdateSession } from '@pie-element/shared-types';
import { getShuffledChoices } from '@pie-element/shared-controller-utils';

export const model: PieController['model'] = async (_question, _session, env, updateSession) => {
  await getShuffledChoices([{ value: 'a' }], { id: 's', element: 'e' }, updateSession, 'value');
  await updateSession?.('s', 'e', { shuffledValues: ['a'] });
  return { disabled: false, mode: env.mode };
};

export const fromPlayer: PieUpdateSession = (
  _id: string,
  _elementName: string,
  _properties: Record<string, unknown>
) => Promise.resolve();
`;

function typeErrors(): string[] {
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    baseUrl: sharedDir,
    paths: {
      '@pie-element/shared-types': ['types/src/index.ts'],
      '@pie-element/shared-controller-utils': ['controller-utils/src/index.ts'],
    },
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile;
  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName === CONTRACT_FILE
      ? ts.createSourceFile(fileName, CONTRACT_SOURCE, languageVersion)
      : getSourceFile.call(host, fileName, languageVersion, ...rest);
  const fileExists = host.fileExists;
  host.fileExists = (fileName) => fileName === CONTRACT_FILE || fileExists.call(host, fileName);

  const program = ts.createProgram([CONTRACT_FILE], options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

describe('PieController contract', () => {
  it('types updateSession as the (id, element, properties) call controllers make', () => {
    expect(typeErrors()).toEqual([]);
  });
});
