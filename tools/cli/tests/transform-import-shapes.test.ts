import { describe, expect, it } from 'vitest';
import {
  transformMenuToInlineMenu,
  transformReactInputAutosizeToLocal,
} from '../src/lib/upstream/sync-imports';

describe('import-shape upstream transforms', () => {
  it('rewrites MUI Menu default imports without touching comments', () => {
    const input = `// import Menu from '@mui/material/Menu' remains documentation text.
import Menu from '@mui/material/Menu';
`;

    const output = transformMenuToInlineMenu(input);

    expect(output).toBe(`// import Menu from '@mui/material/Menu' remains documentation text.
import { InlineMenu as Menu } from '@pie-lib/render-ui';
`);
    expect(transformMenuToInlineMenu(output)).toBe(output);
  });

  it('preserves Menu type imports when replacing a default plus named import', () => {
    const input = `const doc = "import Menu, { MenuProps } from '@mui/material/Menu'";
import Menu, { MenuProps } from '@mui/material/Menu';
`;

    const output = transformMenuToInlineMenu(input);

    expect(output).toBe(`const doc = "import Menu, { MenuProps } from '@mui/material/Menu'";
import { InlineMenu as Menu } from '@pie-lib/render-ui';
import type { MenuProps } from '@mui/material/Menu';
`);
  });

  it('rewrites react-input-autosize imports and JSX tags without touching text', () => {
    const input = `// import AutosizeInput from 'react-input-autosize' remains documentation text.
const doc = "<AutosizeInputComponent value='A' />";
import AutosizeInput from 'react-input-autosize';
const AutosizeInputComponent = AutosizeInput?.default ?? AutosizeInput;

export const Label = () => <AutosizeInputComponent value="A" />;
`;

    const output = transformReactInputAutosizeToLocal(
      input,
      'pie-lib/packages/graphing/src/mark-label.jsx'
    );

    expect(
      output
    ).toBe(`// import AutosizeInput from 'react-input-autosize' remains documentation text.
const doc = "<AutosizeInputComponent value='A' />";
import { AutosizeInput } from './autosize-input.js';


export const Label = () => <AutosizeInput value="A" />;
`);
    expect(
      transformReactInputAutosizeToLocal(output, 'pie-lib/packages/graphing/src/mark-label.jsx')
    ).toBe(output);
  });
});
