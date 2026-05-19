# PIE A11y Initiative Map

This map connects the repo's element-level a11y docs to the Confluence initiative structure for PIE Elements Universal Access (WCAG).

## Initiative Groups

| Initiative group | Confluence intent | Repo docs | Primary scenario focus |
| --- | --- | --- | --- |
| Group 1A | MC/MS, EBSR, Passages | [`multiple-choice`](./multiple-choice.md), [`ebsr`](./ebsr.md), [`passage`](./passage.md) | Choice semantics, two-part grouping, passage reading structure |
| Group 1B | Inline Dropdown, ECR, CQT | [`inline-dropdown`](./inline-dropdown.md), [`explicit-constructed-response`](./explicit-constructed-response.md), [`mc-populated-blank`](./mc-populated-blank.md) | Cloze controls, embedded response fields, CQT populated blank variants |
| Group 2 | Match List, Drag in the Blank, Categorize, Placement Ordering, Image Cloze Association, Hot Spot | [`match-list`](./match-list.md), [`drag-in-the-blank`](./drag-in-the-blank.md), [`categorize`](./categorize.md), [`placement-ordering`](./placement-ordering.md), [`image-cloze-association`](./image-cloze-association.md), [`hotspot`](./hotspot.md) | Spatial interaction, drag alternatives, image/target alternatives |
| Group 1C | Math Editor, Math Inline | [`math-inline`](./math-inline.md), [`math-templated`](./math-templated.md); shared surfaces `@pie-lib/math-input`, `@pie-lib/math-toolbar`, `@pie-lib/math-input-svelte` | Math editor naming, keypad workflow, rendered math alternatives |
| Group 1D | CR / Extended Text Entry | [`extended-text-entry`](./extended-text-entry.md); shared surface `@pie-lib/editable-html-tip-tap` | Rich text editor, supplemental character panels, feedback and annotations |
| Group 3 | Graphing, Number Line, Match Table, Select Text, Charting, Drawing Response, Math-Templated, Graphing Solution Set, Fraction Model | [`graphing`](./graphing.md), [`number-line`](./number-line.md), [`matrix`](./matrix.md), [`select-text`](./select-text.md), [`charting`](./charting.md), [`drawing-response`](./drawing-response.md), [`math-templated`](./math-templated.md), [`graphing-solution-set`](./graphing-solution-set.md), [`fraction-model`](./fraction-model.md) | Graph/canvas alternatives, table relationships, visual data and pointer-heavy workflows |
| Repo tracked outside current initiative grouping | Elements covered by the repo that are not clearly named in the initiative | [`likert`](./likert.md), [`match`](./match.md), [`rubric`](./rubric.md), [`complex-rubric`](./complex-rubric.md), [`multi-trait-rubric`](./multi-trait-rubric.md), [`simple-cloze`](./simple-cloze.md), [`venn-classification`](./venn-classification.md) | Preserve visibility so future initiative scope does not miss them |

## Shared Surfaces

Some initiative work is not owned by a single element package.

| Shared surface | Used by | Tracking note |
| --- | --- | --- |
| `@pie-lib/math-input` | `math-inline`, `math-templated`, rich text math entry | Track under Group 1C because editor accessibility affects multiple elements. |
| `@pie-lib/math-toolbar` | Math entry experiences | Track with Math Editor / Math Inline for keypad and toolbar workflow. |
| `@pie-lib/math-input-svelte` | Svelte math field surfaces | Track with Group 1C when Svelte delivery/authoring uses the shared field. |
| `@pie-lib/editable-html-tip-tap` | Extended text entry and authoring/editor flows | Track under Group 1D for baseline rich text editor and supplemental panels. |

## Reporting Expectations

- Scenario IDs and automated checks come from `apps/element-a11y-demo/src/lib/a11y/scenarios/catalog.ts`.
- Findings and suggested Jira titles come from the Axe scenario report.
- Confluence group pages summarize status and sequencing.
- Jira tickets own assignment, sprint, and release state.
