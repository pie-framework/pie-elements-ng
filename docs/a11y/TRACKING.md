# PIE Element A11y Tracking

Status: Initial scenario coverage in progress.

This directory tracks the WCAG 2.2 Level AA accessibility coverage for every PIE element in the demo registry. The automated suite lives in `apps/element-a11y-demo/src/lib/a11y/scenarios/catalog.ts` and runs through `apps/element-a11y-demo/test/a11y/axe-scenarios.spec.ts`.

## Coverage Matrix

| Element | Scenario Coverage | Automated Focus | Remaining Manual / Unclear Work |
| --- | --- | --- | --- |
| [categorize](categorize.md) | Drop-zone names; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm full drag/drop keyboard workflow and screen-reader placement announcements. |
| [charting](charting.md) | Editable bar, line, histogram | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm data values and chart trends are understandable without sight or color. |
| [complex-rubric](complex-rubric.md) | Rubric structure; evaluate feedback | Axe, labelled groups, control names, tab reach, status messages | Confirm long descriptors are announced in a usable order. |
| [drag-in-the-blank](drag-in-the-blank.md) | Blank targets; image word problem | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm drag/drop has a complete keyboard alternative and clear live feedback. |
| [drawing-response](drawing-response.md) | Toolbar controls; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, media alternatives, status messages | Confirm non-pointer drawing alternatives and canvas result descriptions. |
| [ebsr](ebsr.md) | Two-part choice groups; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm Part A/Part B relationship is clear to screen readers. |
| [explicit-constructed-response](explicit-constructed-response.md) | Embedded fields; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm embedded blank instructions remain clear in long rich text. |
| [extended-text-entry](extended-text-entry.md) | Editor labels; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm rich-text/editor keyboard shortcuts and screen-reader mode behavior. |
| [fraction-model](fraction-model.md) | Segment controls; configurable/improper models | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm fraction visuals have equivalent text meaning. |
| [graphing](graphing.md) | Toolbar; parabola graph | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm graph construction can be completed without pointer input. |
| [graphing-solution-set](graphing-solution-set.md) | Solution region; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, media alternatives, status messages | Confirm shaded solution regions do not rely on color or position alone. |
| [hotspot](hotspot.md) | Hotspot region names | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm hotspot labels are descriptive without revealing answers. |
| [image-cloze-association](image-cloze-association.md) | Image targets and responses | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm image/drop target relationship is understandable without sight. |
| [inline-dropdown](inline-dropdown.md) | Combobox blanks; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm dropdown open/close and option navigation behavior with screen readers. |
| [likert](likert.md) | Scale radio group; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm scale endpoints and selected state are announced clearly. |
| [match](match.md) | Row choice labels; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm row/answer relationships are navigable without visual table layout. |
| [match-list](match-list.md) | Association controls; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm prompt/answer association context is retained during navigation. |
| [math-inline](math-inline.md) | Math editor; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, math alternatives, status messages | Confirm equation editor output is usable with screen readers. |
| [math-templated](math-templated.md) | Template fields; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, math alternatives, status messages | Confirm blank-to-expression context survives screen-reader navigation. |
| [matrix](matrix.md) | Row/column relationships; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm row and column headers are announced for each selectable cell. |
| [mc-populated-blank](mc-populated-blank.md) | Choice labels; audio/transcript; stem association | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm transcript completeness and blank/stem association. |
| [multi-trait-rubric](multi-trait-rubric.md) | Trait table structure; evaluate feedback | Axe, labelled groups, control names, tab reach, status messages | Confirm trait/score descriptor relationships for assistive tech. |
| [multiple-choice](multiple-choice.md) | Single-select; multi-select; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm radio vs checkbox semantics match configuration. |
| [number-line](number-line.md) | Point controls; inequality rays | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm endpoint inclusion, ray direction, and plotted values are exposed textually. |
| [passage](passage.md) | Reading structure; poetry order | Axe, labelled groups | Confirm line/stanza reading and hidden layout text with screen readers. |
| [placement-ordering](placement-ordering.md) | Keyboard reorder; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm reorder workflow can be completed and announced without drag input. |
| [rubric](rubric.md) | Score structure; descriptor order | Axe, labelled groups, control names, tab reach | Confirm descriptor reading order and heading structure in long rubrics. |
| [select-text](select-text.md) | Token semantics; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm text selection workflow and selected state announcements. |
| [simple-cloze](simple-cloze.md) | Input label; evaluate feedback | Axe, labelled groups, control names, tab reach, target size, status messages | Confirm input error/correctness messages are clear and associated. |
| [venn-classification](venn-classification.md) | Tile/region keyboard; region overrides | Axe, labelled groups, control names, tab reach, target size, media alternatives | Confirm region placement announcements and keyboard classification workflow. |

## Tracking Notes

- Automated checks do not prove complete keyboard workflows or screen-reader usability; those are tracked as manual gaps in the per-element files.
- Findings are currently non-blocking unless `A11Y_ENFORCE=1` is set.
- If an issue requires changing a synced React element or shared React lib, fix it upstream before syncing into this repository.
