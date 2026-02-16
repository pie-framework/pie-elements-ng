# Demo Configuration Guide

## Overview

All PIE element demos are maintained locally in this project and are **not synced from upstream**. Each element should have a `docs/demo/config.mjs` file with multiple demo scenarios that showcase different features and use cases.

## Demo Config Structure

Each demo config exports a `demos` array with multiple demo objects:

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

When adding a new element or updating an existing one, create a demo config with 3-5 demos:

1. **Location**: `packages/elements-react/<element-name>/docs/demo/config.mjs`

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

## Upstream Sync Behavior

The `upstream:update` command does **NOT** sync demo configs from upstream:

- ✅ Syncs controller code
- ✅ Syncs React components  
- ✅ Syncs package.json dependencies
- ❌ **Skips** `docs/demo/config.mjs` (maintained locally)

This allows us to create rich, multi-demo configurations without being overwritten by upstream's single-demo configs.

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

- [ ] Create `packages/elements-react/<element>/docs/demo/config.mjs`
- [ ] Add 3-5 demos showcasing different features
- [ ] Include math examples if the element supports math content
- [ ] Use descriptive IDs, titles, and descriptions
- [ ] Add relevant tags
- [ ] Run `bun tools/generate-demo-metadata.mjs`
- [ ] Test in demo app at `http://localhost:5222/<element>/deliver`
- [ ] Verify all demos switch correctly in the dropdown
- [ ] Test evaluate mode if applicable
