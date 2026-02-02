# Multi-Demo Support Implementation Plan

## Executive Summary

This plan outlines the implementation of multiple demos per PIE element in the demo application. Each element will have several demo configurations showcasing different features, modes, and use cases (e.g., single/multi-select for multiple-choice, math rendering support, different interaction modes).

## Current State Analysis

### Demo App Architecture
- **Location**: `apps/element-demo` (SvelteKit app)
- **Routing**: File-based routing via `/{element}/{mode}` (deliver/author/print/source)
- **Configuration Source**: JSON files in `apps/element-demo/src/lib/data/sample-configs/react/`
- **Configuration Generation**: Auto-generated from `packages/elements-react/{element}/docs/demo/config.mjs`
- **State Management**: Svelte stores in `src/lib/stores/demo-state.ts`

### Current Configuration Structure
```json
{
  "models": [
    {
      "id": "1",
      "element": "multiple-choice",
      "choiceMode": "checkbox",
      // ... element-specific config
    }
  ]
}
```

**Limitation**: Only the first model (`models[0]`) is loaded and displayed.

## Proposed Solution

### 1. Enhanced Configuration Structure

#### 1.1 Demo Metadata Schema
Extend the configuration file to include demo metadata:

```typescript
// New structure for config.mjs files
export default {
  demos: [
    {
      id: "basic",
      title: "Basic Example",
      description: "A simple multiple-choice question with checkbox mode",
      tags: ["basic", "checkbox", "multi-select"],
      model: {
        id: "1",
        element: "multiple-choice",
        choiceMode: "checkbox",
        // ... config
      },
      session: {
        value: []
      }
    },
    {
      id: "radio-with-math",
      title: "Single Select with Math",
      description: "Radio button mode with LaTeX math rendering in prompts",
      tags: ["radio", "single-select", "math"],
      model: {
        id: "2",
        element: "multiple-choice",
        choiceMode: "radio",
        prompt: "Solve for $x$: $x^2 + 5x + 6 = 0$",
        // ... config
      },
      session: {
        value: []
      }
    },
    {
      id: "with-feedback",
      title: "With Rich Feedback",
      description: "Demonstrates feedback and rationale features",
      tags: ["feedback", "rationale"],
      model: {
        // ... config
      },
      session: {
        value: ["photosynthesis"] // Pre-filled answer to show feedback
      }
    }
  ]
};
```

**Benefits**:
- Self-documenting demos with titles and descriptions
- Searchable/filterable via tags
- Can include pre-filled sessions to demonstrate specific states
- Backwards compatible (can still support old `models` array format)

#### 1.2 Registry Enhancement
Update `apps/element-demo/src/lib/elements/registry.ts` to track demo count:

```typescript
export interface ElementMetadata {
  name: string;
  title: string;
  packageName: string;
  hasAuthor: boolean;
  hasPrint: boolean;
  hasConfig: boolean;
  hasSession: boolean;
  demoCount: number; // NEW: Number of demos available
}
```

### 2. Data Loading Updates

#### 2.1 Route Structure Options

**Option A: Query Parameter (Recommended)**
- Route: `/{element}/deliver?demo=radio-with-math`
- Pros: Clean URLs, preserves tab navigation, easy deep-linking
- Cons: Requires query param handling

**Option B: Nested Route**
- Route: `/{element}/demos/{demo-id}/deliver`
- Pros: RESTful, explicit demo selection
- Cons: More complex routing, breaks existing tab navigation

**Decision**: Use **Option A** with query parameters.

#### 2.2 Update `+layout.ts`
```typescript
export const load: LayoutLoad = async ({ params, url }) => {
  const elementName = params.element || 'multiple-choice';
  const demoId = url.searchParams.get('demo') || 'default';

  let demos: DemoConfig[] = [];
  let activeDemoIndex = 0;

  try {
    // Load demo configurations
    const configModule = await import(
      `$lib/data/sample-configs/react/${elementName}.json`
    );

    // Support both old and new formats
    if (configModule.default?.demos) {
      demos = configModule.default.demos;
    } else if (configModule.default?.models?.[0]) {
      // Backwards compatibility: wrap old format
      demos = [{
        id: 'default',
        title: 'Default Demo',
        description: 'Default configuration',
        tags: [],
        model: configModule.default.models[0],
        session: { value: [] }
      }];
    }

    // Find active demo by ID or use first
    activeDemoIndex = demos.findIndex(d => d.id === demoId);
    if (activeDemoIndex === -1) activeDemoIndex = 0;

  } catch (e) {
    console.error('[+layout.ts] Error loading demo configs:', e);
  }

  const activeDemo = demos[activeDemoIndex] || {};

  return {
    elementName,
    elementTitle,
    capabilities,
    demos, // All available demos
    activeDemo, // Currently selected demo
    activeDemoId: activeDemo.id,
    initialModel: activeDemo.model || {},
    initialSession: activeDemo.session || { value: [] },
    mathRenderer: cachedMathRenderer,
  };
};
```

### 3. UI Components

#### 3.1 Demo Selector Component
Create `apps/element-demo/src/lib/components/DemoSelector.svelte`:

```svelte
<script lang="ts">
import { page } from '$app/stores';
import { goto } from '$app/navigation';

interface Demo {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

let { demos, activeDemoId } = $props<{
  demos: Demo[];
  activeDemoId: string;
}>();

function selectDemo(demoId: string) {
  const url = new URL($page.url);
  url.searchParams.set('demo', demoId);
  goto(url.toString());
}
</script>

{#if demos.length > 1}
<div class="demo-selector dropdown dropdown-hover">
  <div tabindex="0" role="button" class="btn btn-sm btn-outline gap-2">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    <span>{demos.find(d => d.id === activeDemoId)?.title || 'Select Demo'}</span>
    <span class="badge badge-sm">{demos.length}</span>
  </div>

  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-80 max-h-96 overflow-y-auto">
    {#each demos as demo}
      <li>
        <button
          class="flex flex-col items-start gap-1 py-3"
          class:active={demo.id === activeDemoId}
          onclick={() => selectDemo(demo.id)}
        >
          <div class="font-semibold">{demo.title}</div>
          <div class="text-xs opacity-70">{demo.description}</div>
          {#if demo.tags.length > 0}
            <div class="flex gap-1 mt-1">
              {#each demo.tags as tag}
                <span class="badge badge-xs">{tag}</span>
              {/each}
            </div>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</div>
{/if}
```

#### 3.2 Integration into Layout
Update `apps/element-demo/src/routes/[element]/+layout.svelte`:

```svelte
<div class="navbar bg-base-100 shadow-lg">
  <div class="navbar-start">
    <!-- Existing logo/title -->
  </div>

  <div class="navbar-center">
    <!-- NEW: Demo selector in center -->
    <DemoSelector demos={data.demos} activeDemoId={data.activeDemoId} />
  </div>

  <div class="navbar-end">
    <!-- Existing theme toggle -->
  </div>
</div>
```

### 4. Sync Tooling Updates

#### 4.1 Update `sync-demo-metadata.ts`
Modify `tools/cli/src/lib/upstream/sync-demo-metadata.ts` to:
- Detect new `demos` array format
- Generate enhanced JSON with demo metadata
- Maintain backwards compatibility with `models` array
- Update registry to include `demoCount`

```typescript
// Key changes in sync-demo-metadata.ts
function processDemoConfig(config: any): ProcessedConfig {
  if (config.demos && Array.isArray(config.demos)) {
    // New format
    return {
      demos: config.demos,
      demoCount: config.demos.length
    };
  } else if (config.models && Array.isArray(config.models)) {
    // Old format - wrap for backwards compatibility
    return {
      demos: [{
        id: 'default',
        title: 'Default Demo',
        description: 'Default configuration',
        tags: [],
        model: config.models[0],
        session: { value: [] }
      }],
      demoCount: 1
    };
  }
  return { demos: [], demoCount: 0 };
}
```

### 5. Demo Scenarios by Element Type

Each element should have demos covering:

#### 5.1 Common Scenarios (All Elements)
1. **Basic/Default** - Simple, working example
2. **With Math** - LaTeX rendering in prompts/choices (if applicable)
3. **Rich Media** - Images, custom CSS, complex HTML
4. **Edge Cases** - Empty states, maximum choices, long text
5. **Pre-filled** - Demonstrates feedback/evaluation states

#### 5.2 Element-Specific Demos

**Multiple Choice**:
- Single select (radio)
- Multi-select (checkbox)
- With feedback and rationale
- With scoring/rubric
- Different choice prefixes (letters, numbers, none)
- Partial scoring enabled

**EBSR (Evidence-Based Selected Response)**:
- Part A single select, Part B multi-select
- Part A multi-select, Part B conditional on A
- Both parts with math
- With feedback per part

**Math Inline**:
- Simple numeric response
- Expression with multiple responses
- Advanced multi-response mode
- Different equation editor versions (1, 2, 3)

**Categorize**:
- Few categories, many choices
- Many categories, few choices
- With images in choices
- Vertical vs horizontal layout

**Graphing**:
- Linear functions
- Quadratic functions
- Multiple tools (point, line, parabola)
- Grid variations

**Extended Text Entry**:
- Plain text mode
- Rich text with toolbar
- Math input enabled
- Character/word limits

**Match**:
- Few matches
- Many matches
- With shuffling
- With images

**Hotspot**:
- Single hotspot
- Multiple hotspots
- Different image sizes
- Irregular shapes

### 6. Implementation Phases

#### Phase 1: Infrastructure (Week 1)
- [ ] Update demo configuration schema
- [ ] Modify `+layout.ts` to support multiple demos
- [ ] Create `DemoSelector` component
- [ ] Update demo stores to handle demo switching
- [ ] Test with multiple-choice element

#### Phase 2: Tooling (Week 1-2)
- [ ] Update `sync-demo-metadata.ts` for new format
- [ ] Add backwards compatibility handling
- [ ] Update registry generation
- [ ] Test sync process

#### Phase 3: Demo Content - Priority Elements (Week 2-3)
Create comprehensive demos for most-used elements:
- [ ] multiple-choice (6+ demos)
- [ ] ebsr (4+ demos)
- [ ] extended-text-entry (4+ demos)
- [ ] math-inline (4+ demos)
- [ ] select-text (3+ demos)
- [ ] inline-dropdown (3+ demos)

#### Phase 4: Demo Content - Interactive Elements (Week 3-4)
- [ ] categorize (4+ demos)
- [ ] drag-in-the-blank (4+ demos)
- [ ] match / match-list (4+ demos)
- [ ] placement-ordering (3+ demos)
- [ ] hotspot (4+ demos)

#### Phase 5: Demo Content - Graphing & Visual (Week 4-5)
- [ ] graphing (5+ demos)
- [ ] graphing-solution-set (4+ demos)
- [ ] number-line (4+ demos)
- [ ] fraction-model (3+ demos)
- [ ] drawing-response (3+ demos)
- [ ] charting (4+ demos)

#### Phase 6: Demo Content - Specialized Elements (Week 5-6)
- [ ] complex-rubric (3+ demos)
- [ ] multi-trait-rubric (3+ demos)
- [ ] rubric (3+ demos)
- [ ] likert (3+ demos)
- [ ] math-templated (4+ demos)
- [ ] matrix (3+ demos)
- [ ] explicit-constructed-response (3+ demos)
- [ ] image-cloze-association (3+ demos)
- [ ] passage (2+ demos)

#### Phase 7: Polish & Documentation (Week 6)
- [ ] Add demo search/filter by tags
- [ ] Create demo authoring guidelines
- [ ] Add tooltips and help text
- [ ] Update CLI documentation
- [ ] Create demo contribution guide

### 7. Technical Considerations

#### 7.1 Performance
- Lazy load demo configurations (already done via dynamic imports)
- Cache math renderer (already implemented)
- Consider virtual scrolling for demo selector if >20 demos

#### 7.2 Deep Linking
- URLs should be shareable with specific demo selected
- Example: `/multiple-choice/deliver?demo=radio-with-math`
- Preserve demo selection across tab navigation

#### 7.3 Backwards Compatibility
- Must support existing `models` array format
- Sync tool should handle both formats gracefully
- Gradual migration element-by-element

#### 7.4 State Management
- Demo switching should reset session by default
- Option to preserve session when switching (advanced feature)
- Clear visual feedback when demo changes

### 8. Testing Strategy

#### 8.1 Unit Tests
- Demo config loading logic
- Backwards compatibility handling
- Demo selector component interactions

#### 8.2 Integration Tests
- Navigation between demos
- State preservation across tab switches
- Deep linking with query parameters

#### 8.3 Manual Testing Checklist
- [ ] Demo selector appears when multiple demos exist
- [ ] Switching demos updates model and session
- [ ] Query parameters update correctly
- [ ] Deep links work correctly
- [ ] Tabs preserve demo selection
- [ ] Old format elements still work
- [ ] Registry shows correct demo count

### 9. Success Criteria

1. **Functionality**
   - ✅ Support 3+ demos per element
   - ✅ Smooth switching without page reload
   - ✅ Deep linking works
   - ✅ Backwards compatible

2. **Content**
   - ✅ Every element has 3+ meaningful demos
   - ✅ Math rendering showcased where applicable
   - ✅ Edge cases demonstrated
   - ✅ Pre-filled sessions for feedback/scoring demos

3. **UX**
   - ✅ Demo selector is intuitive
   - ✅ Demo descriptions are helpful
   - ✅ Tags enable quick filtering
   - ✅ Visual feedback on selection

4. **Developer Experience**
   - ✅ Easy to add new demos to config.mjs
   - ✅ Sync process works reliably
   - ✅ Documentation is clear

## Example: Multiple Choice Demos

### Demo 1: Basic Multi-Select
```javascript
{
  id: "basic-checkbox",
  title: "Basic Multi-Select",
  description: "Standard checkbox mode with multiple correct answers",
  tags: ["checkbox", "multi-select", "basic"],
  model: {
    element: "multiple-choice",
    choiceMode: "checkbox",
    choicePrefix: "letters",
    prompt: "Select all true statements about photosynthesis:",
    choices: [
      { value: "1", label: "Converts light energy to chemical energy", correct: true },
      { value: "2", label: "Occurs only at night", correct: false },
      { value: "3", label: "Produces oxygen as a byproduct", correct: true },
      { value: "4", label: "Requires chlorophyll", correct: true }
    ]
  }
}
```

### Demo 2: Single Select with Math
```javascript
{
  id: "radio-math",
  title: "Single Select with Math",
  description: "Radio mode with LaTeX math in prompt and choices",
  tags: ["radio", "single-select", "math"],
  model: {
    element: "multiple-choice",
    choiceMode: "radio",
    choicePrefix: "letters",
    prompt: "Solve for $x$: $x^2 - 5x + 6 = 0$",
    choices: [
      { value: "1", label: "$x = 1$ or $x = 6$", correct: false },
      { value: "2", label: "$x = 2$ or $x = 3$", correct: true },
      { value: "3", label: "$x = -2$ or $x = -3$", correct: false },
      { value: "4", label: "No real solutions", correct: false }
    ]
  }
}
```

### Demo 3: With Feedback and Rationale
```javascript
{
  id: "feedback-rationale",
  title: "Rich Feedback Example",
  description: "Demonstrates feedback and rationale features with pre-filled answer",
  tags: ["feedback", "rationale", "evaluated"],
  model: {
    element: "multiple-choice",
    choiceMode: "checkbox",
    choices: [
      {
        value: "1",
        label: "Mitochondria produce ATP",
        correct: true,
        feedback: { type: "default", value: "Correct! Mitochondria are the powerhouse of the cell." },
        rationale: "ATP is produced through cellular respiration in the mitochondria."
      },
      // ... more choices
    ]
  },
  session: {
    value: ["1", "2"] // Pre-filled to show feedback
  }
}
```

### Demo 4: Image Choices
```javascript
{
  id: "image-choices",
  title: "Image-Based Choices",
  description: "Choices with images instead of text",
  tags: ["images", "visual"],
  model: {
    element: "multiple-choice",
    choiceMode: "radio",
    prompt: "Which animal is a mammal?",
    choices: [
      { value: "1", label: "<img src='fish.jpg' alt='Fish'/>", correct: false },
      { value: "2", label: "<img src='dolphin.jpg' alt='Dolphin'/>", correct: true },
      { value: "3", label: "<img src='shark.jpg' alt='Shark'/>", correct: false }
    ]
  }
}
```

### Demo 5: Partial Scoring
```javascript
{
  id: "partial-scoring",
  title: "Partial Credit Enabled",
  description: "Multi-select with partial scoring for partially correct answers",
  tags: ["checkbox", "partial-scoring", "advanced"],
  model: {
    element: "multiple-choice",
    choiceMode: "checkbox",
    partialScoring: true,
    prompt: "Select all prime numbers:",
    choices: [
      { value: "1", label: "2", correct: true },
      { value: "2", label: "4", correct: false },
      { value: "3", label: "7", correct: true },
      { value: "4", label: "9", correct: false },
      { value: "5", label: "11", correct: true }
    ]
  }
}
```

### Demo 6: No Prefix
```javascript
{
  id: "no-prefix",
  title: "No Choice Prefix",
  description: "Choices without letter/number prefixes",
  tags: ["checkbox", "no-prefix"],
  model: {
    element: "multiple-choice",
    choiceMode: "checkbox",
    choicePrefix: "none",
    prompt: "Select all fruits:",
    choices: [
      { value: "1", label: "Apple", correct: true },
      { value: "2", label: "Carrot", correct: false },
      { value: "3", label: "Banana", correct: true },
      { value: "4", label: "Broccoli", correct: false }
    ]
  }
}
```

## Appendix A: File Structure

```
apps/element-demo/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── DemoSelector.svelte          # NEW
│   │   ├── data/sample-configs/react/
│   │   │   ├── multiple-choice.json         # UPDATED: demos array
│   │   │   ├── ebsr.json                    # UPDATED: demos array
│   │   │   └── ...                          # UPDATED: all elements
│   │   ├── stores/
│   │   │   └── demo-state.ts                # UPDATED: demo switching
│   │   └── elements/
│   │       └── registry.ts                  # UPDATED: demoCount field
│   └── routes/
│       └── [element]/
│           ├── +layout.ts                   # UPDATED: multi-demo support
│           └── +layout.svelte               # UPDATED: DemoSelector integration
│
packages/elements-react/
└── */docs/demo/config.mjs                   # UPDATED: demos format

tools/cli/src/lib/upstream/
└── sync-demo-metadata.ts                    # UPDATED: handle new format
```

## Appendix B: Migration Guide

### For Element Maintainers

**Old Format** (`config.mjs`):
```javascript
export default {
  models: [{ id: "1", element: "my-element", /* config */ }]
};
```

**New Format** (`config.mjs`):
```javascript
export default {
  demos: [
    {
      id: "basic",
      title: "Basic Example",
      description: "A simple demonstration",
      tags: ["basic"],
      model: { id: "1", element: "my-element", /* config */ },
      session: { value: [] }
    },
    {
      id: "with-math",
      title: "With Math Rendering",
      description: "Shows LaTeX math support",
      tags: ["math", "advanced"],
      model: { /* config with math */ },
      session: { value: [] }
    }
  ]
};
```

**Migration Steps**:
1. Wrap existing model in `demos` array
2. Add `id`, `title`, `description`, `tags`
3. Create 2-5 additional demos showcasing different features
4. Run `pie sync-demo-metadata` to regenerate JSON
5. Test in demo app

---

**End of Implementation Plan**
