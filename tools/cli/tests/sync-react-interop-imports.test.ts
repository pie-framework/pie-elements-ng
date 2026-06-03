import { describe, expect, it } from 'vitest';
import {
  transformClassnamesToClsx,
  transformKnownDeepImportsToFullySpecified,
  transformLodashToVendoredLodash,
  transformConfigUiMathjsToLocalFraction,
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
  it('rewrites root lodash imports to the vendored shared lodash package', () => {
    const input = `
import _ from 'lodash';
import * as lodash from 'lodash-es';
import { cloneDeep, isEqual as equals } from 'lodash-es';
`;

    const output = transformLodashToVendoredLodash(input);

    expect(output).toContain("import _ from '@pie-element/shared-lodash';");
    expect(output).toContain("import * as lodash from '@pie-element/shared-lodash';");
    expect(output).toContain(
      "import { cloneDeep, isEqual as equals } from '@pie-element/shared-lodash';"
    );
    expect(output).not.toContain('lodash-es');
    expect(output).not.toContain("from 'lodash'");
  });

  it('rewrites lodash deep default imports to named vendored imports', () => {
    const input = `
import same from 'lodash-es/isEqual.js';
import omit from 'lodash/omit';
`;

    const output = transformLodashToVendoredLodash(input);

    expect(output).toContain("import { isEqual as same } from '@pie-element/shared-lodash';");
    expect(output).toContain("import { omit } from '@pie-element/shared-lodash';");
    expect(output).not.toContain('lodash-es/');
    expect(output).not.toContain('lodash/');
  });

  it('rewrites config-ui mathjs fraction conversion to a local helper', () => {
    const input = `
import * as math from 'mathjs';

export const closest = (value, number) =>
  Math.abs(math.number(math.fraction(value)) - math.number(math.fraction(number)));
`;

    const output = transformConfigUiMathjsToLocalFraction(
      input,
      'pie-lib/packages/config-ui/src/number-text-field-custom.jsx'
    );

    expect(output).toContain("import { fractionToNumber } from './fraction-to-number.js';");
    expect(output).toContain('Math.abs(fractionToNumber(value) - fractionToNumber(number))');
    expect(output).not.toContain('mathjs');
    expect(output).not.toContain('math.');
  });

  it('does not rewrite mathjs outside config-ui fraction input source', () => {
    const output = createReactComponentTransformPipeline('@pie-element/number-line')(
      "import * as math from 'mathjs';\nexport const value = math.evaluate('1/2');\n",
      'src/author/index.js'
    );

    expect(output).toContain("import * as math from 'mathjs';");
    expect(output).toContain("math.evaluate('1/2')");
  });

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
      "import cx from 'classnames';\nimport { isEmpty } from 'lodash';\nexport { cx, isEmpty };\n",
      'src/delivery/index.js'
    );

    expect(output).toContain("import cx from 'clsx';");
    expect(output).toContain("import { isEmpty } from '@pie-element/shared-lodash';");
  });

  it('runs through the pie-lib sync pipeline', () => {
    const output = createPieLibTransformPipeline()(
      "import cx from 'classnames';\nexport { cx };\n",
      'pie-lib/packages/graphing/src/index.jsx'
    );

    expect(output).toContain("import cx from 'clsx';");
  });

  it('runs the config-ui mathjs replacement through the pie-lib sync pipeline', () => {
    const output = createPieLibTransformPipeline()(
      "import * as math from 'mathjs';\nexport const n = math.number(math.fraction(value));\n",
      'pie-lib/packages/config-ui/src/number-text-field-custom.jsx'
    );

    expect(output).toContain("import { fractionToNumber } from './fraction-to-number.js';");
    expect(output).toContain('export const n = fractionToNumber(value);');
    expect(output).not.toContain('mathjs');
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
