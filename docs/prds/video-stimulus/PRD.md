# Video stimulus

Status: **Proposal** · Tier: 2 · Impl. path: New `@pie-element/video-stimulus`

## Context

PIE needs a reusable video stimulus element for timed-media assessment, online course, and vocational/training workflows. The element renders media and exposes playback state/control APIs, while section-level composition in `pie-players` owns cue-to-question orchestration, child item sessions, playback policy, and aggregate completion.

This PRD is coordinated with `pie-players/docs/architecture/timed-media-section.md`, `pie-players/docs/prds/timed-media-section-contract.md`, and `pie-players/docs/prds/shared-contracts/media-asset-contract.md`. Those player contracts own section state and shared media vocabulary; this repo owns the leaf element behavior.

## Goals

- Provide a Svelte-based `@pie-element/video-stimulus` package that follows the PIE element packaging and runtime contract.
- Render accessible video stimulus media with sources, poster, captions/subtitles, transcript, labels, and descriptions.
- Expose a stable playback handle for current time, duration, paused state, play, pause, and seek.
- Emit media lifecycle events that section players can observe without embedding cue policy in the element.
- Keep the underlying media-player dependency isolated behind the PIE-owned element API.

## Non-goals

- No cue-to-question binding; cue orchestration belongs to `pie-players` timed-media section behavior.
- No child item sessions, section completion, section scoring, or playback-lock policy.
- No media upload, storage, CDN, signed URL, transcoding, retention, or authorization.
- No composition authoring UI for cue timelines or item bindings.
- No standards adapter or QTI/PCI conformance claim.

## Proposed surface

- **Model**: media asset fields aligned with `pie-players` media metadata: `sources`, `poster`, `captions` or `tracks`, `transcript`, `label`, `description`, `lang`, and optional expected duration. Full TypeScript names should follow the accepted player media contract rather than diverging locally.
- **Session**: minimal playback state only if the element contract requires it for restore; section-level media progress and cue completion belong in `pie-players` timed-media session state.
- **Modes supported**: `gather`, `view`, `evaluate`, `configure`.
- **Key delivery interactions**: native or wrapped video controls, keyboard play/pause/seek/track controls, visible transcript access, caption selection, and error state presentation.
- **Controller responsibilities**: validate media model shape, expose view model data, and avoid scoring or cue orchestration.
- **Authoring surface**: sources, poster, captions/subtitles, transcript, accessible label/description, language, and dependency-specific preview settings. Cue points and child item bindings are explicitly out of scope.

Expected playback handle, names not final:

```ts
interface VideoStimulusHandle {
  readonly currentTime: number;
  readonly duration: number;
  readonly paused: boolean;
  play(): Promise<void>;
  pause(): void;
  seekTo(seconds: number): void;
}
```

Expected media events, names not final:

- `media-ready`
- `media-time-changed`
- `media-play`
- `media-pause`
- `media-seeked`
- `media-ended`
- `media-track-changed`
- `media-error`

## Worked example

> *Prompt*: Watch the lab safety video. Questions will appear in the section player as the timeline reaches authored cue points.

The video stimulus renders the video, captions, and transcript. At 42.5 seconds it emits media time/progress state. The `pie-players` timed-media section player observes that state, pauses playback, reveals the child question, and records the child item session. The video stimulus does not know which question appeared or how the section aggregates completion.

## Accessibility

WCAG 2.2 AA is the baseline.

- **Keyboard model**: all media controls, captions/subtitle selection, transcript toggle, error details, and retry controls are keyboard reachable and operable.
- **Screen-reader model**: the element exposes a labelled media region, announces media load/error state, labels track controls, and keeps transcript access discoverable.
- **Captions/transcripts**: captions and transcript metadata are first-class model fields, not optional implementation afterthoughts.
- **Hit-target / motion / contrast specifics**: controls meet touch target and contrast expectations; reduced-motion preferences are respected for animated UI; zoom layouts keep controls, captions, and transcript usable.
- **Audio coordination**: the element exposes enough play/pause state for section/tooling code to coordinate TTS and media audio; it does not own section-wide TTS policy.

## Open questions

- [ ] Should the first implementation target Video.js v10, Vidstack, Media Chrome, or native media with custom controls?
- [ ] Which media metadata fields are required by the element before the `pie-players` media asset contract is accepted?
- [ ] Does playback restore require an element session field, or should all persisted progress live in timed-media section state?
- [ ] What print/export representation should a video stimulus provide?
- [ ] Should transcript HTML be sanitized by the element package, shared utilities, or host pipeline?
