# @pie-element/shared-i18n

Interface strings for PIE elements and the libraries they render through: one typed catalog per
package, `en-US` resident in the bundle, every other locale loaded on demand, and one page-wide
registry that a host call reaches across every bundled copy of this engine.

The engine is a port of pie-players' `players-shared/src/i18n`. The two repositories share its
semantics (tag resolution, lookup order, plural handling, host messages) and no code.

`@pie-lib/translator` stays in place for every package not yet migrated;
[`docs/prds/interface-i18n/PRD.md`](../../../docs/prds/interface-i18n/PRD.md) has the design and
the migration order.

## Locale resolution

An element translates in the language its item declares in `model.language` (`en_US`, `es_ES`,
`es-MX`), and in `en-US` when the item declares none. That is `@pie-lib/translator`'s source, kept
so a migrated element renders as it did; the PRD moves interface strings to a locale the host
publishes, with `en-US` as the default. The browser locale is never consulted.

A tag resolves by RFC 4647 lookup, then by its primary subtag: `es_MX` reads `es-MX`, then `es`. A
tag nothing ships renders English key by key, unless a host registered messages for it.

Each key is looked up in order: host messages for the locale, the shipped catalog for the locale,
host messages for `en-US`, the shipped `en-US` catalog. A miss on all four returns the key.

## For a host

```ts
import { loadLocale, registerMessages } from '@pie-element/shared-i18n';

// Rename one label, or serve a locale no package ships.
registerMessages('@pie-lib/correct-answer-toggle', 'en-US', { showCorrectAnswer: 'Reveal answer' });
registerMessages('@pie-lib/correct-answer-toggle', 'fr-CA', { showCorrectAnswer: 'Afficher la réponse' });

// Optional: load a locale before mounting, so nothing renders while it loads.
await loadLocale('es-MX');
```

`registerMessages` applies to every copy of the package on the page and to copies evaluated later;
an element already rendered picks the messages up on its next render. A plural group replaces the
shipped group whole, so a host's wording never mixes with the shipped forms.

## For an element

The delivery element holds its first render until the locale is resident, then stamps its own host:

```ts
import { isLocaleReady, loadLocale, stampElementLanguage } from '@pie-element/shared-i18n';
import { catalogs } from '../i18n/index.js';

private _rerender() {
  const language = this._model?.language;
  if (!isLocaleReady(language)) {
    void loadLocale(language).then(() => this._rerender());
    return;
  }
  stampElementLanguage(this, language);
  // …render; `catalogs.forLocale(language).t('multipleChoiceQuestion')`
}
```

`isLocaleReady` and `loadLocale` cover every catalog set evaluated on the page, so one wait covers
the libraries the element renders through. `loadLocale` never rejects: a failed chunk is reported
once and renders English.

`stampElementLanguage` sets `lang` and `dir` on the element's host for a declared language and
removes both otherwise. The host wraps authored content, and content that declares no language
inherits the page's instead of being asserted English. It never writes `document.documentElement`.

## For a library component

A library component cannot assume the element rendering it waited for the locale: an element still
on `@pie-lib/translator` never calls `loadLocale`. It passes its re-render to `forLocale`, which
starts the load and calls back once:

```tsx
relabel = () => this.forceUpdate();

render() {
  const i18n = catalogs.forLocale(this.props.language, this.relabel);
  const showMessage = this.props.showMessage ?? i18n.t('showCorrectAnswer');
}
```

Under a migrated element the locale is already resident and the callback never runs. Under an
unmigrated one the component renders one English frame, then the locale. A label the caller passes
wins over the catalog.

## Catalogs

Each package keeps its strings in `src/i18n/`:

| File | Holds |
|---|---|
| `en-US.ts` | The source catalog, imported statically. Its shape types every key. |
| `<tag>.ts` | One file per shipped locale, `satisfies MessageCatalog`. |
| `index.ts` | `defineCatalogs({ packageName, source, loaders })`. |
| `catalog-manifest.json` | Each locale's status and provenance. |

```ts
export const catalogs = defineCatalogs({
  packageName: '@pie-element/multiple-choice',
  source: enUS,
  loaders: { es: () => import(/* webpackMode: "eager" */ './es.js') },
});
```

The `webpackMode: "eager"` comment survives the Vite build into `dist/i18n/index.js`. The browser
ESM build splits the locale into its own chunk; the webpack bundles built from npm, which load
chunks relative to the host page and cannot fetch one, inline it. The IIFE build drops every loader
(`tools/vite/iife-english-only-catalogs.ts`) and ships English; its host registers any other locale
with `registerMessages`.

A key missing from `en-US.ts` is a compile error. A key assembled at runtime from an id the catalog
cannot enumerate goes through `dynamicMessageKey(key)`.

Conventions:

- `{placeholder}` slots interpolate, with the same names in every locale. i18next's `{{name}}`
  renders literally and fails the gate.
- A plural group is an object of CLDR categories with `other` required. `Intl.PluralRules` selects,
  so a locale may carry forms English lacks (Arabic `few`, Polish `many`). Call `plural()`, never a
  `count === 1` branch.
- Keys ending `A11y` are for assistive technology only.
- Author whole phrases. Concatenating fragments, or lower-casing one, is an English-only transform.
- Developer diagnostics (`throw`, `console`) stay English and stay out of catalogs.

## Adding or changing a key

1. Add or change it in `en-US.ts`.
2. Add it to every locale file. A missing key falls back to English silently, so the gate fails it.
3. For a `reviewed` locale, translate the key, then move the anchor:
   `bun scripts/write-i18n-english-snapshot.mjs packages/<group>/<pkg>/src/i18n es`.

`bun run verify:i18n-catalogs`, part of `bun run lint`, checks every `src/i18n` directory: locale
file, loader and manifest entry present together; key parity both ways; leaf kind; `other` in every
plural group; placeholder parity per form; no `{{slot}}`.

Freshness follows the manifest status. `generated` is machine output nobody reviewed: it records the
hash of the English it came from, fails on any English change, and regenerates whole. `reviewed`
carries human work regeneration must not clobber: the manifest holds the English each key was
reviewed against, and only the keys whose English moved fail.

## Locales

| Tag | Status | Serves |
|---|---|---|
| `en-US` | source | every tag nothing else matches |
| `es` | reviewed, carried from `@pie-lib/translator` | every `es-*` tag; Latin American wording |

## Build artifacts

`tests/interface-i18n-artifacts.test.ts` holds each migrated element's built bundles to the
contract: English in the static graph of the browser delivery and print views and in the IIFE,
every other shipped locale outside that graph and absent from the IIFE, no i18next in either, and
every loader eager. A newly migrated element joins its `migratedElements` list.

## Module layout

| Module | Owns |
|---|---|
| `provider.ts` | `SimpleI18n`: lookup, interpolation, plurals, direction, formatting |
| `catalogs.ts` | `defineCatalogs`, the page registry, `isLocaleReady`, `loadLocale`, `registerMessages` |
| `language-tags.ts` | Tag normalization and RFC 4647 matching |
| `element-language.ts` | `lang` and `dir` for an element's host |
| `types.ts` | Catalog, key and translator types |
