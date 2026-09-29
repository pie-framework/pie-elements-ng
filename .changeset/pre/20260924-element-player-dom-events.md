---
"@pie-element/element-player": patch
---

`<pie-element-player>` dispatches its events from the player, bubbling and composed, so bubble-phase listeners on an ancestor or `document` receive each once, with `target` the player, retargeted to the shadow host when the player sits in a shadow root. Capture-phase listeners above the player also hear the element's own `session-changed`, ahead of the player's copy. A listener that throws no longer becomes `player-error` and the error view: the browser reports it as uncaught and the load completes. `once: true` is honoured, and a listener survives a disconnect and reconnect, can be removed before the player connects, and hears events when it was added before the element upgraded. A player detached mid-load emits nothing more from that load, including once it is re-attached.
