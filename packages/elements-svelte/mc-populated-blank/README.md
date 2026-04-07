# @pie-element/mc-populated-blank

Svelte 5 PIE element: the learner picks a **multiple-choice** option and that choice **fills a blank** inside an HTML **template**.

## Authoring model

- **`prompt`** (optional) and **`promptEnabled`**
- **`template`**: HTML string containing exactly one literal `{{blank}}` token
- **`choiceMode`**: `text` | `image`
- **`choices`**: `{ id, labelHtml? }` or `{ id, imageUrl, imageAlt }` per mode
- **`correctChoiceId`**
- **`hasAudio`**, **`audioUrl`**, **`audioTranscript`** (optional)

## Session

- **`choiceId`**: selected choice id

## Builds

Same layout as `@pie-element/simple-cloze`: `delivery`, `controller`, `author`, `print`, plus IIFE bundle for script-tag loading.

```bash
bun run build
```

## Demos

- **element-demo:** `apps/element-demo` → `/mc-populated-blank/deliver` (sample configs under `src/lib/samples/mc-populated-blank.json`).
- **pie-players item-demos:** `mc-populated-blank-synthetic-demos.json` (generated from the same models as element-demo).

Architecture notes live in the **aces-archdocs** repo: `docs/projects/itembankviewer/learnosity-cqt-to-pie.md` (Star CQT → PIE alignment).
