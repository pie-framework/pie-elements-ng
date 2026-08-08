---
  "@pie-element/shared-types": minor
---

Widen `AccessibilityCatalogCard` to carry sign-language cards (PIE-879)

`AccessibilityCatalogCard` is now a union discriminated on `catalog`, adding a
`sign-language` arm that carries a typed `SignLanguageCardPayload` — a `signLang`
adaptation language tag, a `MediaAssetRef` with multiple sources and MIME types,
and an optional `MediaFragment` time range. The previous flat `content: string`
could only hold a bare URL, which cannot express a signing video and left
malformed payloads indistinguishable from text.

Also adds `MediaAssetRef`, `MediaKind`, `MediaSource`, `MediaFragment`, and an
`isSignLanguageCard` narrowing guard.

Breaking for consumers that read `card.content` off a card without narrowing:
`content` is now addressable only on the text arm. No element in this repo reads
the field, so nothing here changes behaviour. Data model only — resolution,
rendering, and PNP gating live in pie-players.
