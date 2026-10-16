# Legacy contract changes

Differences between each ng element's generated schemas and the legacy `pie-elements` schemas (`docs/pie-schema.json`, `docs/config-schema.json`) that change what a host may send or can rely on. Description wording, key order, `title` fields and `$ref` layout are not listed. Parent: [Element JSON Schemas](../PRD.md).

## Shared changes

These apply to every element that has the key, and are not repeated below.

- Session schemas are new: legacy publishes none. Each declares `id`, `element` and what the element writes into the session.
- Every model accepts `accessibilityCatalogs`, from the shared `PieModel`.
- Model `required` holds the identity keys and the content the element cannot render without. The feature toggles legacy requires (`feedbackEnabled`, `rationaleEnabled`, `rubricEnabled`, `spellCheckEnabled`, `studentInstructionsEnabled`, `teacherInstructionsEnabled` and the like) are optional, and the controller's defaults apply. Entries below name any other key legacy requires.
- Model `toolbarEditorPosition` defaults to `bottom`; legacy publishes the malformed default `: 'bottom'`.
- Configuration `showPrompt`, `promptLabel` and `settingsPartialScoring` are declared for legacy compatibility and not read, without legacy's defaults (`true`, "Item Stemm" and `true`).
- Configuration `spellCheck` gains `enabled`, which the author defaults carry. Multiple-choice reads it; elsewhere it is declared and not read.
- Configuration `contentDimensions` drops legacy's malformed defaults (`: {}` and `undefined`).
- `mathMlOptions.mmlOutput` and `mathMlOptions.mmlEditing` are booleans; legacy declares them as numbers, and ng's editor tests them for truthiness.
- The editable-html plugin maps (`inputConfiguration`, `baseInputConfiguration`) gain the keys ng's editor reads: `languageCharacters`, `pasteFormatting`, `responseArea`, `separateParagraphs`, `showParagraphs`, `subscript`, `superscript` and `textAlign`. They keep the legacy `sub`, `sup` and `characters`, which ng's editor does not read.

## categorize

- Model `required` is `id`, `element`, `choices` and `categories`.
- `categories[].choices` is optional and not read: placements come from the session's `answers`.
- `choices[].categoryCount` and `choices[].correctResponseCount` are numbers. A stored `correctResponseCount` is not read; the author recomputes it on every render.
- Feedback levels `correct`, `incorrect` and `partial` are optional, each one `{ type: 'default' | 'custom' | 'none', default?, custom? }` in place of legacy's per-type union.
- New model keys: `allowAlternateEnabled`, `allowMultiplePlacementsEnabled` (`Yes`, `No` or `Set Per Choice`), `rowLabels`, `minRowHeight`, `extraCSSRules`, `scoringType` and `teacherInstructions`.
- Model `alternates` is declared and not read: alternates live in `correctResponse[].alternateResponses`, though default models carry the key.
- New configuration keys: `feedback`, `lockChoiceOrder`, `allowMultiplePlacements`, `maxPlacements`, `allowAlternate`, `categoriesPerRow`, `minCategories` (default 1), `maxLengthPerChoice` (default 300) and `maxLengthPerCategory` (default 150).
- Configuration `toolbarEditorPosition` and `feedback.enabled` are declared and not read; the model's `toolbarEditorPosition` sets the position.
- New configuration defaults: `minChoices` 1, `maxCategories` 12, `minCategoriesPerRow` 1.
- Configuration `maxChoices` only feeds the authoring validation message; `validate()` checks the model's `maxAnswerChoices`. `partialScoring.settings` controls the partial-scoring toggle.
- Session `id` is a string or a number: `createCorrectResponseSession` writes the number 1.

## charting

- Model `required` is `id` and `element`.
- The `chartType` value `dorPlot` becomes `dotPlot`.
- `data` and `correctAnswer.data` are arrays. A category requires only `label` and `value`, and gains `index`. `correctAnswer.name` is optional.
- `domain` and `range` keys are optional, and both gain `label`. `domain` `min`, `max`, `step` and `labelStep` are declared and not read.
- New model key `extraCSSRules`.
- Model `rubricEnabled`, `studentInstructions`, `studentInstructionsEnabled` and `placeholderMessages` are declared and not read.
- New configuration key `chartDimensions`.
- New configuration key `studentNewCategoryDefaultLabel`, declared and not read: the model's key of that name is the one used.
- Configuration `authorNewCategoryDefaults`, `chartTypeLabel` and the `availableChartTypes` keys are optional.
- Configuration `title`, `chartingOptions.mathMlOptions`, and `labelsPlaceholders` `settings`, `label` and `enabled`, are declared and not read.

## complex-rubric

- New model keys `visibleToStudent`, which the controller reads at the top level, and `extraCSSRules`.
- `rubrics.simpleRubric`, `rubrics.multiTraitRubric` and `rubrics.rubricless` are optional.
- The embedded models neither declare nor require `id` and `element`, and are open; legacy closes `simpleRubric` and `multiTraitRubric`.
- `rubrics.simpleRubric` and `rubrics.rubricless` take the rubric model changes, and `rubrics.multiTraitRubric` the multi-trait-rubric ones. `rubrics.rubricless` gains every rubric model key and no longer requires `rubriclessInstructionEnabled`.
- The configuration root is closed; legacy leaves it open.
- Configuration `simpleRubric`, `multiTraitRubric` and `rubricless` are optional. `rubricOptions` items narrow to `simpleRubric`, `multiTraitRubric` or `rubricless`, defaulting to all three.
- New configuration key `contentDimensions`.
- Configuration `multiTraitRubric` is open, where legacy closes it, and no longer requires `width`.
- Configuration `rubricless.rubricless` and `rubricless.rubriclessInstruction` are optional, and `rubricless.rubricless` is a plain boolean where legacy declares `enum: [true]`. `rubricless` gains `baseInputConfiguration`.
- Configuration `simpleRubric.width` and `rubricless.width` are not read.
- The nested configurations take the rubric and multi-trait-rubric configuration changes.
- The session declares only `id` and `element`: complex-rubric writes nothing into it.

## drag-in-the-blank

- Model `required` is `id`, `element`, `choices`, `correctResponse` and `markup`; legacy also requires `lockChoiceOrder`, `rationale` and `rubric`.
- `choices` items are `{ id, value }`, both required, where legacy declares `{ value, label, correct }`: ng reads neither `label` nor `correct`, and a response area stores the choice `id`.
- `correctResponse` accepts any string key; legacy allows digits only.
- `alternateResponses` also accepts an object keyed by response-area index, the shape ng demos carry. Legacy declares only an array of arrays.
- `choicesPosition` defaults to `below`, and `duplicates` to `true`.
- New model keys ng reads: `partialScoring`, `extraCSSRules`, and `slateMarkup`, the authoring editor's markup from which the author derives `markup`.
- Model `studentInstructions`, `studentInstructionsEnabled` and `rubric` are declared and not read, as are `disabled` and `mode`, which default models carry and the controller sets from the environment.
- New configuration keys ng reads: the settings-panel toggles `choicesPosition`, `lockChoiceOrder` and `partialScoring`, and `maxImageWidth.choice` and `maxImageHeight.choice`.
- Configuration `minChoices` defaults to 2.
- Configuration `choices`, `studentInstructions` and `rubric` are declared for legacy compatibility and not read.

## drawing-response

- `imageDimensions` is an object `{ width, height }`; legacy declares an array.
- Model `required` is `id` and `element`; legacy also requires `imageDimensions` and `backgroundImageEnabled`.
- New model key `extraCSSRules`.
- Model `studentInstructions` and `studentInstructionsEnabled` are declared and not read.
- Configuration `partialScoring`, `studentInstructions` and `backgroundImage.enabled` are declared and not read.
- The session holds `drawables`, `texts` and `width`.

## ebsr

- Model `required` no longer includes `partLabels` and `partLabelType`.
- `partA` and `partB` are multiple-choice models: they require only `choices` and take every multiple-choice model change, `choicePrefix` `none` included.
- New model keys `language` and `extraCSSRules`.
- `partLabels` defaults to `true`, the controller default; the author's default model sets `false`.
- Configuration `required` no longer includes `partA` and `partB`, and each part configuration is the full multiple-choice configuration.
- New configuration keys `baseInputConfiguration`, `language` and `languageChoices`.

## explicit-constructed-response

- Model `required` is `id`, `element`, `choices` and `markup`; legacy also requires `autoScoring`, `displayType`, `playerSpellCheckEnabled`, `rationale` and `rubric`.
- `choices` accepts any string key; legacy allows digits only.
- In evaluate mode the controller reads two new feedback keys: per-choice `feedback` (`{ type?: 'none' | 'default' | 'custom', value? }`) and the model's `defaultFeedback` (`{ correct?, incorrect? }`).
- `displayType` defaults to `block`, `spellCheckEnabled` to `true` and `playerSpellCheckEnabled` to `false`.
- New model keys ng reads: `maxLengthPerChoiceEnabled` (default `true`), `partialScoring`, `responseAreaInputConfiguration` (copied from the configuration), `extraCSSRules` and `slateMarkup`.
- Model `autoScoring`, `rubric`, `studentInstructions`, `studentInstructionsEnabled` and `spanishInputEnabled` are declared and not read; `spanishInputEnabled` loses its legacy default `true`. `disabled` is declared and not read: the controller sets it from the environment.
- New configuration keys ng reads: the settings-panel toggles `partialScoring` and `spanishButton`; `editSource`, a toggle whose `enabled` nothing reads; and `responseAreaInputConfiguration` (`{ settings?, label?, inputConfiguration? }`).
- Configuration `playerSpellCheck.enabled` is declared and not read.
- Configuration `choices`, `autoScoring`, `studentInstructions`, `rubric`, `alternates` and `spanishInput` are declared for legacy compatibility and not read.

## extended-text-entry

- Model `required` is `id` and `element`; legacy also requires `dimensions` and `playerSpellCheckDisabled`.
- New model keys `customKeys`, `extraCSSRules`, `language` and `playerPasteFormattingDisabled` (default `false`). `rationale` is declared and not read.
- `dimensions.width` and `dimensions.height` accept numbers as well as strings.
- `equationEditor` adds `non-negative-integers`, `integers`, `decimals`, `fractions` and `item-authoring`, and defaults to `Grade 8 - HS`.
- `feedback.type` adds `custom`, with the new `feedback.custom`.
- New defaults: `annotationsEnabled` and `feedbackEnabled` `false`; `playerSpellCheckDisabled`, `promptEnabled`, `rationaleEnabled`, `studentInstructionsEnabled` and `teacherInstructionsEnabled` `true`. The `playersToolbarPosition` default is corrected.
- Model `multiple`, `studentInstructions` and `rationaleEnabled` are declared and not read.
- New configuration keys `feedback` and `playerPasteFormatting`.
- Configuration `equationEditor` gains `enabled`, which is read; `mathInput`, `playerSpellCheck`, `spanishInput` and `specialInput` gain `enabled`, which is not. The author writes `multiple.enabled`, and nothing reads it.

## fraction-model

- Model `required` is `id` and `element`; legacy also requires `correctResponse`, `title` and `prompt`.
- `correctResponse` defaults to `[]`, and `title` and `prompt` to `""`.
- New model keys `spellCheckEnabled`, `extraCSSRules` and `toolbarEditorPosition` (`bottom` or `top`).
- Configuration `title` and `prompt` gain `enabled`; their `settings` and `enabled` are declared and not read.
- Configuration `modelOptions.maxOfModel.default` and `modelOptions.partsPerModel.default` are declared and not read.
- Configuration `modelTypeChoices[].value` narrows from a string to `bar` or `pie`.
- Configuration `settingsPanelDisabled` and `feedback` are declared and not read.
- The session's `answers.response` is a required array of `{ id, value }`; `answers.noOfModel` and `answers.partsPerModel` are each a number or `''`.

## graphing

- Model `required` is `id`, `element` and `answers`.
- `answers.alternate1` is optional, and alternates take any key.
- Mark `type`, `defaultTool`, `toolbarTools` and `availableTools` gain `absolute` and `exponential`. `defaultTool` also accepts `''`, and `availableTools` is an array of the tool enum where legacy declares `string[]`.
- The mark and tool arrays drop `minItems: 1`.
- Mark `building` is optional, marks gain `middle`, and mark points may carry `label`.
- `defaultGridConfiguration` is a number, an index into `gridConfigurations` (minimum 0, default 0); legacy declares an object.
- `arrows` also accepts the boolean older models carry.
- `labels` keys are optional, and graph settings `padding` is an optional number.
- New model key `extraCSSRules`.
- Model `label`, `padding` and `studentInstructions`, and mark `showLabel`, are declared and not read.
- Configuration `gridConfigurations` is optional.
- New configuration keys `instruction`, `removeIncompleteTool` (default `false`) and `contentDimensions`.

## graphing-solution-set

- Model `required` is `id`, `element` and `answers`; legacy also requires `defaultGridConfiguration`, `domain`, `graph`, `gssLineData` and `range`.
- Answers may carry alternates under any key alongside `correctAnswer`.
- Mark `type` gains `polygon`, and mark `building` is optional.
- New mark keys `fill` (`Solid` or `Dashed`), `points`, `closed`, `isSolution` and `middle`; mark points may carry `label`. Mark `x`, `y`, `label` and `showLabel` are declared and not read.
- `marks` is an array; legacy declares a tuple of at least one.
- `defaultGridConfiguration` is a number (minimum 0, default 0); legacy declares an object.
- `arrows` also accepts a boolean.
- `scoringType` gains `partial scoring`.
- `labels` keys are optional, and graph settings `padding` is an optional number.
- `gssLineData.sections` is an optional `Point[][]`, where legacy declares a tuple of at least one point. `gssLineData.lineB` is optional, and `gssLineData.selectedTool` is `lineA`, `lineB` or `solutionSet`.
- New model key `extraCSSRules`.
- Model `label` (the author copies it from the grid configuration), `marks` (the defaults carry it), `padding` (the author's padding toggle writes it) and `studentInstructions` are declared and not read.
- Configuration `gridConfigurations` is optional, as are a grid configuration's `domain`, `graph` and `range`.
- New configuration keys `instruction` and `contentDimensions`.
- Configuration `arrows` `left`, `right`, `up` and `down` are `ConfigureProp`, which adds `settings`.

## hotspot

- `dimensions` is an object `{ width, height }`; legacy declares an array of them.
- Model `required` is `id`, `element` and `shapes`; legacy also requires `dimensions`, `multipleCorrect`, `partialScoring` and `strokeWidth`.
- `shapes.circles` is new, and `shapes.rectangles` and `shapes.polygons` are optional. Every shape requires `id` and gains `index`.
- New shape keys `ariaLabel`, `aria_label` and `aria-label` (the first non-blank one is read): plain text that screen readers announce after the shape's "Hotspot {index} of {total}" name. An absent or blank label keeps the name alone.
- New model keys `teacherInstructions` and `extraCSSRules`. `rationale` and `teacherInstructions` accept `null`.
- `hoverOutlineColor` defaults to `black`, and `strokeWidth` to 5.
- Model `studentInstructionsEnabled`, `disabled` and `mode` are declared and not read; the controller sets `disabled` and `mode` from the environment.
- Configuration `minShapes` defaults to 2, and `preserveAspectRatio` gains `enabled`.
- The session holds `answers`, `selector`, `audioStartTime`, `audioEndTime` and `waitTime`.

## image-cloze-association

- Model `required` is `id` and `element`.
- `validation.validResponse.value` and `validation.altResponses[].value` are arrays of `{ images }`, one per response container; legacy declares one `{ images }` object.
- `uiStyle.fontsize` is optional and not read; legacy requires it.
- `uiStyle.possibilityListPosition` defaults to `bottom` and accepts `below`, which imported content carries and which renders as `bottom`.
- New model keys `teacherInstructions`, `rationale`, `lockChoiceOrder` and `extraCSSRules`. `rationaleEnabled` and `studentInstructionsEnabled` are declared and not read.
- New response container key `responseContainers[].ariaLabel`: plain text that names the container for screen readers in place of "Response area {index} of {total}". A blank label keeps that name.
- The model accepts the snake-case keys imported content carries, which the controller camelizes: `possible_responses`, `response_containers` (`aria_label`), `ui_style` (`possibility_list_position`, `fontsize`), `duplicate_responses`, `max_response_per_zone` (default 1), `validation.valid_response` and `validation.alt_responses`.
- Model `published`, `shuffle_options`, `response_container`, `metadata`, `is_math`, `response_id` and `metadatadistractor_rationale` are declared and not read: imported content and the demo models carry them. `shuffle` controls shuffling.
- New configuration key `mathMlOptions`.

## inline-dropdown

- Model `required` is `id`, `element`, `choices` and `markup`; legacy also requires `alternateResponses`, `displayType`, `lockChoiceOrder`, `partialScoring`, `rationale` and `scoringType`.
- `choices` accepts any string key; legacy allows digits only.
- Alternates are in `alternateResponse`, the key ng's controller reads, as legacy's does. Legacy's schema declares `alternateResponses`, which stays declared and not read.
- `displayType` defaults to `block`.
- New model keys ng reads: `slateMarkup` and `extraCSSRules`.
- Model `scoringType`, `studentInstructions`, `studentInstructionsEnabled` and `shuffle` are declared and not read (`lockChoiceOrder` controls shuffling), as are `disabled` and `mode`, which the controller sets from the environment.
- New configuration key `toolbarEditorPosition`, declared and not read.
- Configuration `responseAreaInputConfiguration` is `{ settings?, label?, inputConfiguration? }`: legacy declares the editable-html plugin map at its root, and ng reads the map from `inputConfiguration`.
- Configuration `choices`, `scoringType` and `studentInstructions` are declared for legacy compatibility and not read.
- The session holds `value`, mapping response-area key to choice value, and `shuffledValues`, a per-area map or the array older sessions carry.

## likert

- Model `required` is `id`, `element` and `choices`.
- `choices[].value` accepts a number as well as legacy's string; the author converts it to a number on load. The session's `value` takes the selected choice's value.
- New model keys `prompt` (default `""`), `teacherInstructions` (default `""`), `scoringType` (`auto` or `rubric`), `language` and `extraCSSRules`. `promptEnabled` is declared and not read.
- New defaults: `likertScale` `likert3`, `likertType` `agreement`, `likertOrientation` `horizontal`, `teacherInstructionsEnabled` `true`.
- New configuration key `scoringType`.
- Configuration `prompt.settings` is not read, and `likertChoice` reads only `inputConfiguration`.

## match

- Model `required` is `id`, `element`, `rows` and `headers`; legacy also requires `layout`, `prompt` and `rationale`.
- New model key `extraCSSRules`.
- Model `enableImages` is deprecated, read only when the configuration sets no `rows.inputConfiguration`. Model `config` is deprecated: the delivery merges it over the model.
- Model `studentInstructions` is declared and not read.
- `rows[].id` is a string or a number, and the session's `shuffledValues` follows it.
- Feedback levels are optional, each one `{ type, default?, custom? }` as in categorize.
- Configuration `width` is optional, and `feedback.enabled` is declared and not read.

## match-list

- Model `required` no longer includes `prompts` and `answers`: the controller's default model nests them under `config`.
- New model keys the controller reads: `partialScoring` (absent counts as enabled), `feedback` and `rationale`.
- Model `config` (`answers`, `prompt`, `prompts`, `shuffled`) is declared and not read; the controller defaults nest their values under it.
- No configuration schema: the element has no author.
- The session holds `value`, the answer id keyed by prompt id, and `shuffledValues` (`prompts`, `answers`).

## math-inline

- Model `required` is `id` and `element`; legacy also requires `allowTrailingZerosDefault`, `expression`, `ignoreOrderDefault` and `responses`.
- `responses[]` `validation`, `ignoreOrder`, `allowTrailingZeros` and `alternates` are optional, and `alternates` is a string map keyed by alternate id.
- Feedback levels `correct`, `incorrect` and `partial` are each one object `{ type: 'default' | 'custom' | 'none', default?, custom? }` in place of legacy's per-type union.
- `equationEditor` adds the string forms `"1"`, `"3"`, `"6"` and `"8"`, and defaults to `"8"`; legacy's default is the malformed `"- item-authoring"`.
- New model keys `promptEquationEditor` (default `"8"`), `validationDefault` (default `literal`) and `extraCSSRules`.
- `responseType` defaults to `Advanced Multi`, and `ignoreOrderDefault` and `allowTrailingZerosDefault` to `false`, replacing legacy's malformed defaults. Per-response `validation`, `ignoreOrder` and `allowTrailingZeros` drop legacy's "is …" defaults.
- Model `defaultResponse`, `partialScoring` and `studentInstructions` are declared and not read.
- Model `ignoreOrder` and `allowTrailingZeros` are `{ enabled? }` toggles, declared and not read: the settings panel writes them, and the response editor reads the configuration's.
- Model `config` is declared and not read: `createDefaultModel()` nests the model under it.
- New configuration key `feedback`.

## math-templated

- Model `required` is `id` and `element`.
- `responses` is an object keyed by response-area index; legacy declares an array.
- A response's `id`, `validation`, `ignoreOrder`, `allowTrailingZeros` and `alternates` are optional, `alternates` is a string map, and legacy's malformed response defaults are gone.
- Response `allowSpaces` is declared and not read: the authoring view writes it.
- `equationEditor` adds `"1"`, `"3"`, `"6"` and `"8"`, and defaults to `"8"`.
- `validationDefault` defaults to `literal`, and `ignoreOrderDefault` and `allowTrailingZerosDefault` to `false`, replacing legacy's malformed defaults.
- New model keys `slateMarkup`, `teacherInstructions`, `partialScoring`, `customKeys`, `note`, `language` and `extraCSSRules`.
- Model `playerSpellCheckEnabled`, `scoringType` (`auto` or `rubric`), `feedbackEnabled` and `studentInstructionsEnabled` are declared and not read; the demo-app samples carry the last three.
- Configuration `editSource` and `playerSpellCheck` gain `enabled`, which is not read.
- Configuration `rationale` gains `inputConfiguration` and `required`.
- Configuration `prompt.inputConfiguration` is not read.
- New configuration keys `settingsPanelDisabled` and `contentDimensions`.

## matrix

Legacy publishes an empty `pie-schema.json`, so these changes compare against the legacy `MatrixPie` interface.

- `matrixValue: Object[]` is renamed `matrixValues: Record<string, number>`, keyed `<row>-<column>` with 0-based indices. A cell without a value scores 0.
- `labelType` gains `custom`, which the author sets when the row or column count changes.
- New model keys `prompt`, `teacherInstructions`, `scoringType`, `language` and `extraCSSRules`. `promptEnabled` is declared and not read: the prompt always shows.
- New configuration key `scoringType`.
- The session holds `value: Record<string, number>`.

## mc-populated-blank

No legacy counterpart; the element is ng-only.

## multi-trait-rubric

- New model keys `maxPointsEnabled` (default `true`), `addScaleEnabled` (default `true`), `animationsDisabled`, `arrowsDisabled`, `language` and `extraCSSRules`.
- New defaults: `halfScoring`, `description`, `standards` and `excludeZero` `false`; `pointLabels`, `visibleToStudent` and `spellCheckEnabled` `true`.
- Configuration `width` is optional.
- New configuration keys `addScale`, `showMaxPoint`, `showStandards`, `showLevelTagInput`, `dragAndDrop` and `contentDimensions`.
- Configuration `excludeZeroDialogBoxContent`, `includeZeroDialogBoxContent`, `deleteScaleDialogBoxContent` and `maxPointsDialogBoxContent` are declared and not read.
- Configuration `expandedInput` and `labelInput` read only `inputConfiguration`.
- New configuration defaults: `minNoOfTraits` and `minNoOfScales` 1, `maxNoOfTraits` and `maxNoOfScales` 10, `defaultTraitLabel` `Trait`, `maxMaxPoints` 10.

## multiple-choice

- Model `required` is `id`, `element` and `choices`.
- `choicePrefix` accepts `none`, which the delivery renders as no key; the authoring control offers only `letters` and `numbers`.
- New model keys ng reads: `extraCSSRules`, `keyboardEventsEnabled`, `defaultFeedback`. Root `rationale` is declared because default models carry it; the element reads only per-choice rationales.
- `verticalMode` and `limitChoicesNumber` are declared and deprecated: ng still reads both.
- Configuration `answerChoiceCount` defaults to 0 with minimum 0; legacy documents a default of 4 and minimum 1.
- Configuration `spellCheck.enabled` sets the spellcheck default for new items.
- Configuration `toolbarEditorPosition` is declared but not read; the model's `toolbarEditorPosition` sets the position.
- Configuration `accessibility` is declared for legacy compatibility and not read.

## number-line

- Model `required` is `id` and `element`; legacy also requires `correctResponse`, `graph` and `partialScoring`.
- `graph.tick` is renamed `ticks`, and `graph.widthEnabled` moves to the model root as `widthEnabled`.
- `graph` requires only `width`, `domain` and `ticks`; legacy requires every key, `arrows`, `maxNumberOfPoints`, `exhibitOnly`, `initialType`, `availableTypes`, `initialElements` and `labelStep` among them. `availableTypes` keys are optional.
- `ticks` requires only `minor` and `major`, and `tickIntervalType` is `Integer`, `Fraction` or `Decimal` where legacy declares a string.
- New `graph` keys `height` and `fraction`, and new model keys `teacherInstructions`, `titleEnabled` and `extraCSSRules`. `colorContrast` is declared and not read: `createDefaultModel()` writes it.
- `correctResponse` and `graph.initialElements` are arrays; legacy declares objects with numeric pattern properties.
- Each response's `type` is tied to its shape: point, line or ray.
- Feedback `correct` and `incorrect` are optional, each one `{ type: 'custom' | 'default' | 'none', default?, custom? }`; a `custom` level no longer requires `custom`.
- Configuration `title` gains `enabled`.
- Configuration `numberLineDimensions` keys are optional, with `min` defaulting to 200 and `max` to 800; its `settings`, `label` and `enabled` are declared and not read.
- Configuration `maxMaxElements` defaults to 20.
- Configuration `availableTools` is an array of the response types (`PF`, `LFF`, `LEF`, `LFE`, `LEE`, `RFN`, `RFP`, `REN`, `REP`); legacy declares `string[]`.

## passage

- Model `required` is `id`, `element` and `passages`.
- New model keys `extraCSSRules` and `language`.
- New defaults: `authorEnabled` `false`; `subtitleEnabled`, `teacherInstructionsEnabled`, `textEnabled` and `titleEnabled` `true`.
- `passages[]` no longer requires `text` and `title`; a passage without a title is labelled "Passage <n>".
- Each passage gains `authorEnabled`, `subtitleEnabled`, `teacherInstructionsEnabled`, `textEnabled` and `titleEnabled`, which override the model-level flags.
- New configuration keys `author`, `subtitle`, `text` and `title`, and `maxImageWidth` and `maxImageHeight` gain `text`.
- The session declares only `id` and `element`.

## placement-ordering

- Model `required` is `id`, `element` and `choices`; legacy also requires `alternateResponses`.
- `correctResponse` entries may be a bare choice-id string as well as `{ id, weight? }`.
- `alternateResponses` entries may also be a bare `string[]`, which is deprecated.
- Feedback `correct` and `incorrect` are optional, each one `{ type: 'default' | 'custom' | 'none', default?, custom? }`; legacy requires `custom` when `type` is `custom`.
- `orientation` defaults to `vertical`.
- New model key `extraCSSRules`.
- Model `lockChoiceOrder`, `studentInstructions` and `studentInstructionsEnabled` are declared and not read.
- New configuration key `prompt.required`, which `validate` reads.
- Configuration `feedback.enabled` and `lockChoiceOrder` are declared and not read.
- The session's `value` holds the choice ids in placed order; with a placement area, an empty target is `null`.

## rubric

- New model key `excludeZero` (default `false`); legacy's `excludeZeros` stays declared and is not read.
- New model keys `excludeZeroEnabled` (default `true`), `maxPointsEnabled` (default `true`), `rubriclessInstruction`, `rubriclessInstructionEnabled`, `animationsDisabled`, `language` and `extraCSSRules`.
- `points[]` items are strings, defaulting to `["", "", "", ""]`, and `sampleAnswers[]` items a string or `null`, defaulting to `[null, null, null, null]`; legacy declares both as objects.
- `maxPoints` defaults to 3.
- The configuration root is closed; legacy leaves it open.
- New configuration keys `rubricless` and `rubriclessInstruction`, and `maxMaxPoints` defaults to 9.

## select-text

- Model `required` is `id`, `element`, `text` and `tokens`; legacy also requires `prompt`.
- New model key `extraCSSRules`.
- `mode` adds `words`, `paragraphs` and `''` to legacy's `word` and `paragraph`, and defaults to `sentence`.
- Tokens gain `oldStart` and `oldEnd`.
- New defaults: `feedbackEnabled` `false`, `maxSelections` 0, `scoringType` `auto`; `promptEnabled`, `rationaleEnabled`, `studentInstructionsEnabled` and `teacherInstructionsEnabled` `true`.
- Each feedback entry is one object with optional `default` and `custom`; legacy requires `custom`.
- Model `studentInstructions` is declared and not read.
- New configuration key `correctAnswer`, and `minTokens` defaults to 2.

## simple-cloze

No legacy counterpart; the element is ng-only.

## venn-classification

No legacy counterpart; the element is ng-only.

## video-stimulus

No legacy counterpart; the element is ng-only.
