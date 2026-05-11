# 01 — Learnosity signing endpoint

Type: **AFK**

## What to build

Add a SvelteKit server `load` function to the parity route that signs a Learnosity Items API init payload. Given a `demo` query param, the load function looks up the corresponding `sourceReference` in `mc-populated-blank.json`, computes an HMAC-SHA256 signature using the algorithm already in `scripts/fetch-learnosity-item.mjs`, and returns the signed payload to the page. The signing logic runs server-side only; credentials never reach the browser.

## Acceptance criteria

- [ ] `GET /mc-populated-blank/parity?demo=variant-sel-r1-gplusggg` returns a page whose server load produced a signed Learnosity Items API init config (consumer key, timestamp, signature, items array).
- [ ] Returns a 503 (or equivalent user-visible error) when `LEARNOSITY_CONSUMER_KEY` or `LEARNOSITY_SECRET` env vars are absent.
- [ ] Returns a 404 (or equivalent) when the `demo` param does not match any entry in `mc-populated-blank.json`.
- [ ] Returns a 400 (or equivalent) when the matched entry has no `sourceReference` field.
- [ ] Signing algorithm produces output that Learnosity's Items API accepts (verify manually in headed browser during slice 2).

## Blocked by

None — can start immediately.
