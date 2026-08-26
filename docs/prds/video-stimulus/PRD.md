# Video stimulus

Status: **Proposal** · Tier: 2 · Impl. path: New `@pie-element/video-stimulus`

## Context

PIE needs a reusable video stimulus element for timed-media assessment, online course, and vocational/training workflows. The element renders media and exposes playback state/control APIs, while section-level composition in `pie-players` owns cue-to-question orchestration, child item sessions, playback policy, and aggregate completion.

This PRD consumes the sibling `../pie-players` contracts rather than defining parallel media or timeline APIs:

- [Timed-media section contract](https://github.com/pie-framework/pie-players/blob/develop/docs/prds/timed-media-section-contract.md) — implemented section data/session, cue policy, and the `MediaTimeSource` integration port.
- [Timed-media architecture](https://github.com/pie-framework/pie-players/blob/develop/docs/architecture/timed-media-section.md) — layer ownership and rationale; its older `VideoStimulusHandle` sketch is superseded by the implemented port.
- [Media asset contract](https://github.com/pie-framework/pie-players/blob/develop/docs/prds/shared-contracts/media-asset-contract.md) — Accepted and shipped `MediaAssetRef`, `MediaSource`, `TextTrackRef`, `TranscriptRef`, and `MediaFragmentRange` types.
- [Section-player timed-media documentation](https://github.com/pie-framework/pie-players/blob/develop/packages/section-player/README.md#timed-media) and [browser coverage](https://github.com/pie-framework/pie-players/blob/develop/packages/section-player/tests/section-player-timed-media.spec.ts) — the actual passage/stimulus attachment behavior.

`pie-players` owns cue orchestration, playback policy, progress persistence, child sessions, TTS/media arbitration, and aggregate completion. This repo owns the leaf element's media rendering, accessibility, authoring, and stable exposure of a media time source.

## Goals

- Provide a Svelte-based `@pie-element/video-stimulus` package that follows the PIE element packaging and runtime contract.
- Render accessible video stimulus media with sources, poster, captions/subtitles, transcript, labels, and descriptions.
- Satisfy the shipped `MediaTimeSource` port—current time, duration, paused and seekable state, capability declarations, play/pause/seek, and subscription notifications—without exposing a dependency-specific API.
- Render a discoverable native media element so the existing section passage card can attach `createMediaElementTimeSource`; a wrapped player that cannot expose one must provide an equivalent port without moving cue policy into this element.
- Keep the underlying media-player dependency isolated behind the PIE-owned element API.

## Non-goals

- No cue-to-question binding; cue orchestration belongs to `pie-players` timed-media section behavior.
- No child item sessions, section completion, section scoring, or playback-lock policy.
- No media upload, storage, CDN, signed URL, transcoding, retention, or authorization.
- No composition authoring UI for cue timelines or item bindings.
- No standards adapter or QTI/PCI conformance claim.

## Proposed surface

- **Model**: consume the ratified `MediaAssetRef` v1 vocabulary from `@pie-players/pie-players-shared/types`, requiring `kind: "video"`, at least one safe playable `source`, and the element-specific accessibility subset decided below. Do not introduce aliases such as `captions` or `expectedDuration`: the shared names are `tracks` and `durationSeconds`.
- **Session**: none for playback progress. `SectionControllerSessionState.timedMedia` already persists position, furthest position, reached cues, gate state, and media completion. Standalone playback may reset when remounted; adding a second progress owner would create conflicting restore behavior.
- **Modes supported**: `gather`, `view`, `evaluate`, `configure`; media rendering is consistent across delivery modes, while configure exposes authoring controls.
- **Key delivery interactions**: native or wrapped video controls, keyboard play/pause/seek/track controls, visible transcript access, caption selection, and error state presentation.
- **Controller responsibilities**: validate the consumer-required `MediaAssetRef` subset and reject unsupported versions/kinds; expose view-model data; return no score; avoid cue, gate, playback-policy, or section-session logic. URL normalization and scheme policy must reuse the shared `pie-players` catalog-media validation rather than create another allow-list; an exported package boundary for that helper must be confirmed before implementation.
- **Authoring surface**: sources, poster, tracks, transcript, accessible label/description, language, and dependency-specific preview settings. Cue points and child item bindings are explicitly out of scope and belong to composition authoring around `TimedMediaSectionData`.

**Timed-media integration.** The canonical API is `MediaTimeSource` from `@pie-players/pie-players-shared/timed-media`, with `capabilities.canPause`, `capabilities.canRestrictSeeking`, `currentTime`, `duration`, `paused`, `seekable`, `play()`, `pause()`, `seekTo()`, and `subscribe()` notifications for `time`, `seek`, `play`, `pause`, and `ended`. Do not add a parallel `media-ready` / `media-time-changed` / lifecycle-event vocabulary.

For a discoverable native `<video>`, the implemented `SectionPassageCard` finds the element in the stimulus passage subtree and wraps it with `createMediaElementTimeSource`; that adapter attaches to `SectionController` through the internal bubbling `pie-media-time-source` registration seam. A host-owned third-party port outranks native discovery. The element must therefore keep its media node discoverable from the passage card (not hidden behind an inaccessible shadow boundary), or explicitly integrate through the same port if its chosen player library prevents discovery.

## Worked example

> *Prompt*: Watch the lab safety video. Questions will appear in the section player as the timeline reaches authored cue points.

The video stimulus renders the video, captions, and transcript inside the passage identified by `TimedMediaSectionData.stimulusRef`. The section passage card discovers its native `<video>`, adapts it to `MediaTimeSource`, and the section controller receives a `time` notification at 42.5 seconds. The controller—not the element—activates the authored cue, pauses through the port if the cue is a gate and `canPause` is true, reveals the child question, and persists timed-media state. The video stimulus does not know which question appeared or how the section aggregates completion.

## Accessibility

WCAG 2.2 AA is the baseline.

- **Keyboard model**: all media controls, captions/subtitle selection, transcript toggle, error details, and retry controls are keyboard reachable and operable.
- **Screen-reader model**: the element exposes a labelled media region, announces media load/error state, labels track controls, and keeps transcript access discoverable.
- **Captions/transcripts**: captions and transcript metadata are first-class model fields, not optional implementation afterthoughts.
- **Hit-target / motion / contrast specifics**: controls meet touch target and contrast expectations; reduced-motion preferences are respected for animated UI; zoom layouts keep controls, captions, and transcript usable.
- **Audio coordination**: the element satisfies `MediaTimeSource`; `SectionController.pauseMediaForCompetingAudio()` and the `timed-media-audio-started` controller event feed the implemented toolkit-level last-action-wins TTS/media handoff. The element does not implement a second TTS policy.
- **Timed-media focus and announcements**: cue announcements, gate focus movement, and advisory degradation when pause/seek capabilities are absent are section-player responsibilities and already have browser coverage. The element must not cover the caption region when embedded beside a revealed question.

## Open questions

- [ ] Should the first implementation target Video.js v10, Vidstack, Media Chrome, or native media with custom controls?
- [ ] Which `MediaAssetRef` accessibility fields are required for this consumer? At minimum, decide when `tracks`, `transcript`, `label`, `description`, and `lang` are validation requirements rather than optional schema fields.
- [ ] What exported package path should provide the existing `assessment-toolkit/src/services/catalog-media.ts` source normalization and safe-scheme validation to an element package without creating an invalid dependency direction?
- [ ] What standalone print/export representation should a video stimulus provide? Timed-media **section** print behavior is already decided: when section printing exists, every cued item prints revealed because a printed page has no timeline.
- [ ] Should transcript HTML be sanitized by the element package, shared utilities, or host pipeline?
- [ ] Can the chosen media-player dependency leave a native `<video>` discoverable in the passage subtree, or must the element register its own `MediaTimeSource` port?
