# Learnosity Parity Demo

Dedicated local app for PIE elements that are being compared against live Learnosity rendering.

Run from the repository root:

```sh
bun run dev:learnosity-parity
```

Open the app at `http://localhost:5224/mc-populated-blank`.

Live side-by-side parity pages require `LEARNOSITY_CONSUMER_KEY` and `LEARNOSITY_SECRET`.
PIE-only delivery pages and most local regression checks can run without those credentials.
