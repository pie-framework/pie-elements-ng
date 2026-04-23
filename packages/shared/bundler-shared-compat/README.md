# @pie-element/bundler-shared (deprecated)

This package is a temporary compatibility wrapper.

Use `@pie-element/element-bundler` instead.

## Migration

Update imports:

```ts
// before
import { Bundler } from '@pie-element/bundler-shared';

// after
import { Bundler } from '@pie-element/element-bundler';
```

## Scope

`@pie-element/element-bundler` currently builds IIFE bundles for the legacy IIFE delivery path.
ESM bundle workflows do not require this package.
