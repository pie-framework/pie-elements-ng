import { describe, it, expect } from 'vitest';
import { transformToAssignProps } from '../src/commands/upstream/sync-imports';

describe('transformToAssignProps', () => {
  it('transforms Object.entries().forEach pattern', () => {
    const input = `
const element = document.createElement('div');
Object.entries(props).forEach(([key, value]) => { element[key] = value; });
`;

    const output = transformToAssignProps(input);

    expect(output).toContain('assignProps(element, props);');
    expect(output).toContain("import { assignProps } from '@pie-elements-ng/shared-utils';");
    expect(output).not.toContain('Object.entries');
  });

  it('transforms for...of loop pattern', () => {
    const input = `
const element = document.createElement('div');
for (const [key, value] of Object.entries(props)) { element[key] = value; }
`;

    const output = transformToAssignProps(input);

    expect(output).toContain('assignProps(element, props);');
    expect(output).toContain("import { assignProps } from '@pie-elements-ng/shared-utils';");
    expect(output).not.toContain('Object.entries');
  });

  it('adds import after existing imports', () => {
    const input = `
import React from 'react';
import PropTypes from 'prop-types';

const element = document.createElement('div');
Object.entries(props).forEach(([key, value]) => { element[key] = value; });
`;

    const output = transformToAssignProps(input);

    expect(output).toContain("import { assignProps } from '@pie-elements-ng/shared-utils';");
    const propTypesIndex = output.indexOf("from 'prop-types'");
    const assignPropsIndex = output.indexOf("from '@pie-elements-ng/shared-utils'");
    expect(assignPropsIndex).toBeGreaterThan(propTypesIndex);
  });

  it('does not add import if already present', () => {
    const input = `
import { assignProps } from '@pie-elements-ng/shared-utils';

const element = document.createElement('div');
Object.entries(props).forEach(([key, value]) => { element[key] = value; });
`;

    const output = transformToAssignProps(input);

    // Count occurrences of the import
    const matches = output.match(/import.*?@pie-elements-ng\/shared-utils/g);
    expect(matches).toHaveLength(1);
  });

  it('handles multiple patterns in same file', () => {
    const input = `
const el1 = document.createElement('div');
Object.entries(props1).forEach(([key, value]) => { el1[key] = value; });

const el2 = document.createElement('span');
for (const [key, value] of Object.entries(props2)) { el2[key] = value; }
`;

    const output = transformToAssignProps(input);

    expect(output).toContain('assignProps(el1, props1);');
    expect(output).toContain('assignProps(el2, props2);');
    expect(output).not.toContain('Object.entries');
  });

  it('does not modify files without matching patterns', () => {
    const input = `
const element = document.createElement('div');
element.textContent = 'Hello';
`;

    const output = transformToAssignProps(input);

    expect(output).toBe(input);
    expect(output).not.toContain('assignProps');
  });

  it('handles different variable names', () => {
    const input = `
const node = document.createElement('div');
Object.entries(properties).forEach(([k, v]) => { node[k] = v; });
`;

    const output = transformToAssignProps(input);

    expect(output).toContain('assignProps(node, properties);');
  });
});
