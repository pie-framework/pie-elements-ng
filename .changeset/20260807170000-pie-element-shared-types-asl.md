---
  "@pie-element/shared-types": minor
---

Carry sign-language cards on `CatalogCard`, the shape pie-players canonicalises (PIE-879)

An accessibility catalog card is now a single `CatalogCard`: `catalog` (the QTI
`support=` token, and the only discriminant), optional `language`, and exactly
one of `content` — the string form, SSML for `spoken` — or `payload`, the
structured form for what a string cannot express. Adds
`SignLanguageCardPayload` (a `MediaAssetRef` with multiple sources and MIME
types, an optional `MediaFragmentRange`, and an optional `signLang`), the
`CatalogCardPayload` union, `MediaAssetRef`, `MediaKind`, `MediaSource`, and an
`isSignLanguageCard` narrowing guard.

A signing card's adaptation language belongs on the card's `language`. That is
the only field pie-players resolves a card on — resolution runs before anything
knows the card is a signing card, so it can only key on the generic field — and
the player falls back to it when the payload omits `signLang`. So `signLang` is
optional, and redundant on every card the Learnosity importer produces, which
emits `language` alone. It stays declared for the one shape where the two differ:
a card tagged with the item's content language, so resolution reaches it by the
default-language rung while the payload says what the clip is signed in.
`isSignLanguageCard` deliberately says nothing about it — it briefly required a
non-empty `signLang`, which would have rejected every imported card.

The previous flat `content: string` could only hold a bare URL, which cannot
express a signing video and left malformed payloads indistinguishable from
text.

This replaces the `SignLanguageCatalogCard | TextCatalogCard` union that was
staged here earlier, and with it the `signLanguage` payload key. pie-players
owns the card shape and canonicalises one generic `payload` slot interpreted by
`catalog`: QTI's `qti-card` has a single content slot that `@support` already
discriminates, and a field per accommodation makes every new structured
alternate — braille next — a breaking widening of the card type in every
consumer that reads cards. The divergence was not academic: pie-players
tolerated `signLanguage` as an input alias on its resolution path but not its
enumeration path, so a card authored against the old shape rendered its signing
video and was simultaneously reported as carrying no alternate.

`SignLanguageCatalogCard` survives as a narrowing of `CatalogCard` for the write
side, since an open-ended `catalog` vocabulary means the type cannot state "a
signing card must carry a payload".

Breaking for consumers that referenced `AccessibilityCatalogCard`,
`TextCatalogCard`, `MediaFragment`, or `card.signLanguage`: they are
`CatalogCard`, `CatalogCard`, `MediaFragmentRange`, and `card.payload`. No
element in this repo reads any of them, so nothing here changes behaviour. Data
model only — resolution, rendering, and PNP gating live in pie-players.
