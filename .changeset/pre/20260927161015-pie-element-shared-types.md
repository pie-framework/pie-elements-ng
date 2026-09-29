---
  "@pie-element/shared-types": minor
---

Breaking: remove `ModelSetEvent`, `SessionChangedEvent`, `ModelUpdatedEvent` and `isPieEvent`, which dispatched `pie.*` events that no player listens for. Import the event classes from `@pie-element/shared-player-events` and `@pie-element/shared-configure-events` instead.
