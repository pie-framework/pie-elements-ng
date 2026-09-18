# @pie-element/shared-player-events

Canonical runtime event contract for PIE element/player communication.

## Delivery events

- `session-changed`
  - `detail.complete: boolean`
  - `detail.component: string`
  - Session data should be read from the element instance `.session`.
    Host players may enrich forwarded events with `detail.session`.
- `model-set`
  - `detail.complete: boolean`
  - `detail.component: string`
  - `detail.hasModel: boolean`
  - Used for model lifecycle readiness metadata, not model mutation payloads.

## Deferred notification

An element coalesces repeated session writes so a host backend is not driven at
input rate. A raw `debounce` drops the pending notification when the element is
torn down inside its own window, which loses the learner's last response with no
event a host could have detected.

`createSessionNotifier` registers each deferred notification against its host, so
one call commits everything the element owns whatever its internal structure:

```js
import {
  SessionChangedEvent,
  createSessionNotifier,
  flushSessionNotifiers,
} from '@pie-element/shared-player-events';

class MyElement extends HTMLElement {
  constructor() {
    super();
    this._notifier = createSessionNotifier(
      this,
      () => this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), isComplete(this._session))),
      { delayMs: 200 },
    );
  }

  valueChange(value) {
    this._session.value = value;   // synchronous
    this._notifier.notify();       // deferred
  }

  disconnectedCallback() {
    flushSessionNotifiers(this);
  }
}
```

The contract this supports: **session state is written synchronously on commit,
and only the dispatch is deferred.** Deferring the session write instead leaves
`.session` stale until the timer fires, so no other layer can read the committed
response.

`delayMs` accepts a function, for an element whose delay depends on its model.
`maxWaitMs` bounds how long repeated calls may postpone a dispatch. `flush()` is
a no-op when nothing is pending, so a teardown adds no event in the normal path.
`onDispatchError` receives a dispatch that throws during a flush; the throw is
contained either way, since a commit runs mid-unmount, and the default reports it
through `console.warn` so a lost response is not silent.

The helper also installs `commitPendingSession()` on the host. A player calls it
on each mounted element before discarding it, so the element dispatches its own
event — with its own `complete` semantics — while still attached and therefore
still able to reach a `document`-level listener. An element's own
`disconnectedCallback` runs after removal, where the event never gets that far.

The install is an own-property check: an element class that declares its own
`commitPendingSession` keeps it, and the installed method calls it before
flushing the notifiers. Yielding to it instead would let a player count the
element as committed while the pending dispatch was dropped. `dispose()` on the
last notifier removes the method again, because an element that still advertises
it but flushes nothing suppresses the player's synthesized fallback for good.

### Elements that do not defer

The `elements-svelte` packages (`mc-populated-blank`, `simple-cloze`,
`venn-classification`) dispatch `session-changed` synchronously on every change,
so nothing is ever pending and a commit seam has nothing to flush. They must
also not install `commitPendingSession()`: a player that finds the method counts
the element as having committed itself and never synthesizes an event from
`element.session`, which is the path that does cover them.

What those elements owe a player instead is that `element.session` carries the
response by the time the event is dispatched, written into the object the player
handed the element rather than a replacement reference — `writeSessionInPlace` in
`@pie-lib/delivery-events-svelte`.

## Notes

- Events bubble and are composed by default.
- The legacy `pie.*` events (`pie.model_set`, `pie.session_changed`,
  `pie.model_updated`, declared in `@pie-element/shared-types`) are
  compatibility-only and not the primary runtime interop contract.
