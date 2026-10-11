# Legacy contract changes

Differences between each ng element's generated schemas and the legacy `pie-elements` schemas (`docs/pie-schema.json`, `docs/config-schema.json`) that change what a host may send or can rely on. Description wording, key order, `title` fields and `$ref` layout are not listed. Parent: [Element JSON Schemas](../PRD.md).

## Shared authoring types

- `mathMlOptions.mmlOutput` and `mathMlOptions.mmlEditing` are booleans; legacy declares them as numbers, and ng's editor tests them for truthiness.
- `inputConfiguration` keeps the legacy plugin keys `sub`, `sup` and `characters`, which ng's editor does not read: it reads `subscript`, `superscript` and `languageCharacters`.

## multiple-choice

- Model `required` is `id`, `element` and `choices`. Legacy also requires the feature toggles `accessibilityLabelsEnabled`, `feedbackEnabled`, `rationaleEnabled`, `rubricEnabled`, `spellCheckEnabled`, `studentInstructionsEnabled` and `teacherInstructionsEnabled`; ng leaves them optional.
- `choicePrefix` accepts `none`, which the delivery renders as no key; the authoring control offers only `letters` and `numbers`.
- New model keys ng reads: `extraCSSRules`, `keyboardEventsEnabled`, `defaultFeedback`. Root `rationale` is declared because default models carry it; the element reads only per-choice rationales.
- `verticalMode` and `limitChoicesNumber` are declared and deprecated: ng still reads both.
- Configuration `answerChoiceCount` defaults to 0 with minimum 0; legacy documents a default of 4 and minimum 1.
- Configuration `spellCheck.enabled` is new: it sets the spellcheck default for new items.
- Configuration `toolbarEditorPosition` is declared but not read; the model's `toolbarEditorPosition` sets the position.
- Configuration keys declared for legacy compatibility and not read: `accessibility`, `showPrompt`, `promptLabel`, `settingsPartialScoring`.
- The author's default configuration no longer sets `promptLabel` ("Item Stemm" in legacy).

## venn-classification

No legacy counterpart; the element is ng-only.
