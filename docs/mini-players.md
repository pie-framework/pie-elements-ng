# Mini Players - Implementation Guide

## Overview

Mini players are compact preview components designed for displaying PIE elements in list views, search results, and item browsers. They provide a space-efficient way to show element content with correctness indicators without full interaction capabilities.

**Status:** Optional - Nice-to-have for authoring and admin tools

## Reference Implementation

**Existing implementation:** `/Users/eelco.hillenius/dev/prj/kds/pie-api-aws/containers/pieoneer/src/lib/pie-mini-players/`

This implementation already exists in Svelte 5 with 25+ element types and can be ported to pie-elements-ng.

## Architecture

### Not a Mode - Separate Components

**Important:** Mini players are **NOT a mode** in the `PieEnvironment`. They are **separate components** from the main player components.

```
Main component:     packages/{element}/src/delivery/{Element}.svelte
Mini player:        packages/{element}/src/mini/{Element}MiniPlayer.svelte
```

### Design Principles

1. **Pure Presentation** - No state management, always render full content
2. **Stateless** - Container manages expand/collapse, not the mini player
3. **Compact Display** - Aggressive space optimization for list views
4. **Correctness Indicators** - Show ✓/✗ for correct/incorrect answers
5. **Consistent Interface** - All use same `MiniPlayerProps` interface
6. **Fallback Support** - Generic mini player for unsupported types

## Directory Structure

```text
packages/
  lib-ui/
    src/mini/
      MiniPlayerBase.svelte          # Base component for shared logic
      ChoiceList.svelte              # Reusable choice display
      CorrectnessIndicator.svelte    # ✓/✗ indicators
      types.ts                       # Shared TypeScript interfaces
      registry.ts                    # Component resolution registry
      utils/
        math-content.ts              # Math rendering utilities
        html-utils.ts                # HTML processing
      FallbackMiniPlayer.svelte      # Default for unsupported types

  {element}/
    src/mini/
      {Element}MiniPlayer.svelte     # Element-specific mini player
      {Element}MiniPlayer.test.ts    # Component tests
```

## Implementation Pattern

### 1. Shared Types

```typescript
// packages/lib-ui/src/mini/types.ts

export interface MiniPlayerProps {
  item?: ItemEntity;        // Full item data including model
  passage?: PassageEntity;  // Optional passage reference
}

export interface ItemEntity {
  id: string;
  type: string;             // Element type (e.g., 'multiple-choice')
  models: {
    [key: string]: unknown; // Element model data
  };
  // ... other fields
}

export interface PassageEntity {
  id: string;
  title?: string;
  content: string;
  // ... other fields
}
```

### 2. Registry Pattern

```typescript
// packages/lib-ui/src/mini/registry.ts

import type { Component } from 'svelte';
import type { MiniPlayerProps } from './types';
import FallbackMiniPlayer from './FallbackMiniPlayer.svelte';

const registry = new Map<string, Component<MiniPlayerProps>>();

export function registerMiniPlayer(
  type: string,
  component: Component<MiniPlayerProps>
): void {
  registry.set(type, component);
}

export function getMiniPlayer(type: string): Component<MiniPlayerProps> {
  return registry.get(type) ?? FallbackMiniPlayer;
}

// Auto-register mini players
import MultipleChoiceMiniPlayer from '@pie-elements-ng/multiple-choice/mini';
registerMiniPlayer('multiple-choice', MultipleChoiceMiniPlayer);

// ... register other element types
```

### 3. Base Component

```svelte
<!-- packages/lib-ui/src/mini/MiniPlayerBase.svelte -->
<script lang="ts">
  import type { MiniPlayerProps } from './types';
  import { extractPrompt, processHtml } from './utils/html-utils';

  let { item, passage } = $props<MiniPlayerProps>();

  // Extract first model from item
  const firstModel = $derived(
    item ? Object.values(item.models)[0] : null
  );

  // Extract prompt
  const prompt = $derived(
    firstModel ? extractPrompt(firstModel) : ''
  );
</script>

<div class="mini-player-base">
  {#if prompt}
    <div class="prompt prose prose-sm">
      {@html processHtml(prompt)}
    </div>
  {/if}

  <slot {firstModel} />
</div>

<style>
  .mini-player-base {
    font-size: 0.875rem;
    line-height: 1.5;
  }

  /* Force inline display for compact layout */
  .mini-player-base :global(p),
  .mini-player-base :global(div),
  .mini-player-base :global(span) {
    display: inline !important;
  }

  /* Hide line breaks */
  .mini-player-base :global(br) {
    display: none !important;
  }

  /* Images remain inline-block */
  .mini-player-base :global(img) {
    display: inline-block !important;
    max-height: 2em;
    vertical-align: middle;
  }
</style>
```

### 4. Correctness Indicator

```svelte
<!-- packages/lib-ui/src/mini/CorrectnessIndicator.svelte -->
<script lang="ts">
  let { correct } = $props<{ correct: boolean }>();
</script>

<span class="indicator" class:correct class:incorrect={!correct}>
  {correct ? '✓' : '✗'}
</span>

<style>
  .indicator {
    font-weight: bold;
    margin-right: 0.25em;
  }

  .correct {
    color: var(--color-success, #22c55e);
  }

  .incorrect {
    color: var(--color-error, #ef4444);
  }
</style>
```

### 5. Element-Specific Mini Player

```svelte
<!-- packages/multiple-choice/src/mini/MultipleChoiceMiniPlayer.svelte -->
<script lang="ts">
  import type { MiniPlayerProps } from '@pie-elements-ng/lib-ui/mini';
  import MiniPlayerBase from '@pie-elements-ng/lib-ui/mini/MiniPlayerBase.svelte';
  import CorrectnessIndicator from '@pie-elements-ng/lib-ui/mini/CorrectnessIndicator.svelte';

  let { item, passage } = $props<MiniPlayerProps>();
</script>

<MiniPlayerBase {item} {passage} let:firstModel>
  {#if firstModel?.choices}
    <div class="choices">
      {#each firstModel.choices as choice}
        <span class="choice">
          <CorrectnessIndicator correct={choice.correct} />
          {@html choice.label}
        </span>
      {/each}
    </div>
  {/if}
</MiniPlayerBase>

<style>
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .choice {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    background: var(--color-base-200);
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
</style>
```

## Math Rendering

### Math Content Utilities

```typescript
// packages/lib-ui/src/mini/utils/math-content.ts

import katex from 'katex';

/**
 * Render LaTeX math expressions in HTML content
 */
export function renderMathContent(html: string): string {
  // Inline math: \(...\)
  html = html.replace(/\\\((.*?)\\\)/g, (_, latex) => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false
      });
    } catch {
      return `\\(${latex}\\)`;
    }
  });

  // Block math: \[...\]
  html = html.replace(/\\\[(.*?)\\\]/g, (_, latex) => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true
      });
    } catch {
      return `\\[${latex}\\]`;
    }
  });

  return html;
}

/**
 * Check if content contains math
 */
export function hasMathContent(html: string): boolean {
  return /\\\(|\\\[|<math/.test(html);
}
```

## Container/List Component

Mini players are used in list containers:

```svelte
<!-- apps/example/src/routes/item-browser/+page.svelte -->
<script lang="ts">
  import { getMiniPlayer } from '@pie-elements-ng/lib-ui/mini';
  import type { ItemEntity } from '@pie-elements-ng/lib-ui/mini';

  let items = $state<ItemEntity[]>([]);
  let expandedItems = $state(new Set<string>());

  function toggleExpand(itemId: string) {
    if (expandedItems.has(itemId)) {
      expandedItems.delete(itemId);
    } else {
      expandedItems.add(itemId);
    }
    expandedItems = new Set(expandedItems); // Trigger reactivity
  }
</script>

<div class="item-list">
  {#each items as item}
    {@const MiniPlayer = getMiniPlayer(item.type)}
    {@const isExpanded = expandedItems.has(item.id)}

    <div class="item-card">
      <button
        class="expand-button"
        onclick={() => toggleExpand(item.id)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? '−' : '+'}
      </button>

      <div class="item-content" class:expanded={isExpanded}>
        <MiniPlayer {item} />
      </div>
    </div>
  {/each}
</div>

<style>
  .item-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-card {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border: 1px solid var(--color-base-300);
    border-radius: 0.5rem;
    background: var(--color-base-100);
  }

  .expand-button {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--color-base-300);
    border-radius: 0.25rem;
    background: var(--color-base-200);
    cursor: pointer;
    font-weight: bold;
  }

  .item-content {
    flex: 1;
    max-height: 3rem;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .item-content.expanded {
    max-height: none;
  }
</style>
```

## Use Cases

### 1. Item Library Browser

Display searchable list of assessment items with compact previews:

```svelte
<ItemBrowser
  items={searchResults}
  onSelect={(item) => openItemEditor(item)}
/>
```

### 2. Search Results

Show mini players in search results for quick identification:

```svelte
<SearchResults
  query={searchQuery}
  renderItem={(item) => <MiniPlayer {item} />}
/>
```

### 3. Quick Answer Key

Display answer keys in compact format:

```svelte
<AnswerKey items={assessmentItems} />
```

### 4. Batch Operations

Preview items during batch edit/delete operations:

```svelte
<BatchEditor
  selectedItems={selected}
  action="delete"
/>
```

## Testing

### Component Tests

```typescript
// packages/multiple-choice/src/mini/MultipleChoiceMiniPlayer.test.ts

import { render } from '@testing-library/svelte';
import MultipleChoiceMiniPlayer from './MultipleChoiceMiniPlayer.svelte';

describe('MultipleChoiceMiniPlayer', () => {
  it('renders prompt', () => {
    const item = {
      id: '1',
      type: 'multiple-choice',
      models: {
        'mc-1': {
          prompt: 'What is 2 + 2?',
          choices: []
        }
      }
    };

    const { getByText } = render(MultipleChoiceMiniPlayer, { item });

    expect(getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('renders choices with correctness indicators', () => {
    const item = {
      id: '1',
      type: 'multiple-choice',
      models: {
        'mc-1': {
          choices: [
            { label: 'Four', correct: true },
            { label: 'Five', correct: false }
          ]
        }
      }
    };

    const { container } = render(MultipleChoiceMiniPlayer, { item });

    const indicators = container.querySelectorAll('.indicator');
    expect(indicators).toHaveLength(2);
    expect(indicators[0]).toHaveTextContent('✓');
    expect(indicators[1]).toHaveTextContent('✗');
  });

  it('handles missing data gracefully', () => {
    const item = {
      id: '1',
      type: 'multiple-choice',
      models: {}
    };

    const { container } = render(MultipleChoiceMiniPlayer, { item });

    expect(container).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
// apps/example/tests/e2e/item-browser.spec.ts

import { test, expect } from '@playwright/test';

test('displays mini players in item list', async ({ page }) => {
  await page.goto('/item-browser');

  // Should render mini players
  const miniPlayers = page.locator('.mini-player-base');
  await expect(miniPlayers).toHaveCount(10);

  // Should show prompts
  await expect(miniPlayers.first().locator('.prompt')).toBeVisible();

  // Should show correctness indicators
  await expect(page.locator('.indicator')).toHaveCount(40); // 4 choices × 10 items
});

test('expands item on click', async ({ page }) => {
  await page.goto('/item-browser');

  const firstItem = page.locator('.item-card').first();
  const expandButton = firstItem.locator('.expand-button');

  // Initially collapsed
  await expect(firstItem.locator('.item-content')).toHaveCSS(
    'max-height',
    '48px'
  );

  // Click to expand
  await expandButton.click();

  // Now expanded
  await expect(firstItem.locator('.item-content')).toHaveCSS(
    'max-height',
    'none'
  );
});
```

## Migration from pieoneer

The pieoneer project already has 25+ mini players implemented. To migrate:

1. **Copy shared infrastructure:**
   ```bash
   cp -r pieoneer/src/lib/pie-mini-players/* packages/lib-ui/src/mini/
   ```

2. **Update imports** to use pie-elements-ng packages

3. **Port element-specific mini players** to their respective packages

4. **Update registry** to use new package structure

5. **Test** each mini player with new architecture

## Implementation Checklist

Per element:

- [ ] Create `src/mini/` directory
- [ ] Implement `{Element}MiniPlayer.svelte`
- [ ] Register in lib-ui mini player registry
- [ ] Add component tests
- [ ] Update element README
- [ ] Add to demo page (optional)

Shared infrastructure (one-time):

- [ ] Port MiniPlayerBase to lib-ui
- [ ] Port shared components (ChoiceList, CorrectnessIndicator)
- [ ] Port math rendering utilities
- [ ] Implement registry pattern
- [ ] Create FallbackMiniPlayer
- [ ] Write E2E tests for item browser
- [ ] Document usage in lib-ui README

## Effort Estimate

**Per element: 1-2 days**

**Breakdown:**
- Component implementation: 0.5-1 day
- Testing: 0.5 day
- Documentation: 0.25 day

**Shared infrastructure (one-time): 3-5 days**

**Total for 10 elements: 2-4 weeks**

## Priority

**Medium** - Optional, nice-to-have for authoring/admin tools

Mini players provide significant UX value for:
- Item browsing and selection
- Search functionality
- Answer key generation
- Batch operations

However, they're not critical for core assessment delivery functionality.

## References

- **Existing implementation:** `/Users/eelco.hillenius/dev/prj/kds/pie-api-aws/containers/pieoneer/src/lib/pie-mini-players/`
- **25+ element types** already implemented in Svelte 5
- **Proven architecture** ready to port

---

**Document Version:** 1.0
**Last Updated:** 2025-01-02
**Status:** Implementation Guide
