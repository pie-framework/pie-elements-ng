# @pie-element/shared-controller-utils

Controller utility functions for PIE elements.

## Installation

This package is part of the PIE workspace and should be installed via workspace dependencies:

```json
{
  "dependencies": {
    "@pie-element/shared-controller-utils": "workspace:*"
  }
}
```

## Usage

```typescript
import { getShuffledChoices, lockChoices, partialScoring } from '@pie-element/shared-controller-utils';
```

### Response normalization

`normalizeResponse` folds a typed response and an authored answer to one comparable form before a controller compares them: bidi controls and tatweel removed, Arabic presentation forms folded, NFC, every Unicode decimal digit folded to 0–9, and `٫` and `٬` read as the content language's decimal and group marks. An ASCII string passes through unchanged, so existing answers score as before. The session keeps the response as entered.

```typescript
import { contentLanguage, normalizeResponse } from '@pie-element/shared-controller-utils';

const language = contentLanguage(model, env); // model.language, then env.locale
const matches =
  normalizeResponse(typed, { language, ignoreCase: true }) ===
  normalizeResponse(authored, { language, ignoreCase: true });
```

`ignoreCase` folds with `toLocaleLowerCase` in the content language, so Turkish and Azerbaijani İ/ı fold correctly. `foldLetterVariants` folds Arabic hamza and madda alef forms, tashkeel, ة and ى; it changes what counts as correct spelling, so it stays an authoring choice per response. Math controllers call `normalizeResponse` without a language, so `٫` becomes the `.` math-validation computes on.

## Development

```bash
# Build the package
npm run build

# Watch mode for development
npm run dev

# Run tests
npm run test

# Clean build artifacts
npm run clean
```

## License

MIT
