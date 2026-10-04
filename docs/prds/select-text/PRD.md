# Select text: keyboard token selection

Status: **Proposal** · Impl. path: Extend `select-text` · Tracks Jira [PIE-1165](https://illuminate.atlassian.net/browse/PIE-1165)

## Context

In select-text the student selects tokens: spans of `model.text` the author marked as words, sentences, paragraphs or free selections. `@pie-lib/text-select` renders each token as a plain `span` that responds to a click and has no tab stop, key handling, role or state; legacy `pie-lib` is the same. A keyboard-only student cannot answer, and a screen-reader user can neither tell a token from the surrounding text nor hear which tokens are selected. The axe triage in [PIE-1146](https://illuminate.atlassian.net/browse/PIE-1146) found the gap. The current tokens fail WCAG 2.1.1 and 4.1.2, and the focus this PRD adds must meet 2.4.7.

No earlier keyboard behaviour exists to restore, so this PRD defines one. The change is delivery-only: Model, Session, Controller and authoring surface stay as they are.

## Goals

- In `gather` mode the student reaches, selects and deselects every token with the keyboard alone, under the same `maxSelections` rules as a click.
- Each token exposes its text, role, selected state and position to assistive technology.
- The text adds one tab stop to the page, however many tokens it holds.
- Focus is always visible and stays on a token when it toggles.
- Pointer and touch behaviour and the look of tokens are unchanged, apart from the new focus indicator.

## Non-goals

- **No tab stop per token.** A sentence-mode text with 12 tokens would put 12 Tab presses between the student and the Player's navigation. A roving tabindex gives the text one tab stop with arrow keys inside it, the APG composite pattern.
- **No `listbox` with `aria-multiselectable`.** A listbox may contain only options and groups of options, so the untokenized text between tokens (sentence fragments, paragraphs, tables) would sit inside it invalidly, and a listbox puts screen readers in focus mode, where the surrounding text is not read.
- **No `role="checkbox"`.** A checkbox toggles on Space only and reads as a form field. A toggle button (`role="button"` with `aria-pressed`) toggles on Space and Enter, as hotspot's shapes do.
- **No native `<button>` tokens.** A button is inline-block, so a sentence token would stop wrapping with its line. Tokens stay inline `span`s carrying the role.
- **No radio semantics when `maxSelections` is 1.** A radio group selects on arrow keys and cannot be cleared, while a click toggles and allows zero selections; the toggle button covers both.
- **No keyboard marking of tokens in `select-text-config`.** The authoring tokenizer reads a text selection on click; making it keyboard-operable is a separate authoring-surface change.
- **No new Model or authoring fields.** The group name and position text come from `@pie-lib/translator` under `selectText`, with Spanish.

## Proposed surface

**Model / Session**: unchanged. A keyboard toggle writes `session.selectedTokens` as a click does and dispatches the same `session-changed` event.

**Modes**: keyboard operation in `gather` only. In `view` and `evaluate`, and in print, tokens are not operable and the text has no tab stop; selected tokens still expose their pressed state, marked unavailable.

**Key delivery interactions** (`gather`):

- **Tab** enters the text on one token: the token last focused, else the first selected token, else the first token. **Tab** and **Shift+Tab** leave the text.
- **Right / Down** move to the next token and **Left / Up** to the previous, in text order, stopping at the ends. **Home** and **End** move to the first and last token. Untokenized text is skipped.
- **Space / Enter** toggle the focused token, and focus stays on it. The text re-renders from an HTML string on every change, so focus is restored explicitly.
- **`maxSelections` = 1**: selecting a token deselects the previous one, as a click does.
- **`maxSelections` > 1, limit reached**: unselected tokens stay in the arrow-key sequence as unavailable (`aria-disabled`), and Space / Enter does nothing on them. Today they turn into plain text at the limit; keeping them as tokens keeps positions stable and lets the student find them before deselecting another. They look as they do today.
- **Pointer**: a click toggles as today and moves the tab stop to the clicked token, with no focus ring (`:focus-visible`).

**Announcement per token**: name from the token's text, role toggle button, state pressed or not pressed, and position ("2 of 4") as a description, since `aria-posinset` is not allowed on a button. The text is a `role="group"` named "Selectable text", extended to "Selectable text, select up to 2" when `maxSelections` > 0.

## Worked example

> *Prompt*: Select the two sentences that describe the weather.

Sentence mode, `maxSelections` = 2. Text: "The storm hit at dawn. Mara ran to the barn. Rain flooded the valley road. She found the calf asleep."

The student tabs in and hears "The storm hit at dawn., toggle button, not pressed, 1 of 4"; Space makes it "pressed". Right, Space selects "Mara ran to the barn.", which reaches the limit. Right lands on "Rain flooded the valley road., toggle button, unavailable, 3 of 4", and Space does nothing. Left, Space deselects the second sentence; Right, Space selects the third. Tab leaves the text. `session.selectedTokens` holds the tokens at offsets 0–22 and 45–74, the Session the same sequence of clicks produces.

## Accessibility

- **Keyboard model**: the keys under Key delivery interactions, and no others. A screen reader in browse mode keeps its own keys: every token stays in the accessibility tree, reachable with the virtual cursor or button navigation, and Enter arrives as a click.
- **Screen-reader model**: the state change on the focused token announces each toggle, so no live region is needed. With `maxSelections` = 1 the token losing its selection changes silently; the student hears the new one. Chrome leaves MathML out of a button's name, so tokens containing math depend on the shared math-in-controls naming from PIE-1146; images name from their `alt`.
- **Focus visibility**: a focus ring distinct from the selected style (fill and solid border) and from `highlightChoices`' dashed outline, at 3:1 against both the page and the selected fill. With `highlightChoices` off, the ring is the only cue that the focused text is a token.
- **Target size**: tokens are inline text, which the inline exception of WCAG 2.5.8 covers; their size is unchanged.

## Open questions

- [ ] **Up / Down in multi-line text and tables.** Proposed: they repeat Right / Left in token order. Alternative: move to the token on the line above or below, or to the cell below when tokens sit in a table. Token order is DOM order, which matches reading order for flowing text and breaks down for a table read by column.
- [ ] **Long texts.** Word mode over a long text can hold more than a hundred tokens. Are Home and End enough, or does the text need jumps (next paragraph, next selected token)? Does "57 of 140" help or add noise?
- [ ] **Correctness in `evaluate`.** Correct, incorrect and missed tokens are marked by border and icon only, and the icons carry no text. Should each marked token expose its marking as a description from the existing Legend keys (`correctAnswerSelected`, `incorrectSelection`, `correctAnswerNotSelected`), and should `evaluate` keep one tab stop so a keyboard user can step through the marked tokens?
- [ ] **Limit feedback.** At the limit a token reads as unavailable with no reason given. Is the group name's "select up to 2" enough, or should reaching the limit be announced ("2 of 2 selected") through the status region planned for evaluate feedback?
