# Print Mode Support Plan

## Status: Planning Phase
**Last Updated:** 2026-01-27
**Priority:** Medium-High (Optional but recommended for feature parity)

---

## Overview

Print mode enables static rendering of assessment items for:
- Paper-based testing
- Teacher answer keys
- Assessment documentation
- PDF exports
- Print-to-paper workflows

This document outlines the plan to integrate print mode support into the pie-elements-ng ESM-based system.

---

## Current State Analysis

### Upstream Implementation (pie-elements)

**Architecture:**
- Print mode exists as **separate Web Components** (not integrated as a mode)
- Located in `node_modules/@pie-element/{element}/lib/print.js`
- Each element has a dedicated print component (e.g., `MultipleChoicePrint`, `RubricPrint`)

**Sync Status:**
- ✅ Print files synced into repo at `packages/elements-react/{element}/src/print.ts`
- ✅ All synced on 2026-01-27 from commit `01ad25f016750085a0de7a9354ad5ba8f958bd62`
- ✅ Marked as auto-generated with sync metadata
- ❌ **NOT currently integrated** into ESM demo system
- ❌ **NOT exposed** as web components or registered

**Elements with Print Support:**
1. `multiple-choice` - Full implementation with choice handling
2. `rubric` - Instructor-only (returns empty for students)
3. `extended-text-entry` - With textarea dimensions
4. `math-inline` - With math rendering
5. `math-templated` - Mathematical expressions
6. `complex-rubric` - Rubric scoring
7. `explicit-constructed-response` - Response handling
8. `passage` - Reading passages
9. `select-text` - Text selection elements
10. `ebsr` - Evidence-Based Selected Response

---

## How Print Mode Works

### Mode Comparison

| Mode | Purpose | Interaction | Show Answers | Use Case |
|------|---------|-------------|--------------|----------|
| **gather** | Student answering | Fully interactive | No | Initial response collection |
| **view** | Review answers | View-only, no scoring | Student's answers | Review without grading |
| **evaluate** | Scoring mode | View-only + feedback | Yes, with explanations | Teacher scoring & feedback |
| **print** | Static rendering | Non-interactive | Depends on role | Paper tests, PDFs, answer keys |

### Print Mode Characteristics

**Role-Based Rendering:**
- **Student Role**: Shows questions only (blank assessment for paper testing)
- **Instructor Role**: Shows questions + correct answers + rationales (answer key)

**Transformations Applied:**
```typescript
const preparePrintModel = (model, role) => {
  const instr = role === 'instructor';

  return {
    ...model,
    // Visibility controls
    prompt: model.promptEnabled !== false ? model.prompt : undefined,
    teacherInstructions: instr && model.teacherInstructionsEnabled !== false
      ? model.teacherInstructions : undefined,

    // Answer visibility
    alwaysShowCorrect: instr,
    showTeacherInstructions: instr,
    rationale: instr && model.rationaleEnabled !== false ? model.rationale : undefined,

    // Interaction disabling
    disabled: true,
    animationsDisabled: true,
    lockChoiceOrder: true,  // Prevents randomization
    mode: instr ? 'evaluate' : model.mode,

    // Feedback removal
    feedback: undefined,
  };
};
```

**Key Differences from Other Modes:**
1. **All interactions disabled**: No checkboxes, inputs, or animations
2. **Choice order locked**: Prevents randomization for consistency
3. **No feedback/scoring**: Pure display mode
4. **Role determines visibility**: Student sees blank, instructor sees answers

---

## Architecture Decisions

### Decision 1: Integration Approach

**Option A: Separate Print Components** (matches upstream)
- Register separate components: `multiple-choice-print`, `rubric-print`, etc.
- Simpler to sync from upstream
- Cleaner separation of concerns
- **Pros:**
  - Matches upstream architecture
  - Easier to maintain sync
  - No changes to existing components
- **Cons:**
  - More components to manage
  - Demo UI more complex (switch element vs switch mode)

**Option B: Integrated Print Mode** (unified component)
- Add print as a fourth mode alongside gather/view/evaluate
- Single component handles all modes
- Better UX in demos (switch mode instead of loading different element)
- **Pros:**
  - Better demo UX (single component)
  - Unified mode selector
  - Cleaner API
- **Cons:**
  - Diverges from upstream pattern
  - Requires component modifications
  - More complex state management

**RECOMMENDATION: Option A (Separate Components)**
- Maintains upstream compatibility
- Easier to sync and update
- Print is fundamentally different (static vs interactive)

### Decision 2: Type System Changes

**Required Changes:**
```typescript
// packages/shared/types/src/types.ts

// Current:
export interface PieEnvironment {
  mode: 'gather' | 'view' | 'evaluate';
  role: 'student' | 'instructor';
}

// Proposed:
export interface PieEnvironment {
  mode: 'gather' | 'view' | 'evaluate' | 'print';
  role: 'student' | 'instructor';
}

// New interface for print-specific options:
export interface PrintOptions {
  role: 'student' | 'instructor';
  showAnswers?: boolean;  // Override for instructor role
  lockChoiceOrder?: boolean;  // Default true
}
```

**Impact:**
- All controllers need to handle `mode === 'print'`
- Element player needs print mode selector
- Demo pages need print preview functionality

---

## Implementation Plan

### Phase 1: Foundation (Type System & Infrastructure)

**Duration:** 2-3 days

**Tasks:**
1. Update type definitions to include print mode
   - File: `packages/shared/types/src/types.ts`
   - Add `'print'` to `PieEnvironment.mode` union
   - Add `PrintOptions` interface

2. Update element player to support print components
   - File: `packages/shared/element-player/src/PieElementPlayer.svelte`
   - Add logic to load print components when in print mode
   - Add print mode selector UI (optional for demos)

3. Create print mode utilities
   - File: `packages/shared/print-utils/src/prepare-print-model.ts` (new)
   - Shared `preparePrintModel()` function
   - Common print transformations

**Acceptance Criteria:**
- Types compile without errors
- Element player can load print components
- Shared utilities available for use

### Phase 2: Per-Element Implementation

**Duration per element:** 3-5 days
**Total for 10 elements:** 30-50 days

**Per-Element Tasks:**

1. **Register Print Component**
   - File: `packages/elements-react/{element}/src/print.ts` (already synced)
   - Create web component wrapper
   - Register custom element: `{element}-print`

2. **Controller Integration**
   - File: `packages/elements-react/{element}/src/controller/index.ts`
   - Add `preparePrintModel()` function
   - Integrate print mode detection
   - Handle role-based transformations

3. **Component Updates**
   - File: `packages/elements-react/{element}/src/index.tsx`
   - Add print-specific rendering paths (if integrated approach)
   - Handle disabled state correctly
   - Remove animations in print mode

4. **Styling**
   - Add CSS for print mode
   - Implement `@media print` rules
   - Style for both student and instructor views

5. **Demo Integration**
   - Update demo pages to support print preview
   - Add print mode selector
   - Add "Print to PDF" functionality

6. **Testing**
   - Unit tests for `preparePrintModel()`
   - E2E tests for student/instructor print views
   - Browser print dialog verification
   - PDF export validation

**Element-Specific Notes:**

**multiple-choice:**
- Most complex implementation
- Handle choice ordering (locked in print)
- Show/hide rationales based on role
- Example transformations:
  ```typescript
  model.keyMode = role === 'instructor';
  model.choices = model.choices.map(choice => ({
    ...choice,
    rationale: role === 'instructor' ? choice.rationale : undefined
  }));
  ```

**rubric:**
- Instructor-only element
- Return empty object for students
- Full rubric display for instructors

**extended-text-entry:**
- Set default dimensions for print
- Show student response area (blank for students)

**math elements (math-inline, math-templated):**
- Set `printMode: true` flag
- Ensure MathJax/LaTeX renders correctly for print

### Phase 3: Demo System Integration

**Duration:** 3-4 days

**Tasks:**

1. **Add Print Mode to Element Player UI**
   ```svelte
   <!-- packages/shared/element-player/src/PieElementPlayer.svelte -->

   <div class="mode-selector">
     <label>
       <input type="radio" bind:group={mode} value="gather" />
       Gather
     </label>
     <label>
       <input type="radio" bind:group={mode} value="view" />
       View
     </label>
     <label>
       <input type="radio" bind:group={mode} value="evaluate" />
       Evaluate
     </label>
     <label>
       <input type="radio" bind:group={mode} value="print" />
       Print Preview
     </label>
   </div>

   {#if mode === 'print'}
     <div class="print-controls">
       <label>
         <input type="radio" bind:group={role} value="student" />
         Student (Blank)
       </label>
       <label>
         <input type="radio" bind:group={role} value="instructor" />
         Instructor (Answer Key)
       </label>

       <button onclick={handlePrint}>🖨️ Print</button>
       <button onclick={handlePrintToPDF}>📄 Save as PDF</button>
     </div>
   {/if}
   ```

2. **Create Print Preview Page**
   - New route: `/print-preview`
   - Clean layout optimized for printing
   - Browser print dialog integration
   - PDF export functionality

3. **Add Print Styling**
   ```css
   /* packages/shared/element-player/src/styles/print.css */

   @media print {
     /* Hide UI controls */
     .mode-selector,
     .print-controls,
     .sidebar {
       display: none !important;
     }

     /* Optimize for print */
     .element-container {
       max-width: 100%;
       padding: 0;
       margin: 0;
     }

     /* Prevent page breaks in questions */
     .question-container {
       page-break-inside: avoid;
     }

     /* Student view: clean blanks */
     .print-mode.role-student input[type="checkbox"],
     .print-mode.role-student input[type="radio"] {
       border: 1px solid #000;
       background: white;
     }

     /* Instructor view: show answers */
     .print-mode.role-instructor .correct-answer {
       font-weight: bold;
       text-decoration: underline;
     }

     .print-mode.role-instructor .rationale {
       margin-top: 1em;
       padding: 0.5em;
       background: #f0f0f0;
       border-left: 3px solid #333;
     }
   }
   ```

4. **Browser Print Integration**
   ```typescript
   const handlePrint = () => {
     // Trigger browser print dialog
     window.print();
   };

   const handlePrintToPDF = async () => {
     // Use browser's save-as-PDF functionality
     const printCSS = '@page { margin: 0.5in; }';
     const style = document.createElement('style');
     style.textContent = printCSS;
     document.head.appendChild(style);

     window.print();

     document.head.removeChild(style);
   };
   ```

### Phase 4: Documentation & Testing

**Duration:** 2-3 days

**Tasks:**

1. **Documentation**
   - Update `docs/DEMO_SYSTEM.md` with print mode section
   - Add print mode examples to element READMEs
   - Create print mode usage guide
   - Document styling guidelines for print

2. **Testing Strategy**
   - Unit tests for `preparePrintModel()` per element
   - E2E tests for print preview functionality
   - Visual regression tests for print layouts
   - Browser compatibility testing (Chrome, Firefox, Safari)
   - PDF export validation

3. **Example Implementations**
   - Create example print templates
   - Provide student assessment template
   - Provide instructor answer key template

---

## Technical Implementation Details

### Controller Pattern

Every element controller should follow this pattern:

```typescript
// packages/elements-react/{element}/src/controller/index.ts

import { preparePrintModel } from '@pie-element/shared-print-utils';

export function model(
  question: ComponentModel,
  session: SessionData | null,
  env: PieEnvironment
): ViewModel {
  // Apply print transformations if in print mode
  if (env.mode === 'print') {
    return preparePrintModel(question, env.role);
  }

  // Continue with normal model transformation
  return {
    ...question,
    disabled: env.mode === 'view' || env.mode === 'evaluate',
    // ... other transformations
  };
}

export function outcome(
  question: ComponentModel,
  session: SessionData,
  env: PieEnvironment
) {
  // Skip scoring in print mode
  if (env.mode === 'print') {
    return { score: 0, empty: true };
  }

  // ... normal scoring logic
}
```

### Print Model Transformation

**Shared Utility:**
```typescript
// packages/shared/print-utils/src/prepare-print-model.ts

export interface PrintModelOptions {
  role: 'student' | 'instructor';
  lockChoiceOrder?: boolean;
  showTeacherInstructions?: boolean;
}

export function preparePrintModel<T extends Record<string, any>>(
  model: T,
  options: PrintModelOptions
): T {
  const { role, lockChoiceOrder = true, showTeacherInstructions = true } = options;
  const isInstructor = role === 'instructor';

  return {
    ...model,

    // Visibility controls
    prompt: model.promptEnabled !== false ? model.prompt : undefined,
    teacherInstructions:
      isInstructor && showTeacherInstructions && model.teacherInstructionsEnabled !== false
        ? model.teacherInstructions
        : undefined,

    // Answer visibility
    alwaysShowCorrect: isInstructor,
    showTeacherInstructions: isInstructor,
    rationale:
      isInstructor && model.rationaleEnabled !== false
        ? model.rationale
        : undefined,

    // Interaction disabling
    disabled: true,
    animationsDisabled: true,
    lockChoiceOrder,
    mode: isInstructor ? 'evaluate' : model.mode,

    // Feedback removal
    feedback: undefined,
  };
}
```

**Element-Specific Overrides:**
```typescript
// packages/elements-react/multiple-choice/src/controller/prepare-print.ts

import { preparePrintModel as basePrepare } from '@pie-element/shared-print-utils';

export function preparePrintModel(model, role) {
  // Apply base transformations
  const base = basePrepare(model, { role });

  // Apply multiple-choice specific transformations
  return {
    ...base,
    keyMode: role === 'instructor',
    choices: base.choices.map(choice => ({
      ...choice,
      rationale: role === 'instructor' ? choice.rationale : undefined,
    })),
  };
}
```

### Web Component Registration

**Pattern for Print Components:**
```typescript
// packages/elements-react/{element}/src/print.ts

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Print } from './print-component';

class ElementPrint extends HTMLElement {
  private _model: any = null;
  private _options: { role: 'student' | 'instructor' } = { role: 'student' };
  private root: ReactDOM.Root | null = null;

  connectedCallback() {
    this.root = ReactDOM.createRoot(this);
    this.render();
  }

  disconnectedCallback() {
    this.root?.unmount();
  }

  get model() {
    return this._model;
  }

  set model(value: any) {
    this._model = value;
    this.render();
  }

  get options() {
    return this._options;
  }

  set options(value: any) {
    this._options = value;
    this.render();
  }

  private render() {
    if (!this.root || !this._model) return;

    this.root.render(
      <Print model={this._model} role={this._options.role} />
    );
  }
}

// Register custom element
if (!customElements.get('multiple-choice-print')) {
  customElements.define('multiple-choice-print', ElementPrint);
}

export default ElementPrint;
```

---

## Estimated Effort

### Phase Breakdown

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Foundation | 2-3 days | None |
| Phase 2: Per-Element (×10) | 30-50 days | Phase 1 complete |
| Phase 3: Demo Integration | 3-4 days | Phase 1 complete |
| Phase 4: Documentation & Testing | 2-3 days | All phases |

**Total Estimated Time:** 37-60 days (7.5-12 weeks)

### Per-Element Breakdown

**Simple Elements** (3-4 days each):
- `passage` (text display only)
- `select-text` (minimal interactions)

**Medium Elements** (4-5 days each):
- `extended-text-entry`
- `math-inline`
- `math-templated`
- `explicit-constructed-response`

**Complex Elements** (5-6 days each):
- `multiple-choice` (choice handling, rationales)
- `rubric` (role-based visibility)
- `complex-rubric` (nested structure)
- `ebsr` (multi-part questions)

---

## Implementation Priority

### Must-Have (Phase 1 + Basic Support)
1. Type system updates
2. Element player infrastructure
3. Shared utilities
4. At least one element implementation (multiple-choice as reference)

### Should-Have (Common Elements)
5. Multiple-choice (most used)
6. Extended-text-entry
7. Math elements (inline + templated)

### Nice-to-Have (Remaining Elements)
8. Rubric elements
9. Passage
10. Select-text
11. EBSR

---

## Open Questions

1. **PDF Export Library**: Should we use browser's native print-to-PDF, or integrate a library like jsPDF/html2pdf.js?
   - **Recommendation**: Start with native, add library if needed

2. **Print Component Loading**: Lazy load print components or bundle with main element?
   - **Recommendation**: Lazy load to reduce bundle size

3. **Styling Approach**: CSS files or inline styles for print mode?
   - **Recommendation**: Separate print.css files per element + shared base

4. **Demo vs Production**: Different print implementations for demo vs production?
   - **Recommendation**: Same implementation, demo just adds preview UI

5. **Role Selector**: Always show role selector, or only in print mode?
   - **Recommendation**: Always show (needed for evaluate mode too)

---

## Success Criteria

### Phase 1
- ✅ Types include print mode without compilation errors
- ✅ Element player can load print components
- ✅ Shared print utilities created and tested

### Phase 2 (Per Element)
- ✅ Print component registered and functional
- ✅ Controller handles print mode correctly
- ✅ Student view shows blank assessment
- ✅ Instructor view shows answers + rationales
- ✅ Browser print produces clean output
- ✅ Unit tests pass
- ✅ E2E tests pass

### Phase 3
- ✅ Demo pages support print preview
- ✅ Print button triggers browser print
- ✅ PDF export works correctly
- ✅ Print layout is clean and professional
- ✅ Styling works across browsers

### Phase 4
- ✅ Documentation complete and accurate
- ✅ All tests passing
- ✅ Visual regression tests pass
- ✅ Example templates created

---

## Related Documents

- [Demo System Documentation](./DEMO_SYSTEM.md)
- [Upstream Sync Strategy](./SYNC_STRATEGY.md)
- [Type System Documentation](../packages/shared/types/README.md)

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-27 | Claude Code | Initial plan created with upstream analysis |

---

## Notes

- All print files are already synced from upstream (as of 2026-01-27)
- Print components exist but are not currently exposed/registered
- This is a comprehensive feature addition, not a bug fix
- Implementation can be done incrementally (one element at a time)
- Print mode is optional but provides feature parity with upstream
