---
"@pie-element/shared-i18n": patch
---

Adds the interface-locale subscriber: `subscribeInterfaceLocale(element, onLocale)` resolves
`pie.interfaceLocale` — the composition context the item and section players answer from their
`locale` attribute — with the document-root retry, so an element mounted before its player's
provider connects is answered when it announces itself. With no player the callback never fires
and the caller keeps its fallback. The key is built with pie-context's own factory on the shared
`Symbol.for` registration; the constant becomes the package import when the pinned
`@pie-players/pie-context` ships `interfaceLocaleContext`.
