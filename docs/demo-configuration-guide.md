# Demo Configuration Guide

## Overview

All PIE element demos are maintained locally in this project. The demo app reads an element's demo scenarios from `apps/element-demo/src/lib/samples/<element>.json`. A new element's `docs/demo/config.mjs` seeds that file; from then on, edit the JSON.

## Demo Config Structure

Each demo config exports a `demos` array with multiple demo objects, and the samples JSON holds the same object:

```javascript
export default {
  demos: [
    {
      id: 'unique-demo-id',
      title: 'Demo Title',
      description: 'Brief description of what this demo shows',
      tags: ['tag1', 'tag2', 'tag3'],
      model: {
        // Element model configuration
        id: '1',
        element: 'element-name',
        // ... element-specific properties
      },
      session: {
        // Optional initial session state
      }
    },
    // ... more demos
  ]
};
```

## Creating Demo Configs for New Elements

When adding a new element, create a demo config with 3-5 demos:

1. **Location**: `packages/elements-{react,svelte}/<element-name>/docs/demo/config.mjs`

2. **Number of demos**: Aim for 3-5 demos per element that showcase:
   - Basic usage
   - Advanced features
   - Different modes/configurations
   - Edge cases or special scenarios
   - Math content (if applicable)

3. **Demo IDs**: Use descriptive kebab-case IDs (e.g., `radio-single-select`, `with-feedback`)

4. **Tags**: Add relevant tags for filtering (e.g., `basic`, `math`, `multi-select`)

5. **Update registry**: After creating demos, run:
   ```bash
   bun tools/generate-demo-metadata.mjs
   ```
   This seeds `apps/element-demo/src/lib/samples/<element>.json` from the config and adds the element to `apps/element-demo/src/lib/elements/registry.ts`. Check the new entry's `title` and `hasSession` there; regeneration keeps both. Set `hasSession: false` for an element without a learner session, which makes the e2e smoke tests skip its delivery interaction check.

## Editing Existing Demos

Edit `apps/element-demo/src/lib/samples/<element>.json`, then run `bun tools/generate-demo-metadata.mjs` to refresh the registry's `demoCount`. The generator never overwrites an existing samples file and warns when it differs from `docs/demo/config.mjs`; to regenerate the JSON from `config.mjs`, delete the JSON first.

## Examples

### Simple Element (2-3 demos)

For elements with straightforward functionality, 2-3 demos may be sufficient:

```javascript
export default {
  demos: [
    {
      id: 'basic',
      title: 'Basic Example',
      description: 'Simple demonstration of core functionality',
      tags: ['basic'],
      model: { /* ... */ },
      session: {}
    },
    {
      id: 'with-math',
      title: 'With Mathematical Content',
      description: 'Example using LaTeX math rendering',
      tags: ['math', 'latex'],
      model: { /* ... */ },
      session: {}
    }
  ]
};
```

### Complex Element (4-5+ demos)

For elements with multiple modes or features:

```javascript
export default {
  demos: [
    {
      id: 'mode-a-basic',
      title: 'Mode A - Basic',
      description: 'Basic usage in mode A',
      tags: ['mode-a', 'basic'],
      model: { /* ... */ }
    },
    {
      id: 'mode-a-advanced',
      title: 'Mode A - Advanced',
      description: 'Advanced features in mode A',
      tags: ['mode-a', 'advanced'],
      model: { /* ... */ }
    },
    {
      id: 'mode-b',
      title: 'Mode B Example',
      description: 'Demonstration of mode B',
      tags: ['mode-b'],
      model: { /* ... */ }
    },
    // ... more demos
  ]
};
```

## Adding Math Content

When adding demos with mathematical content, consider including both LaTeX and MathML examples:

### LaTeX Example
```javascript
{
  id: 'with-latex',
  title: 'With LaTeX',
  description: 'Using LaTeX math notation',
  tags: ['math', 'latex'],
  model: {
    prompt: '<p>What is $x^2 + 2x + 1$?</p>',
    // ...
  }
}
```

### MathML Example
```javascript
{
  id: 'with-mathml',
  title: 'With MathML',
  description: 'Using MathML for math rendering',
  tags: ['math', 'mathml'],
  model: {
    prompt: '<p>What is <math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mn>2</mn></mfrac></math>?</p>',
    // ...
  }
}
```

## Best Practices

1. **Descriptive titles**: Make demo titles clear and specific
2. **Useful descriptions**: Explain what makes each demo unique
3. **Appropriate tags**: Use consistent tagging across elements
4. **Realistic content**: Use authentic educational content, not "foo/bar" examples
5. **Progressive complexity**: Order demos from simple to complex
6. **Test all demos**: Verify each demo works in the demo app before committing

## Checklist for New Elements

When adding a new element to the project:

- [ ] Create `packages/elements-{react,svelte}/<element>/docs/demo/config.mjs`
- [ ] Add 3-5 demos showcasing different features
- [ ] Include math examples if the element supports math content
- [ ] Use descriptive IDs, titles, and descriptions
- [ ] Add relevant tags
- [ ] Run `bun tools/generate-demo-metadata.mjs` and check the new registry entry's `title` and `hasSession`
- [ ] Test in demo app at `http://localhost:5222/<element>/deliver`
- [ ] Verify all demos switch correctly in the dropdown
- [ ] Test evaluate mode if applicable
