# Interface i18n

Status: **Accepted** · Impl. path: Cross-cutting

## Context

Elements localize their own strings through `@pie-lib/translator`, an i18next singleton initialized at import with English and Spanish inlined. Every call passes `{ lng: model.language }`, so an element's chrome speaks whatever language its item declares. A hand-written switch maps six tag spellings to `en` and `es`; i18next resolves other lowercase Spanish tags, and `ES`, `Es-Mx` or `spa` render English. Every browser ESM, IIFE and Svelte bundle inlines its own i18next with both catalogs, 64 KB minified and 20 KB gzipped per element on the page, for a host that only ever shows English.

The data does not support keying chrome on the model. Across the four live PIE installations, one element on one installation declares `language`: about 90% of that installation's multiple-choice models carry it, and a tenth of all of them declare Spanish. Every other model sampled declares none, Spanish items included; their language lives in item search metadata the element never receives (about 1.7% of production items are tagged Spanish). No session, assignment, organization, user or PNP record carries a locale. So Spanish items render English chrome almost everywhere today, and the Spanish chrome that does render comes from a field that also describes content.

pie-players settled the same question for its own chrome: the interface locale is a deployment fact the player publishes as a [composition context](https://github.com/pie-framework/pie-players/blob/develop/docs/architecture/composition-context.md), `en-US` when nothing publishes, independent of content language ([internationalization](https://github.com/pie-framework/pie-players/blob/develop/docs/architecture/internationalization.md#interface-locale), [adoption record](https://github.com/pie-framework/pie-players/blob/develop/docs/architecture/i18n-interface-locale-adoption.md)). This PRD puts elements on that contract and ports its engine. [`notes/migration.md`](./notes/migration.md) has the rollout.

## Goals

- A host sets one interface locale on its player, and every migrated element and library renders its own strings in it. A host that sets none gets `en-US` throughout, so a learner sees chrome only in a language the host chose.
- A page that shows only English loads no i18next and no locale data beyond English.
- Each package owns its catalogs: a new locale or key touches and releases that package alone.
- A host can rename any string, or serve a locale no package ships, in every build shape, IIFE included, with no rebuild.
- An element marks its authored content with the language the item declares, and asserts nothing when the item declares none.

## Non-goals

- **Sharing code or catalogs with pie-players.** The engine is ported; the repositories release independently and share semantics.
- **A locale allow-list in elements.** The one published locale is the restriction: a district that allows only English publishes `en-US` or nothing, and no item can override it. Which locales a district may pick is host configuration.
- **Browser-locale detection.** It would switch a Dutch-configured laptop's assessment chrome to Dutch unasked.
- **Translating authored content.** Renaissance authors one item per locale. In-item alternates are pie-players' catalog cards.
- **Lazy loading inside IIFE.** A single file has no base URL for a chunk; IIFE ships English and reaches any other locale through message registration ([IIFE](#iife)).
- **Authoring UI.** `-config` bundles keep `@pie-lib/translator` at their one call site and their English labels; an authoring locale is a separate decision.

## Proposed surface

### Engine

`@pie-element/shared-i18n` (`packages/shared/i18n`) ports pie-players' `players-shared/src/i18n`:

- RFC 4647 lookup, then primary-subtag widening: `es_MX` reads `es-MX`, then `es`. Both stay within the request's script, the CLDR likely script for a bare tag: `zh-TW` reads `zh-TW`, `zh-Hant`, and never the Simplified `zh`.
- Per-key lookup: host messages for the locale, shipped catalog for the locale, host `en-US`, shipped `en-US`, the key itself.
- `{name}` interpolation; CLDR plural groups selected by `Intl.PluralRules`, `other` required; `localeDirection` from `Intl.Locale.textInfo`. A finite numeric value renders through `Intl.NumberFormat` for the resolved locale, so digits and grouping follow CLDR locale defaults (`ar-SA` renders Arabic-Indic digits; current CLDR resolves bare `ar` to Western digits).
- `catalogs.forLocale(tag)` returns a per-locale view over shared catalogs and host messages, pie-players' `withLocale`, so two players on one page can differ. A locale change re-renders; nothing reloads.

Catalog leaves carry `{name}` placeholders and structured plural groups, not Unicode MessageFormat 2.0 strings. Assessment chrome needs only arguments and plurals — none of the 500+ keys uses `select` or rich formatting — so the engine stays dependency-free, and the gate validates the structured shape mechanically. If MF2 semantics are ever needed, the leaf syntax moves behind the same gate; the keys, loaders, registry and fallback chain are format-agnostic.

It replaces i18next outright. `@pie-lib/translator` as a facade over the engine is the alternative; it keeps i18next and both full catalogs in every bundle until the last of 270 call sites in 37 packages moves, and those sites move a package at a time with their strings anyway. The translator stays untouched for unmigrated packages and is deprecated with its last dependent.

Every bundled copy of the engine shares one page registry at `Symbol.for('pie-element.i18n.registry')`, holding the catalog sets evaluated on the page and the host messages. `loadLocale(tag)` loads a locale into every set and never rejects; a failed chunk is reported once and renders English. `isLocaleReady(tag)` answers for every set. `registerMessages(package, tag, messages)` reaches copies evaluated later, and a host plural group replaces the shipped group whole.

### Interface locale

End-state precedence: the locale the player publishes, else `en-US`. `model.language` stops selecting chrome and describes content only ([lang and dir](#lang-and-dir)).

The channel is a composition context in `@pie-players/pie-context` at `Symbol.for('pie.interfaceLocale')`, published by the item and section players from their `locale` attribute. Elements already consume `sessionCommitContext` the same way for the idle-save delay (`packages/shared/player-events/src/idle-save-delay.ts`). The custom element subscribes in `connectedCallback`, re-renders on republish, and passes the locale into the `language` prop its libraries already take. Two alternatives lose:

- An `env` field: pie-players reserves `Env.locale` for content language, an input to filtering authored data.
- A custom-element attribute: the player would have to enumerate its elements, and a library nested inside one cannot see it.

While `@pie-lib/translator` has dependents, a migrated element resolves the published locale, else `model.language`, else `en-US`. Unmigrated elements can only follow `model.language`, and a migrated element ignoring it would split one Spanish item's chrome across two languages. Phase 1 has no publisher yet, so it follows `model.language` exactly as the translator does.

### Catalogs and loading

Each package keeps its strings in `src/i18n/`: `en-US.ts` (the source, whose shape types the keys), one file per shipped locale, `index.ts` calling `defineCatalogs({ packageName, source, loaders })`, and `catalog-manifest.json`. `en-US` is a static import; every other locale is a dynamic `import()` carrying a `webpackMode: "eager"` comment.

| Output shape | Non-default locales |
|---|---|
| Browser ESM (`dist/browser`), served by pie-players' `local-esm-cdn` | one chunk per locale, fetched on first use |
| React `./delivery`, built by the consumer | webpack inlines them through the eager comment, since a webpack bundle built from npm fetches chunks relative to the host page; other bundlers split them |
| IIFE | none; a host registers them ([IIFE](#iife)) |

An element holds its first render until the locale is resident: `_rerender` calls `loadLocale` while `isLocaleReady` is false, so no English frame precedes Spanish. A library rendered by an unmigrated element passes a re-render to `catalogs.forLocale(tag, onLoad)` and shows one English frame first. A deliberate trade: libraries migrate ahead of their elements, at the cost of that frame.

A string lives in the package that renders it. A phrase several elements pass into one library component moves into that component: the teacher-instructions and rationale toggle labels (48 key uses, all passed into `Collapsible`) and the alternates note (9). A shared common catalog is the alternative; nobody owns it, and changing one of its keys means auditing every element that renders it, as the translator's `common` namespace does today.

### IIFE

IIFE ships English only, and a host that needs another locale registers its messages with `registerMessages` before mounting. `tools/vite/iife-english-only-catalogs.ts` drops the loaders from every workspace catalog an IIFE build inlines, and fails the build on a loader it cannot strip. Every IIFE configuration runs it, so an unmigrated element's IIFE renders its migrated libraries in English.

No current content needs another locale there. No live installation serves elements from this repository through IIFE, and the installation whose models declare Spanish delivers them as single-select items in gather mode, where the multiple-choice it runs today renders no translated string to a learner. This repository's multiple-choice would translate one string on such an item, its region name, for assistive technology alone. Inlining every shipped locale is the alternative; it loads locale data on every English IIFE page, which the [goals](#goals) rule out, and no content today would use it.

- **Runtime injection** (chosen) works in every build shape and doubles as the host's custom-strings seam.
- **Per-locale IIFE artifacts** multiply the publish matrix by the locale count.
- **JSON over fetch** adds a serving contract IIFE hosts do not have.

PIE's delivery model already tiers packaging: browser ESM is the supported path, and IIFE is legacy packaging for hosts that cannot consume modules. The i18n contract follows that tiering deliberately: **locale coverage is not tiered, only its acquisition mechanism is.** Every build shape can render every shipped locale — browser ESM fetches per-locale chunks on first use, and an IIFE takes locale data at runtime through `registerMessages`, because a single file has no chunk base URL and inlining every shipped locale would cost every English IIFE page its bytes for a need no current content has. A host that needs a locale no package ships uses the same seam in both shapes.

`tests/interface-i18n-artifacts.test.ts` holds each migrated element's built output to the contract: English in the static import graph of the browser delivery and print entries and in the IIFE, every other locale outside that graph and absent from the IIFE, no i18next in either, and every loader in `dist/i18n/index.js` eager.

### Keys and gates

The source catalog types the keys: `forLocale(tag).t('showCorrectAnswer')` checks against `en-US.ts`, so a mistyped key fails to compile. A key built from runtime data goes through `dynamicMessageKey`.

`bun run verify:i18n-catalogs`, part of `bun run lint` and so of CI, checks every `src/i18n`: locale file, loader and manifest entry present together; key parity both ways; leaf kind; `other` in every plural group; placeholder parity per plural form; no i18next `{{slot}}`; freshness by manifest status. A `generated` locale records its source's hash and fails on any English change. A `reviewed` locale records the English each key was reviewed against and fails only the keys whose English moved.

The hardcoded-string scanner needs a TSX variant; pie-players' walks Svelte ASTs. It runs advisory, per migrated package, because about 25 learner-facing English literals sit in packages this work has not reached.

### lang and dir

An element stamps `lang` and `dir` on its own host for the language the item declares, canonicalized (`es_MX` → `es-MX`), and removes both when the item declares none or declares a non-tag such as `Spanish`. It never writes `document.documentElement`. Six elements stamp `lang="en"` on every undeclared item today, which on production is every item, Spanish ones included; pie-players' content-language slice cannot land until that default goes. The player half of that slice reflects the resolved content language on the content subtree.

Once chrome follows the published locale, each chrome root a library renders carries that locale's `lang` and `dir`, so a Spanish toggle label inside English content is announced in Spanish. In Phase 1 chrome follows the declared language and inherits the host's `lang`.

### React and Svelte

The engine has no framework dependency. React gets no context or hook: libraries already take `language` as a prop for their 63 call sites, the element is the one place the locale resolves, and a React provider would leave libraries rendered by unmigrated elements without one. The Svelte elements replace their `src/i18n.ts` shims with a `$derived` over `catalogs.forLocale(language, relabel)`.

### Default notes

categorize and placement-ordering rewrite `model.note` in `UNSAFE_componentWillReceiveProps` when it equals the previous language's translated default. Their controllers, and ECR's and math-inline's, write the translated default into the model when the note is absent. Both behaviours go as these elements migrate:

- The controller leaves `note` as authored.
- Delivery renders `model.note`, or the alternates default in the interface locale when the note is absent.
- A stored note equal to a shipped default, in any locale or in its unprefixed historical English form, counts as absent.

The third rule carries the risk. On production, 25–37% of sampled Spanish ECR models, and about half of the Spanish placement-ordering sample, store the English default sentence, which under `note || t()` renders English on Spanish items. No categorize model stores a note, so its swap guards nothing in the data.

### Releases

Each package releases its catalogs with a changeset; a new locale or key is a patch. The engine starts at 0.1.0 and needs a trusted publisher before its first publish. Dropping the `model.language` fallback changes what a Spanish item renders where nothing publishes a locale, and its changesets say so.

### Contracts touched

- **`@pie-players/pie-context`**: a new `interfaceLocaleContext`, a pie-players change.
- **Item and section players**: answer it from `locale`.
- **Element host**: `lang` and `dir` only for a declared language.
- **Host API**: `registerMessages` and `loadLocale` from `@pie-element/shared-i18n`.
- **Element model**: unchanged; `note` stays as authored.

### Migration story

Phase 1 ships the engine, the catalog gate, the artifact assertion, and `@pie-lib/render-ui`, `@pie-lib/correct-answer-toggle` and `@pie-element/multiple-choice`, which together render multiple-choice's whole chrome. Phase 2 adds the context. Elements then follow in usage order, each with the libraries it renders through.

## Worked example

> *Deployment*: a district delivers English lessons in pie-section-player with no `locale`. One item's multiple-choice model declares `es_ES`.

End state: the toggle reads "Show correct answer", because nothing publishes a locale. The element's host carries `lang="es-ES"` over the Spanish choices; the toggle's root carries `lang="en-US"`. When the district enables its Spanish program and sets `locale="es-MX"`, the player republishes; the element calls `loadLocale('es-MX')`, which fetches each package's `es` chunk once, and re-renders "Mostrar respuesta correcta" without a remount. A host needing French registers `fr-CA` messages for each package before mounting and publishes `fr-CA`.

In Phase 1, with no publisher, the toggle follows `es_ES` and reads "Mostrar respuesta correcta", as it does under the translator. From an IIFE it reads "Show correct answer" unless the host registers `es`.

## Accessibility

- **Language of page (3.1.1)**: the page owns `document.documentElement`; no element writes it.
- **Language of parts (3.1.2)**: content takes `lang` from the declaration alone; chrome roots carry the interface locale where it differs.
- **Direction**: `dir` comes from `Intl.Locale.textInfo`, with an RTL primary-subtag set as fallback, so RTL chrome lays out inside an LTR page.
- **Region names**: the strings an element gives assistive technology, such as multiple-choice's region name, are catalog keys and translate with the rest. Keys ending `A11y` are for assistive technology only.

## Open questions

- [ ] When the `model.language` fallback goes: with the translator's last dependent, or once the installation whose models declare Spanish publishes each assessment's locale, which its assessments already carry.
- [ ] Whether `@pie-lib/translator` honours the published locale during the transition, so a host's `en-US` pin also covers unmigrated elements. Its calls carry no host element, so it would need a page-wide value, which a composition context deliberately is not.
- [ ] Whether elements read content language from `Env.locale`, pie-players' planned slice 2, which decides whether an undeclared item ever gets a content `lang` from its element.

## Status log

- Proposal → Accepted. Phase 1 shipped in #475.
