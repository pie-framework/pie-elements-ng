# PIE-753 Axe Remediation Plan

Sequencing for the fixes triaged in [PIE-1146](https://illuminate.atlassian.net/browse/PIE-1146), from the `apps/element-a11y-demo` axe run on `develop` on 2026-10-03 (63 scenarios, axe-core 4.13, Chromium). Findings, measurements and file links stay in PIE-1146; this file holds the task breakdown, lanes and order.

Work state lives in Jira: `project = PIE AND labels = axe-remediation ORDER BY status`. This file carries no status column.

## Exit criteria

- Every framework-level finding has a task (F1–F8) or a recorded decision.
- Every per-element finding sits in the WCAG remediation epic of its element group, or in PIE-753 when the element belongs to no group.
- The suite's own defects are fixed (S1, S2), and a run on `develop` lists only real failures.
- Each residual finding has a ticket; at zero, `A11Y_ENFORCE=1` becomes a candidate for CI.

## Tasks

`Needs` names tasks whose PRs must be merged to `develop` first. `Gate` names an open decision under [Decisions](#decisions).

Parent epics: 753 = PIE-753; 638 Gryffindor; 794 Ravenclaw; 460 Hufflepuff; 459 Dumbledore's Army (spelled "Dubledore's" in Jira); 798 Ministry of Magic, whose "Match Table" is `match`. PIE-753 holds the suite and framework tasks, E1 (it spans 638 and 794), and the elements outside every initiative group: likert, rubric and multi-trait-rubric. An asterisk marks an element no epic names; 798 is the closest (Group 3). PIE-507 ("Groups 2 and 3 HOLD") is parked and not used.

| ID | Jira | Task | Parent | Lane | Needs / Gate |
| --- | --- | --- | --- | --- | --- |
| S1 | [PIE-1147](https://illuminate.atlassian.net/browse/PIE-1147) | Axe suite: remove the `aria-roles`, `math-alternative` and `target-size` false positives | 753 | S | — |
| S2 | [PIE-1148](https://illuminate.atlassian.net/browse/PIE-1148) | Axe suite: fix `keyboard-tab-reach` misreports (evaluate scenarios, rubric student role, charting histogram) | 753 | S | — |
| F1 | [PIE-1149](https://illuminate.atlassian.net/browse/PIE-1149) | Collapsible: render the header as a button with `aria-expanded` and a contrast-safe colour | 753 | R | — |
| F2 | [PIE-1150](https://illuminate.atlassian.net/browse/PIE-1150) | Feedback: meet text contrast on the correct, incorrect and unanswered backgrounds | 753 | R | — |
| F3 | [PIE-1151](https://illuminate.atlassian.net/browse/PIE-1151) | Feedback: announce evaluate feedback to screen readers | 753 | R | F2, element tasks in the same delivery roots; Gate: announcement model |
| F4 | [PIE-1152](https://illuminate.atlassian.net/browse/PIE-1152) | `@pie-lib/drag`: shared draggable and drop-target primitive that owns role, tab stop and name | 753 | D1 | E1 (design) |
| F5 | [PIE-1153](https://illuminate.atlassian.net/browse/PIE-1153) | Math in controls: give a control that contains math an accessible name | 753 | D1 | F4, E12, E14; Gate: spoken-text source |
| F6 | [PIE-1154](https://illuminate.atlassian.net/browse/PIE-1154) | `EditableHtml`: accept an accessible name; set it in explicit-constructed-response and extended-text-entry | 753 | P | E1 |
| F7 | [PIE-1155](https://illuminate.atlassian.net/browse/PIE-1155) | charting and graphing `mark-label`: label the category and point inputs | 753 | G | — |
| F8 | [PIE-1156](https://illuminate.atlassian.net/browse/PIE-1156) | `@pie-lib/plot` root: give the chart and graph `svg` a name and description | 753 | G | — |
| E1 | [PIE-1157](https://illuminate.atlassian.net/browse/PIE-1157) | Named drop targets for match-list, image-cloze-association, hotspot and drag-in-the-blank ([#279](https://github.com/pie-framework/pie-elements-ng/pull/279)) | 753 | D2 | — |
| E2 | [PIE-1158](https://illuminate.atlassian.net/browse/PIE-1158) | likert: name each radio from its adjacent choice label | 753 | P | — |
| E3 | [PIE-1159](https://illuminate.atlassian.net/browse/PIE-1159) | match: tie each radio or checkbox to its headers; label the `tbody role="group"` | 798 | P | — |
| E4 | [PIE-1160](https://illuminate.atlassian.net/browse/PIE-1160) | matrix: tie each radio to its row and column headers | 798* | P | — |
| E5 | [PIE-1161](https://illuminate.atlassian.net/browse/PIE-1161) | graphing-solution-set: label the `tool-menu` line-selection radios | 798* | P | — |
| E6 | [PIE-1162](https://illuminate.atlassian.net/browse/PIE-1162) | drawing-response: name the colour selects; text alternative for the canvas | 798* | P | — |
| E7 | [PIE-1163](https://illuminate.atlassian.net/browse/PIE-1163) | inline-dropdown: keep `aria-expanded` on the closed combobox | 460 | P | E1 |
| E8 | [PIE-1164](https://illuminate.atlassian.net/browse/PIE-1164) | math-templated: label the math input textarea in the shared math input (covers math-inline) | 459 | P | — |
| E9 | [PIE-1165](https://illuminate.atlassian.net/browse/PIE-1165) | select-text: tab stops and key handling for tokens in `@pie-lib/text-select` | 798* | P | S2; Gate: PRD |
| E10 | [PIE-1166](https://illuminate.atlassian.net/browse/PIE-1166) | multi-trait-rubric: make the "Show Rubric" toggle focusable | 753 | P | — |
| E11 | [PIE-1167](https://illuminate.atlassian.net/browse/PIE-1167) | hotspot: text alternative for the `svg` or `canvas` | 638 | D2 | E1 |
| E12 | [PIE-1168](https://illuminate.atlassian.net/browse/PIE-1168) | image-cloze-association: `alt` for the background image; 24×24 answer tiles | 794 | D2 | E1 |
| E13 | [PIE-1169](https://illuminate.atlassian.net/browse/PIE-1169) | rubric: 24×24 rubric toggle (covers complex-rubric) | 753 | P | — |
| E14 | [PIE-1170](https://illuminate.atlassian.net/browse/PIE-1170) | drag-in-the-blank: 24×24 choice chips | 794 | D2 | E1 |
| E15 | [PIE-1171](https://illuminate.atlassian.net/browse/PIE-1171) | mc-populated-blank: 24×24 radios | 638 | P | — |
| E16 | [PIE-1172](https://illuminate.atlassian.net/browse/PIE-1172) | number-line: text alternative for the `svg` | 798 | P | — |
| E17 | [PIE-1173](https://illuminate.atlassian.net/browse/PIE-1173) | fraction-model: text alternative; name the `svg role="application"` | 798* | P | — |
| E18 | [PIE-1174](https://illuminate.atlassian.net/browse/PIE-1174) | graphing: no nested buttons in the toolbar; disabled draggables lose role and tab stop | 798 | G | F4 |

Deferred, no ticket yet: **X1**, moving the hand-rolled drag code onto the F4 primitive: the match-list, image-cloze-association, drag-in-the-blank and categorize drop targets, and the draggables in placement-ordering `tile.tsx`, number-line, categorize `choice.tsx`, mask-markup `choice.tsx`, image-cloze-association `possible-response.tsx` and match-list `answer.tsx`. E1 and #278 already name the drop targets, so X1 is refactor-only. Decided on PIE-1152 after E18 shows the primitive working.

## Scope notes

- **S1.** Stop reflecting `role` on `PieElementPlayer` (`packages/element-player/src/players/PieElementPlayer.svelte`). Renaming the prop also edits the `apps/element-demo` print route, outside lane S.
- **S2.** The charting histogram miss is probably a real defect: `lib-react/charting` bars and `@pie-lib/plot`'s `gridDraggable` handles take no keyboard focus. S2 keeps the check on that scenario, and a confirmed defect becomes a new lane-G task. Evaluate scenarios keep `keyboard-tab-reach` where Collapsible renders, because F1 gives those headers tab stops.
- **F2.** number-line's own feedback panel (`number-line/src/delivery/number-line/feedback.tsx`) uses the same tokens. It did not fail; check it in the same PR.
- **F3.** The recommended design keeps an empty status region in each element's delivery root during gather, so F3 edits roots in other lanes' packages: match-list, select-text, categorize, match, math-inline, extended-text-entry and number-line, among others. Elements that render no `Feedback` (likert, matrix, inline-dropdown, drag-in-the-blank, hotspot, image-cloze-association) need nothing. F3 runs in wave 3, cut after the per-element tasks in those packages merge.
- **F4.** Builds on E1's naming semantics and shares no files with it. Generated names follow the screen-reader copy in [UX-2785](https://illuminate.atlassian.net/browse/UX-2785), as E1's do.
- **F5.** Under the recommended option F5 supplies the math-aware name that F4's content-name path uses. It edits F4's primitive, mask-markup `choices/choice.tsx` (E14's file), image-cloze-association `possible-response.tsx` (E12's file) and categorize `choice.tsx`, which calls `useDraggable` directly and is in F5's scope. If the gate picks naming `mjx-container` instead, F5 moves to `packages/shared/math-rendering-mathjax` and drops `Needs E12, E14`.
- **F6.** Edits three packages: `lib-react/editable-html-tip-tap` (the `EditableHtml` editor attributes), `lib-react/mask-markup` (`constructed-response.tsx`, which renders the explicit-constructed-response editor) and `elements-react/extended-text-entry`. E1's translator-named blanks are the pattern for the response names.
- **F7.** A third `mark-label` copy lives in `lib-react/graphing-solution-set`; the graphing-solution-set scenario did not report it. F7 decides whether to cover it; the file is in E5's package.
- **F8.** `@pie-lib/plot`'s root also renders graphing-solution-set's graph, so a new prop edits `lib-react/graphing-solution-set/src/graph.tsx` (E5's package).
- **E1.** Also removes match-list's nested buttons. It names image-cloze-association response areas by position ("Response area 1 of 3") and reads no authored label, so [PIE-805](https://illuminate.atlassian.net/browse/PIE-805) (authored response-area labels, which the [PIE-806](https://illuminate.atlassian.net/browse/PIE-806) migration fills) stays open.
- **E5.** The radios are in `lib-react/graphing-solution-set/src/tool-menu.tsx`.
- **E6.** Name the selects in `drawing-response/src/delivery/drawing-response/drawable-palette.tsx`. Fixing render-ui's `InputContainer` instead would collide with lane R.
- **E7, F6.** mask-markup has no test setup on `develop` until E1 adds it, so both are cut after E1 merges.
- **E8.** Edits `lib-react/math-input` and removes math-inline's own textarea label code. Overlaps [PIE-458](https://illuminate.atlassian.net/browse/PIE-458) (math-templated accessibility evaluation).
- **E11.** Also replaces the hard-coded `alt="hotspot-image"` in `hotspot/src/delivery/hotspot/container.tsx`, the file E1 edits.
- **E12.** Also covers the residual from #279: answer choices whose images have empty `alt` have no accessible name. The image-cloze-association model's `image` has no alt field.
- **E13.** complex-rubric wraps `@pie-element/rubric` and multi-trait-rubric. The toggle is `RubricToggle` in `rubric/src/delivery/main.tsx`; the doc is `docs/a11y/rubric.md`.
- **E14.** The chips are most likely `mask-markup/src/choices/choice.tsx`, which E1 does not touch; the package and its test setup are shared.
- **E18.** First adopter of F4. If F4 slips, E1's pattern (spread the drag `attributes` only on enabled draggables) fixes `lib-react/graphing/src/toggle-bar.tsx` without it.

## Lanes

A lane is one worktree, reused across its tasks; each task gets its own branch cut from `origin/develop`. Lanes own disjoint paths and run in parallel, at most four worktrees at once. P runs one task at a time and takes a second worktree only while another lane is idle. F3 and F5 cross lanes by design; their scope notes say which packages and why they wait.

| Lane | Owns | Tasks |
| --- | --- | --- |
| S | `apps/element-a11y-demo`, `packages/element-player` | S1 → S2 |
| R | `packages/lib-react/render-ui` | F1 → F2 → F3 |
| D2 | `packages/elements-react/{hotspot,image-cloze-association,match-list}`; `packages/lib-react/mask-markup` except `components/dropdown.tsx` and `constructed-response.tsx`; `packages/shared/translator` until #279 merges | E1 → E11, E12, E14 |
| D1 | `packages/lib-react/drag` | F4 → F5 |
| G | `packages/lib-react/{charting,graphing,plot}` | F7 → F8 → E18 |
| P | the packages each task names | F6, E2–E10, E13, E15–E17 |

D2's worktree is `.claude/worktrees/drop-target-a11y`. [PIE-856](https://illuminate.atlassian.net/browse/PIE-856) has open graphing subtasks ([PIE-994](https://illuminate.atlassian.net/browse/PIE-994), [PIE-1138](https://illuminate.atlassian.net/browse/PIE-1138)) in lane G's packages.

## Waves

1. **S, R (F1, F2), P, D2 (review and merge #279).** No lane waits for S1 and S2: fixes verify against the suite with the known false positives in mind. E9 is the exception, because its acceptance check is `keyboard-tab-reach`. P takes ungated tasks first.
2. **D1 (F4), D2 (E11, E12, E14), G (F7, F8, E18), P continues.** F4, F6, E7 and the D2 tasks start once #279 merges; E18 waits for F4.
3. **F3, F5.** F3 waits on George Schneiderman's answer to the PIE-1146 comment and on the element tasks in its delivery roots. F5 waits on the math accessibility review under ADR 0003 (2026-10-05) and on George's answer, then on F4, E12 and E14.
4. **Close-out.** Re-run the suite on `develop`, ticket residual findings, close PIE-1146.

## Merge discipline

- One PR per task, merged to `develop` independently. No integration branch.
- CI records a patch changeset (`.changeset/pr-<n>.md`) for every merged PR. Hand-write one only for a larger bump. A PR that touches only private packages, such as the a11y demo, records none.
- Shared files and their conflict rules:
  - `bun.lock`: take `develop`'s and rerun `bun install`.
  - `package.json`: new workspace dependencies and test devDependencies are allowed, following E1's setup (vitest, happy-dom, Testing Library, `__tests__/vitest-env.d.ts`). No version bumps of existing dependencies.
  - `packages/shared/translator/src/{en,es}.ts`: keys go under the element's own namespace. `tests/resources.test.ts` keeps one sorted `LOCALLY_OWNED` array; on conflict keep both entries and re-sort.
  - `apps/element-demo/test/e2e/phase1-spatial-dnd.spec.ts` and `phase2-structured.spec.ts` cover elements from several lanes; on conflict keep both sides.
- A task branch edits the `docs/a11y/<element>.md` of each element it changes, its package README and any PRD it drafts. S1 and S2 also edit the Automated Focus column of `TRACKING.md` and `apps/element-a11y-demo/test/a11y/README.md`, as AGENTS.md requires when automated scope changes. `INDEX.md`, the rest of `TRACKING.md` and this file change only through planning PRs.
- Starting a task in a reused worktree: `git fetch origin && git switch -c <branch> origin/develop`, `bun install --frozen-lockfile`, delete the untracked `dist/`, `module/`, `esm/` and `build/` directories, and rebuild. Turbo cache restores never delete stale outputs, which then fail `check:publish-surface`.
- An open PR that conflicts with `develop` merges `develop` in.

## Decisions

- **F3, announcement model (open).** George Schneiderman, on PIE-1146. Recommendation: each element keeps an empty status region mounted in gather mode, and the shared feedback component fills it on evaluate. A `role="status"` on a component that mounts with its text does not announce. Open: whether evaluate feedback is announced at all or focus moves to it, and what a screen reader (not only Chrome's accessibility tree) actually reports. The screen-reader acceptance test is postponed: driving VoiceOver needs a system setting changed on the test machine, and NVDA needs Windows.
- **F5, spoken-text source (open).** The math accessibility review under ADR 0003 (2026-10-05), with George's answer. Recommendation: shared draggable and choice components name each control from its content, voicing the hidden MathML both MathJax versions emit. A MathJax speech mode applies page-wide and exists only on MathJax 4. Open: where the spoken text comes from, and whether it follows read-aloud's ClearSpeak rules.
- **Text source for E6, E11, E12, E16, E17 and F8 (decided 2026-10-03).** These tasks generate their text from the model through `@pie-lib/translator`, with no new config. An authored field is authoring-visible config that needs a PRD under AGENTS.md, and is postponed; image-cloze-association's `image` has no alt field, and hotspot hard-codes its alt.
- **E9, PRD (open).** Keyboard selection of tokens is a new interaction model; check it against the PRD bar in AGENTS.md. If it needs a PRD, implementation waits until the Proposal is accepted.

## Resuming a session

1. Run the Jira query above.
2. Pick a task whose `Needs` have merged to `develop` (their Jira status may still be in testing or release) and whose gate is recorded as cleared in a comment on the task.
3. Claim it: assign yourself and move it to In Progress before cutting the branch.
4. Work in the lane's worktree, or create one from `origin/develop`.
5. Link the Jira task in the PR body, and add the PR to the task as a remote link.
6. Verify with `bun run lint:all && bun run test` and `bun run test:a11y`; CI's non-blocking `a11y` job publishes the suite report on every PR.
7. Edit this file only to change the plan.
