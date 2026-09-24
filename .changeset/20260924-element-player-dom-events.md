---
"@pie-element/element-player": patch
---

`<pie-element-player>` dispatches its events from the player, bubbling and composed, so listeners on an ancestor or `document` receive them with `target` the player. A listener that throws no longer becomes `player-error` and the error view: the browser reports it as uncaught and the load completes. `once: true` is honoured, and a listener survives a disconnect and reconnect, can be removed before the player connects, and hears events when it was added before the element upgraded.
