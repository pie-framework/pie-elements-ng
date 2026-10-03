# Extended Text Entry A11y Coverage

## Intended Use

Students compose longer free-text responses in an editor-like response area. Evaluate mode can show scoring or feedback.

## Automated Coverage

- `extended-text-editor-labels`: response area naming, keyboard entry path, editor controls, and target sizing.
- `extended-text-evaluate-feedback`: evaluate-mode feedback and status-message semantics.

The response editor is named by the visible prompt, or "Your response" in the item's language when there is no prompt text ([PIE-1154](https://illuminate.atlassian.net/browse/PIE-1154)).

## Open Gaps

- The editor toolbar is a `div` with `tabindex="1"` and no role or name (`MenuBar` in `@pie-lib/editable-html-tip-tap`), so it is an unnamed tab stop, and the positive tabindex puts it ahead of the page's tab order. The suite's `interactive-control-name` check reports it.

## Not Covered / Manual

- Confirm rich-text editor keyboard shortcuts, focus mode, and announcement behavior with screen readers.
- Confirm feedback remains clear for long responses and does not interrupt text navigation unexpectedly.
