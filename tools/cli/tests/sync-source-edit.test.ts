import { describe, expect, it } from 'vitest';
import { rewriteModuleSpecifiers } from '../src/lib/upstream/sync-source-edit';

describe('rewriteModuleSpecifiers', () => {
  it('rewrites module specifiers without reformatting surrounding source', () => {
    const input = `// This comment mentions from 'classnames' and should not change.
import React from 'react';
import {
  cx,
  type ClassValue,
} from "classnames";
import type { PieModel } from '@pie-framework/pie-player-events';
export { renderMath } from '@pie-lib/math-rendering';

const moduleRef = await import('react-konva/lib/ReactKonvaCore');
const literal = "import('classnames')";
`;

    const output = rewriteModuleSpecifiers(input, (specifier) => {
      if (specifier === 'classnames') return 'clsx';
      if (specifier === '@pie-framework/pie-player-events') {
        return '@pie-element/shared-player-events';
      }
      if (specifier === '@pie-lib/math-rendering') {
        return '@pie-element/shared-math-rendering-mathjax';
      }
      if (specifier === 'react-konva/lib/ReactKonvaCore') {
        return 'react-konva/lib/ReactKonvaCore.js';
      }
      return undefined;
    });

    expect(output).toBe(`// This comment mentions from 'classnames' and should not change.
import React from 'react';
import {
  cx,
  type ClassValue,
} from "clsx";
import type { PieModel } from '@pie-element/shared-player-events';
export { renderMath } from '@pie-element/shared-math-rendering-mathjax';

const moduleRef = await import('react-konva/lib/ReactKonvaCore.js');
const literal = "import('classnames')";
`);
  });

  it('is idempotent when run repeatedly', () => {
    const input = `
import classNames from 'classnames';
export { InlineMenu } from '@pie-lib/render-ui';
`;

    const transform = (source: string) =>
      rewriteModuleSpecifiers(source, (specifier) => {
        if (specifier === 'classnames') return 'clsx';
        if (specifier === '@pie-lib/render-ui') return '@pie-lib/render-ui';
        return undefined;
      });

    const once = transform(input);
    expect(transform(once)).toBe(once);
  });

  it('reports import, export, dynamic import, side-effect, and type-only context', () => {
    const seen: Array<[string, string, boolean, boolean]> = [];
    const input = `
import 'side-effect-package';
import type { Foo } from '@pie-framework/controller-utils';
export type { Bar } from '@pie-lib/render-ui';
const mod = import('@mdi/react');
`;

    rewriteModuleSpecifiers(input, (specifier, context) => {
      seen.push([specifier, context.kind, context.isTypeOnly, context.isSideEffectOnly]);
      return undefined;
    });

    expect(seen).toEqual([
      ['side-effect-package', 'import', false, true],
      ['@pie-framework/controller-utils', 'import', true, false],
      ['@pie-lib/render-ui', 'export', true, false],
      ['@mdi/react', 'dynamic-import', false, false],
    ]);
  });
});
