# @pie-element/shared-mathml-to-latex

MathML to LaTeX conversion utility.

> **Note**: This package replaces `@pie-lib/mathml-to-latex` from the upstream pie-lib monorepo. During upstream sync, imports are automatically rewritten to use this package.

## Overview

This package provides utilities for converting MathML (Mathematical Markup Language) to LaTeX format, enabling math rendering with KaTeX and other LaTeX engines.

## Usage

```typescript
import { mmlToLatex } from '@pie-element/shared-mathml-to-latex';

const mathml = '<math><mi>x</mi><mo>=</mo><mn>5</mn></math>';
const latex = mmlToLatex(mathml); // Returns: x = 5
```

## Dependencies

This package uses `@xmldom/xmldom` for parsing MathML.

## License

See the root LICENSE file.
