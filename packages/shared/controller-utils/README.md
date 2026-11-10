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
import {
  getShuffledChoices,
  lockChoices,
  partialScoring,
} from '@pie-element/shared-controller-utils';
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

`ignoreCase` folds with `toLocaleLowerCase` in Turkish and Azerbaijani, so İ/ı fold correctly, and with `toLowerCase()` in every other language. A tag the runtime has no locale data for keeps `.` and `,`. `foldLetterVariants` folds Arabic hamza and madda alef forms, tashkeel, ة and ى; it changes what counts as correct spelling, so it stays an authoring choice per response. Math controllers pass `latexNumbers`, which writes numbers with the marks math-validation computes on: `٫` becomes `.` and `٬` becomes `,` in every language. Where the tag names a region that writes a decimal comma (`es-ES`, `de-DE`), a number's one `,` or `{,}` also becomes `.`, and `;` becomes `, ` between list items. A `.` stays a decimal point, a number with two marks such as `1.000,5` stays as typed, and a tag without a region keeps the point, because US Spanish content declares `es`. Which regions write a decimal comma comes from a fixed CLDR 48 table, so every runtime scores alike. Math controllers take the language from `mathContentLanguage`, which reads an underscore code such as `es_ES` as its language alone, because the authoring dropdown and the Learnosity transform write it for Spanish of any region. `contentLanguage` keeps its region. Both pass over a code that names no language, `und` or `zxx` among them, to `env.locale`.

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
