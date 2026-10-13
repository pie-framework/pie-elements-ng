# Extended text entry: plain-text paste

Status: **Proposal** · Impl. path: Extend `extended-text-entry` · Follows Jira [PIE-1145](https://illuminate.atlassian.net/browse/PIE-1145)

## Context

The student writes the response in a Tiptap editor with lists, tables, headings and alignment turned off. Since PIE-1145, content pasted from outside a PIE editor keeps the bold, italic, underline, strikethrough, superscript and subscript that the response toolbar offers, and drops the rest: fonts, colours, sizes, alignment, headings and links go, and lists and tables become paragraphs. The legacy Slate editor pasted plain text. A program that wants every pasted response to look like typed text, as it did under the legacy editor, has no way to get it: the response editor's settings are fixed in the element, and the editor's `pasteFormatting` option reaches only author fields, through `inputConfiguration`.

This PRD adds an item-level setting that makes the response paste plain text. Session and scoring are unchanged.

## Goals

- An author can make an item's response paste plain text.
- Items without the setting keep today's behaviour: pasted formatting the toolbar offers is kept.
- The host decides whether authors see the toggle, as with every other extended-text-entry setting.

## Non-goals

- **No paste blocking.** Students can still paste; the setting removes formatting only. Refusing a paste is an academic-integrity feature with its own surface (what the student is told, drag and drop, the context menu) and needs its own PRD.
- **No per-format choice.** The response toolbar decides which formatting a student can apply, and a paste keeps the same set; a per-format paste setting would duplicate that toolbar.
- **No effect on copies between PIE editors.** Content copied from one PIE editor into the response keeps its formatting under either setting, as the editor leaves internal copies to ProseMirror.
- **No effect on the annotation comment or on author fields.** The comment box is the instructor's. Prompt and teacher instructions take `pasteFormatting` through their `inputConfiguration`, which is the host's setting.

## Proposed surface

- **Model**: `playerPasteFormattingDisabled`, boolean, default `false`. Named after `playerSpellCheckDisabled`. Only `true` turns it on, so a stored `null` keeps formatting, the case PIE-978 hit for spellcheck.
- **Session**: unchanged.
- **Configuration**: `playerPasteFormatting: { settings, label }`, with `settings: true` and the label "Students paste plain text" by default. `settings: false` hides the toggle and leaves the model value in force.
- **Controller**: passes `pasteFormattingDisabled` to the delivery model.
- **Delivery** (`gather`): with the setting on, a paste into the response arrives as paragraphs and line breaks with no inline formatting. Math copied from rendered PIE content, such as the prompt, stays math. In `view` and `evaluate` the response is read-only, so the setting has no effect.
- **Authoring surface**: one toggle in the Settings group of the settings panel, next to "Disable Student Spellcheck".

## Worked example

> *Prompt*: Summarise the passage in two paragraphs.

A student drafts in Word, with the first sentence in bold and three points as a bulleted list, then pastes the draft into the response. With the setting off, the first sentence stays bold and each point becomes a paragraph of its own. With the setting on, the same paste arrives as plain paragraphs, the first sentence included, and `session.value` holds no `<strong>`.

## Accessibility

The response's accessible name, role and structure are the same under either setting. The toggle is the settings panel's standard switch.

## Open questions

- [ ] **Toggle shown by default.** Proposed `settings: true`, so authors on every host see the toggle after an upgrade. Alternative: `settings: false`, so it appears only where a host opts in.
- [ ] **Default for the model.** Proposed `false`, which keeps what students get from the Tiptap editor today. `true` would restore the legacy editor's plain-text paste for every item without the setting, and would change today's behaviour for every item already authored.
