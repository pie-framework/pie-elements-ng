# Extended Text Entry A11y Coverage

## Intended Use

Students compose longer free-text responses in an editor-like response area. Evaluate mode can show scoring or feedback.

## Automated Coverage

- `extended-text-editor-labels`: response area naming, keyboard entry path, editor controls, and target sizing.
- `extended-text-evaluate-feedback`: evaluate-mode feedback and status-message semantics.

The response editor is named by the visible prompt, or "Your response" in the item's language when there is no prompt text ([PIE-1154](https://illuminate.atlassian.net/browse/PIE-1154)). In annotation mode the comment editor is named "Comment" in the item's language, the same string as its visible label.

The editor toolbar is a `role="toolbar"` named "Editing tools" in the item's language, with no tab stop of its own. It is `inert` while the editor lacks focus, so Tab skips its hidden buttons, and stays open while focus is anywhere in the editor ([PIE-1180](https://illuminate.atlassian.net/browse/PIE-1180)).

## Not Covered / Manual

- Confirm rich-text editor keyboard shortcuts, focus mode, and announcement behavior with screen readers.
- Confirm feedback remains clear for long responses and does not interrupt text navigation unexpectedly.
