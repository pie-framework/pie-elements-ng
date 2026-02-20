import { describe, expect, it } from 'vitest';
import {
  transformKnownDeepImportsToFullySpecified,
  transformReactInteropComponentImports,
} from '../src/lib/upstream/sync-imports';

describe('react interop component import transform', () => {
  it('rewrites @mdi/react default import with interop-safe unwrapping', () => {
    const input = `
import React from 'react';
import Icon from '@mdi/react';

export const Foo = () => <Icon path="x" />;
`;

    const output = transformReactInteropComponentImports(input);

    expect(output).toContain("import IconImport from '@mdi/react';");
    expect(output).toContain("const Icon = unwrapReactInteropSymbol(IconImport, 'Icon');");
    expect(output).toContain('function unwrapReactInteropSymbol(');
  });

  it('rewrites react-konva named imports with interop-safe unwrapping', () => {
    const input = `
import React from 'react';
import { Stage, Layer } from 'react-konva';

export const Foo = () => <Stage><Layer /></Stage>;
`;

    const output = transformReactInteropComponentImports(input);

    expect(output).toContain(
      "import { Stage as StageImport, Layer as LayerImport } from 'react-konva';"
    );
    expect(output).toContain("const Stage = unwrapReactInteropSymbol(StageImport, 'Stage');");
    expect(output).toContain("const Layer = unwrapReactInteropSymbol(LayerImport, 'Layer');");
    expect(output).toContain('function unwrapReactInteropSymbol(');
  });

  it('rewrites component-like @pie-lib/render-ui named imports while preserving utility imports', () => {
    const input = `
import React from 'react';
import { Collapsible, color, PreviewPrompt, hasText } from '@pie-lib/render-ui';

export const Foo = () => (
  <Collapsible>
    <PreviewPrompt prompt="<p>x</p>" />
  </Collapsible>
);
`;

    const output = transformReactInteropComponentImports(input);

    expect(output).toContain(
      "import { Collapsible as CollapsibleImport, color, PreviewPrompt as PreviewPromptImport, hasText } from '@pie-lib/render-ui';"
    );
    expect(output).toContain(
      "const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible');"
    );
    expect(output).toContain(
      "const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt');"
    );
    expect(output).toContain('function unwrapReactInteropSymbol(');
  });

  it('handles multiline @pie-lib/render-ui imports without splitting import statements', () => {
    const input = `
import React from 'react';
import {
  InputContainer,
  color,
} from '@pie-lib/render-ui';

export const Foo = () => <InputContainer />;
`;

    const output = transformReactInteropComponentImports(input);

    expect(output).toContain(
      "import { InputContainer as InputContainerImport, color } from '@pie-lib/render-ui';"
    );
    expect(output).toContain(
      "const InputContainer = unwrapReactInteropSymbol(InputContainerImport, 'InputContainer');"
    );
    expect(output).not.toContain('import { InputCo\nfunction isRenderableReactInteropType');
  });

  it('is a no-op when no risky imports exist', () => {
    const input = `
import React from 'react';
import Button from '@mui/material/Button';
`;
    const output = transformReactInteropComponentImports(input);
    expect(output).toBe(input);
  });
});

describe('known deep import extension transform', () => {
  it('adds .js to react-konva ReactKonvaCore deep import', () => {
    const input = `
import { Rect } from 'react-konva/lib/ReactKonvaCore';
`;

    const output = transformKnownDeepImportsToFullySpecified(input);
    expect(output).toContain("import { Rect } from 'react-konva/lib/ReactKonvaCore.js';");
  });
});
