import { describe, expect, it } from 'vitest';
import {
  transformClassnamesToClsx,
  transformControllerUtilsImports,
  transformKnownDeepImportsToFullySpecified,
  transformLegacyConfigureLibImports,
  transformPieFrameworkEventImports,
  transformSharedPackageImports,
} from '../src/lib/upstream/sync-imports';

describe('specifier-only upstream transforms', () => {
  it('rewrites classnames imports without touching comments or string literals', () => {
    const input = `// from 'classnames' should remain documentation text.
const message = "from 'classnames' should remain literal text";
import classNames from 'classnames';
export { classNames as cx } from "classnames";
`;

    const output = transformClassnamesToClsx(input);

    expect(output).toBe(`// from 'classnames' should remain documentation text.
const message = "from 'classnames' should remain literal text";
import classNames from 'clsx';
export { classNames as cx } from "clsx";
`);
    expect(transformClassnamesToClsx(output)).toBe(output);
  });

  it('rewrites event package specifiers without touching comments or string literals', () => {
    const input = `// from '@pie-framework/pie-player-events' remains documentation text.
const literal = "from '@pie-framework/pie-configure-events'";
import { PiePlayerEvent } from '@pie-framework/pie-player-events';
export { PieConfigureEvent } from "@pie-framework/pie-configure-events";
`;

    const output = transformPieFrameworkEventImports(input);

    expect(output).toBe(`// from '@pie-framework/pie-player-events' remains documentation text.
const literal = "from '@pie-framework/pie-configure-events'";
import { PiePlayerEvent } from '@pie-element/shared-player-events';
export { PieConfigureEvent } from "@pie-element/shared-configure-events";
`);
    expect(transformPieFrameworkEventImports(output)).toBe(output);
  });

  it('rewrites controller-utils and shared package specifiers structurally', () => {
    const input = `const doc = "from '@pie-lib/controller-utils' and from '@pie-lib/math-rendering'";
import { model } from '@pie-lib/controller-utils';
export { renderMath } from '@pie-lib/math-rendering';
import { Feedback } from "@pie-lib/feedback";
`;

    const output = transformSharedPackageImports(transformControllerUtilsImports(input));

    expect(
      output
    ).toBe(`const doc = "from '@pie-lib/controller-utils' and from '@pie-lib/math-rendering'";
import { model } from '@pie-element/shared-controller-utils';
export { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { Feedback } from "@pie-element/shared-feedback";
`);
    expect(transformSharedPackageImports(transformControllerUtilsImports(output))).toBe(output);
  });

  it('rewrites known deep dynamic imports without touching ordinary strings', () => {
    const input = `const doc = "import('react-konva/lib/ReactKonvaCore') stays literal text";
import { Stage } from 'react-konva/lib/ReactKonvaCore';
const mod = await import("react-konva/lib/ReactKonvaCore");
`;

    const output = transformKnownDeepImportsToFullySpecified(input);

    expect(output).toBe(`const doc = "import('react-konva/lib/ReactKonvaCore') stays literal text";
import { Stage } from 'react-konva/lib/ReactKonvaCore.js';
const mod = await import("react-konva/lib/ReactKonvaCore.js");
`);
    expect(transformKnownDeepImportsToFullySpecified(output)).toBe(output);
  });

  it('rewrites legacy configure package specifiers structurally', () => {
    const input = `const doc = "from '@pie-element/rubric/configure/lib' stays literal text";
import RubricConfigure from '@pie-element/rubric/configure/lib';
export { Configure } from "@pie-element/multi-trait-rubric/configure/lib";
`;

    const output = transformLegacyConfigureLibImports(input);

    expect(output).toBe(`const doc = "from '@pie-element/rubric/configure/lib' stays literal text";
import RubricConfigure from '@pie-element/rubric/author';
export { Configure } from "@pie-element/multi-trait-rubric/author";
`);
    expect(transformLegacyConfigureLibImports(output)).toBe(output);
  });
});
