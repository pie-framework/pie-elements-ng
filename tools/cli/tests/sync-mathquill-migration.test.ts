import { describe, expect, it } from 'vitest';
import {
  removeLegacyMathquillCssImports,
  transformLegacyMathFieldLatexCalls,
  transformMathquillImports,
  transformPackageJsonMathquill,
} from '../src/lib/upstream/sync-imports';

describe('mathquill migration transforms', () => {
  it('rewrites legacy mathquill source imports to shared-math-engine', () => {
    const input = `
import MQ1 from '@pie-framework/mathquill';
import MQ2 from "@pie-element/shared-mathquill";
`;
    const output = transformMathquillImports(input);

    expect(output).toContain("import MQ1 from '@pie-element/shared-math-engine';");
    expect(output).toContain("import MQ2 from '@pie-element/shared-math-engine';");
    expect(output).not.toContain('@pie-framework/mathquill');
    expect(output).not.toContain('@pie-element/shared-mathquill');
  });

  it('rewrites package deps from mathquill to shared-math-engine', () => {
    const input = {
      dependencies: {
        '@pie-framework/mathquill': '^1.0.0',
        '@pie-element/shared-mathquill': 'workspace:*',
        mathquill: '0.10.1',
      },
      devDependencies: {
        '@pie-framework/mathquill': '^1.0.0',
      },
    };

    const output = transformPackageJsonMathquill(input);

    expect(output.dependencies['@pie-element/shared-math-engine']).toBe('workspace:*');
    expect(output.dependencies['@pie-framework/mathquill']).toBeUndefined();
    expect(output.dependencies['@pie-element/shared-mathquill']).toBeUndefined();
    expect(output.dependencies.mathquill).toBeUndefined();
    expect(output.devDependencies['@pie-element/shared-math-engine']).toBe('workspace:*');
    expect(output.devDependencies['@pie-framework/mathquill']).toBeUndefined();
  });

  it('removes legacy mathquill stylesheet imports', () => {
    const input = `
import React from 'react';
import 'mathquill/build/mathquill.css';
import './styles.css';
`;
    const output = removeLegacyMathquillCssImports(input);
    expect(output).not.toContain("import 'mathquill/build/mathquill.css';");
    expect(output).toContain("import './styles.css';");
  });

  it('rewrites legacy mathField latex reads to getLatex', () => {
    const input = `
const latex = this.mqStatic.mathField.latex();
const next = editor.mathField.latex();
`;
    const output = transformLegacyMathFieldLatexCalls(input);
    expect(output).toContain('this.mqStatic.mathField.getLatex?.()');
    expect(output).toContain('editor.mathField.getLatex?.()');
    expect(output).not.toContain('.mathField.latex()');
  });
});
