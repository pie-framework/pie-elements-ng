import { describe, expect, it } from 'vitest';
import {
  transformClassnamesToClsx,
  transformKnownDeepImportsToFullySpecified,
  transformReactInteropComponentImports,
  transformReactInputAutosizeToLocal,
} from '../src/lib/upstream/sync-imports';
import {
  createPieLibTransformPipeline,
  createReactComponentTransformPipeline,
} from '../src/lib/upstream/sync-transforms';

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
    expect(output).toContain("import * as RenderUiNamespace from '@pie-lib/render-ui';");
    expect(output).toContain(
      "const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible') || unwrapReactInteropSymbol(renderUi.Collapsible, 'Collapsible');"
    );
    expect(output).toContain(
      "const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt') || unwrapReactInteropSymbol(renderUi.PreviewPrompt, 'PreviewPrompt');"
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
    expect(output).toContain("import * as RenderUiNamespace from '@pie-lib/render-ui';");
    expect(output).toContain(
      "const InputContainer = unwrapReactInteropSymbol(InputContainerImport, 'InputContainer') || unwrapReactInteropSymbol(renderUi.InputContainer, 'InputContainer');"
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

describe('browser ESM dependency import transform', () => {
  it('rewrites classnames imports to clsx', () => {
    const input = `
import classNames from 'classnames';
import cx from "classnames";

export const one = classNames('a', false && 'b');
export const two = cx('c');
`;

    const output = transformClassnamesToClsx(input);

    expect(output).toContain("import classNames from 'clsx';");
    expect(output).toContain('import cx from "clsx";');
    expect(output).not.toContain('classnames');
  });

  it('rewrites react-input-autosize imports to the local autosize input component', () => {
    const input = `
import React from 'react';
import AutosizeInput from 'react-input-autosize';

export const Label = () => (
  <AutosizeInput
    inputRef={(node) => console.log(node)}
    inputStyle={{ minWidth: 20 }}
    value="A"
  />
);
`;

    const output = transformReactInputAutosizeToLocal(input);

    expect(output).toContain("import { AutosizeInput } from './autosize-input.js';");
    expect(output).toContain('<AutosizeInput');
    expect(output).not.toContain('react-input-autosize');
    expect(output).not.toContain('AutosizeInputComponent');
  });

  it('preserves react-input-autosize local import aliases when rewriting', () => {
    const input = `
import React from 'react';
import AutoInput from 'react-input-autosize';

export const Label = () => <AutoInput value="A" />;
`;

    const output = transformReactInputAutosizeToLocal(input);

    expect(output).toContain("import { AutosizeInput as AutoInput } from './autosize-input.js';");
    expect(output).toContain('<AutoInput value="A" />');
    expect(output).not.toContain('react-input-autosize');
  });

  it('does not rewrite react-input-autosize outside generated autosize packages', () => {
    const output = createPieLibTransformPipeline()(
      'import AutosizeInput from \'react-input-autosize\';\nexport const Foo = () => <AutosizeInput value="x" />;\n',
      'pie-lib/packages/plot/src/mark-label.jsx'
    );

    expect(output).toContain("import AutosizeInput from 'react-input-autosize';");
  });

  it('runs through the React element sync pipeline', () => {
    const output = createReactComponentTransformPipeline('@pie-element/test')(
      "import cx from 'classnames';\nexport { cx };\n",
      'src/delivery/index.js'
    );

    expect(output).toContain("import cx from 'clsx';");
  });

  it('runs through the pie-lib sync pipeline', () => {
    const output = createPieLibTransformPipeline()(
      "import cx from 'classnames';\nexport { cx };\n",
      'pie-lib/packages/graphing/src/index.jsx'
    );

    expect(output).toContain("import cx from 'clsx';");
  });

  it('runs the autosize replacement through the pie-lib sync pipeline', () => {
    const output = createPieLibTransformPipeline()(
      'import AutosizeInput from \'react-input-autosize\';\nexport const Foo = () => <AutosizeInput value="x" />;\n',
      'pie-lib/packages/graphing/src/mark-label.jsx'
    );

    expect(output).toContain("import { AutosizeInput } from './autosize-input.js';");
    expect(output).not.toContain('react-input-autosize');
  });
});
