# Video stimulus — delivery

Delivery facet of [the video stimulus PRD](./PRD.md).

## Composition

Delivery is a Svelte 5 custom element exported from `@pie-element/video-stimulus/delivery`. It uses light DOM, exposes imperative Model properties, sets no custom-element tag, and leaves registration to PIE players.

The rendered order is:

1. labelled `<figure>` with visible or visually-hidden `<figcaption>`;
2. optional visible description;
3. transcript disclosure and labelled transcript region;
4. exactly one native `<video controls playsinline preload="metadata">`;
5. persistent media/track error and retry status.

Sources and tracks are real ordered `<source>` / `<track>` children. Delivery never sets `autoplay`, `loop`, or a restrictive `controlsList`.

## Behavior

- Playback remains available in `gather`, `view`, and `evaluate` because no response is being edited.
- Model changes preserve one media node where possible, replace source/track children, and call `load()`.
- Transcript expansion uses a native button with `aria-expanded`/`aria-controls` and does not move focus.
- Transcript precedence is sanitized inline HTML, plain text, then an external link; external content is not fetched.
- Playback failure keeps label, description, transcript, and retry available. A new blocking failure is announced once; buffering/time changes are not live-announced.
- Retry keeps focus on the initiating button while loading; after a successful retry, focus moves to the restored native video before the resolved status is removed. Retry never loops indefinitely.

## Timed-media seam

The video is the first/only media element in the light-DOM subtree and mounts during the normal Svelte connection lifecycle, inside the player’s discovery grace period. `SectionPassageCard` owns native discovery and `MediaTimeSource` attachment.

Delivery does not import `SectionController`, register cue identity, enforce seeking, restore time, own completion, or dispatch custom media lifecycle events. A future custom-player adapter must preserve this interface and earn a separate accepted change.

## Accessibility

- Native controls provide browser-standard keyboard operation; element-owned controls use native semantics and 44×44 px targets where practical.
- `media.label` names the media region; description supplements rather than replaces it.
- `media.lang` applies to media content and `transcript.lang ?? media.lang` to transcript content.
- Transcript is structured normal-flow content, not `aria-live` or a long accessible description.
- At 320 CSS px and 200% zoom, content remains one column, video uses `max-width: 100%`, and transcript prose does not scroll horizontally.
- Cue announcements/gate focus remain player responsibilities; revealed questions must not obscure captions.

## Theming and i18n

Element-owned text, borders, status, and focus UI read only active registered `--pie-*` tokens and declare none. Private sizing hooks use `--video-stimulus-*`. Native media-control chrome remains browser/OS-owned.

All element-owned strings resolve from a typed catalog using Model `language`, English fallback, and optional `uiText` overrides. Native control strings are browser-localized; media language metadata is not treated as UI locale.

## Evidence

Tests cover source/track/poster rendering, light-DOM discoverability, Model replacement, transcript sanitization/disclosure, no autoplay, keyboard/focus, narrow reflow, error/retry, ESM/IIFE packaging, and real `pie-players` cue progression with the packed element.
