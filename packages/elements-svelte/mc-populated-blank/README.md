# @pie-element/mc-populated-blank

Svelte 5 PIE element where the learner picks a **multiple-choice** option and that choice **fills a blank** in a sentence/template.

This element is the PIE counterpart for Star Learnosity CQT "populated blank" interactions. The CQT family had several published `custom_type` flavors, but they are all variants of the same base interaction:

- one selected choice
- one correctness key
- selected choice rendered into a blank target
- optional audio/transcript support

## What the original CQT flavors mean

The historical Learnosity CQT names mostly describe layout/stimulus differences, not different scoring logic:

- `sel_vic`: sentence-style vocabulary in context, with audio/transcript support
- `sr-vic`: sentence-style vocabulary in context, typically no audio button
- `sel_r1-g_plusggg`: lead token before blank (`before_cloze_1`) plus choice set
- `sel_r1-_gplusggg`: blank with a shorter/token-focused stem arrangement
- `sel_r1-_plusggg`: audio + choices only (no blank; modeled as audio-only mode)
- `sel_r1-gg_plusggg`: token-sequence variant with larger glyph-like tokens
- `sel_r1-_ggplusggg`: blank appears before trailing tokens (`after_cloze_*`)
- `sel_r1-s3_plusggg`: stimulus-heavy variant (often image/sentence block + blank + choices)

The shared behavior across these flavors is now represented by one element with configuration, instead of one element per flavor.

## Flavor to model mapping (quick defaults)

Use this as a practical starting point when mapping Learnosity CQT payloads into `mc-populated-blank` models.

| Learnosity `custom_type` | Typical layout meaning | Suggested `interactionMode` | Suggested `choiceMode` | Template hint |
| --- | --- | --- | --- | --- |
| `sel_vic` | sentence cloze with audio/transcript | `populate_blank` | `text` | `<p>{before} {{blank}} {after}</p>` |
| `sr-vic` | sentence cloze without listen button | `populate_blank` | `text` | `<p>{before} {{blank}} {after}</p>` |
| `sel_r1-g_plusggg` | lead token before blank | `populate_blank` | `text` | `<p>{before_cloze_1} {{blank}}</p>` |
| `sel_r1-_gplusggg` | short stem + blank | `populate_blank` | `text` | `<p>{before/after segments around {{blank}}}</p>` |
| `sel_r1-_plusggg` | audio + choices only (no blank) | `audio_mc_only` | `text` | no blank token in template |
| `sel_r1-gg_plusggg` | token-sequence style before blank | `populate_blank` | `text` | `<p>{before_1}{before_2} {{blank}}</p>` |
| `sel_r1-_ggplusggg` | blank before trailing tokens | `populate_blank` | `text` | `<p>{{blank}} {after_1}{after_2}</p>` |
| `sel_r1-s3_plusggg` | stimulus-heavy/image-first variant | `populate_blank` | `text` or `image` | include stimulus in `prompt`/`sentenceHtml`; keep single blank in `template` |

Notes:

- `choiceMode` should be `image` only when distractors are image choices; otherwise use `text`.
- Current model contract is single-blank for `populate_blank`; dual-cloze source shapes are normalized to one `{{blank}}`.
- `correctChoiceId` should always map from Learnosity `valid_response.name` (`distractor_n` -> `cN`).
- Layout defaults are tuned from original CQT visual baselines, but they are not fixed: override through `model.layoutLimits` when host/theme requirements differ.

## Authoring model

- **`prompt`** (optional) and **`promptEnabled`**
- **`template`**: HTML string containing exactly one literal `{{blank}}` token
- **`interactionMode`**: `populate_blank` | `audio_mc_only`
- **`choiceMode`**: `text` | `image`
- **`choices`**: `{ id, labelHtml? }` or `{ id, imageUrl, imageAlt }` per mode
- **`correctChoiceId`**
- **`hasAudio`**, **`audioUrl`**, **`audioTranscript`** (`audioUrl` required when `hasAudio=true`)
- **`autoplayAudioEnabled`**, **`completeAudioEnabled`** (optional integration flags)
- **`layoutLimits`** (optional): numeric visual constraints; defaults are based on current CQT parity behavior and can be overridden per item
- **`layoutProfilePresets`** (optional): named preset map by `layoutProfile`; use profile as a template and override with `layoutLimits`
- **`audioButtonSkin`** / **`audioButtonSkinsByLocale`** (optional): override listen-button skin URLs
- **`uiText`** (optional): override labels/messages (show/hide correct, answer choices, autoplay prompt, transcript label, missing-audio message)

### `layoutLimits` keys (all optional, positive numbers)

- `blankStandaloneWidthRem`
- `blankWideWidthRem`
- `blankUnderlineWidthPx`
- `blankUnderlineWideWidthPx`
- `horizontalChoiceWidthPx`
- `horizontalChoiceWidthVw`
- `horizontalChoiceTileMinHeightRem`
- `horizontalChoiceContentMinHeightRem`
- `selectedImageMaxHeightRem`
- `choiceImageMaxHeightRem`
- `listenButtonSizePx`
- `stimulusMinColumnPx`
- `textMinColumnPx`
- `legendMaxChars`
- `choiceGroupGapRem`
- `choiceRowGapRem`
- `toggleButtonGapRem`
- `horizontalChoiceRadioTopMarginRem`
- `audioBlankTemplateMarginTopRem`
- `audioBlankTemplateMarginBottomRem`
- `stimulusGridColumnGapRem`
- `stimulusGridRowGapRem`
- `stimulusSentenceMarginTopRem`
- `stimulusChoicesMarginTopRem`
- `tokenGridColumnGapRem`
- `tokenGridRowGapRem`
- `tokenTemplateMarginTopRem`
- `tokenInlineTokenGapRem`
- `tokenChoicesMarginTopRem`
- `inlineGridColumnGapRem`
- `inlineGridRowGapRem`
- `inlineTemplateMarginTopRem`
- `inlineChoicesMarginTopRem`

## Session

- **`choiceId`**: selected choice id

## Implementation hints

- **Controller invariants:** in `populate_blank`, template must contain exactly one `{{blank}}`; in `audio_mc_only`, template must not contain `{{blank}}`.
- **Choice normalization:** choices are polymorphic by `choiceMode` (text via `labelHtml`, image via `imageUrl`/`imageAlt`).
- **Delivery rendering:** template is split around `{{blank}}`; selected choice content is rendered into the blank slot.
- **Layout limits are model-driven:** delivery reads `model.layoutLimits` (blank widths/underline widths, choice tile sizing, image max heights, listen button size, layout column minimums); defaults are CQT-informed but overrideable.
- **Evaluate mode behavior:** when evaluate/correct-answer mode is enabled, delivery can render `correctChoiceId` in the blank/choice state.
- **Audio error behavior:** no TTS fallback is used; when `hasAudio=true` and no playable `audioUrl` is provided, delivery shows an explicit error message (configurable via `uiText.audioResourceUnavailable`).
- **Print parity:** print view mirrors prompt/template/choice presentation with the same blank-token contract.

## Theming hooks (`pie-*` classes)

Delivery now exposes stable `pie-*` classes so hosts can theme this element with the same class-oriented approach used by other PIE elements.

- Root/container: `pie-element`, `pie-element-mc-populated-blank`, `pie-delivery-root`
- Prompt/audio/template: `pie-prompt`, `pie-audio-container`, `pie-audio-player`, `pie-audio-transcript`, `pie-template-line`, `pie-sentence-line`
- Blank display: `pie-blank-slot`, `pie-blank-slot-standalone`, `pie-blank-value`, `pie-blank-image`
- Choice group: `pie-choices-fieldset`, `pie-choices-legend`, `pie-choices`
- Choice rows/items: `pie-choice`, `pie-choice-horizontal`, `pie-choice-selected`, `pie-choice-label`, `pie-choice-image`
- Choice controls: `pie-choice-radio`, `pie-choice-radio-inline`, `pie-choice-radio-bottom`
- Evaluate/toggle feedback: `pie-toggle-correct-answer`, `pie-result-feedback`, `pie-choice-feedback-correct`, `pie-choice-feedback-incorrect`

## Builds

Same layout as `@pie-element/simple-cloze`: `delivery`, `controller`, `author`, `print`, plus IIFE bundle for script-tag loading.

```bash
bun run build
```

## Demos

- **element-demo:** `apps/element-demo` → `/mc-populated-blank/deliver` (sample configs under `src/lib/samples/mc-populated-blank.json`).
- **pie-players item-demos:** `mc-populated-blank-synthetic-demos.json` (generated from the same models as element-demo).

Architecture notes live in the **aces-archdocs** repo: `docs/projects/itembankviewer/learnosity-cqt-to-pie.md` (Star CQT → PIE alignment).
