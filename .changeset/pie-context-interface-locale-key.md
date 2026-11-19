---
"@pie-element/shared-i18n": patch
"@pie-element/shared-player-events": patch
---

`interfaceLocaleContext` and `InterfaceLocaleContextValue` come from `@pie-players/pie-context` 1.0.0-beta.6, which now publishes them, in place of a local copy on the same `Symbol.for` key.
