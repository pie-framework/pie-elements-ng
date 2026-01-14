# Troubleshooting Guide

Common issues and solutions for PIE Elements NG.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)
- [Testing Issues](#testing-issues)
- [Integration Problems](#integration-problems)
- [Performance Issues](#performance-issues)
- [Styling Problems](#styling-problems)

## Installation Issues

### Package Not Found

**Problem:** `npm install @pie-element/multiple-choice` fails with 404 error.

**Solution:**
1. Check package name spelling
2. Verify package is published to npm registry
3. Check npm registry configuration:
   ```bash
   npm config get registry
   # Should be https://registry.npmjs.org/
   ```
4. Try with full scoped package name:
   ```bash
   npm install @pie-element/multiple-choice@latest
   ```

### Peer Dependency Conflicts

**Problem:** Installation warns about peer dependency conflicts.

**Solution:**
```bash
# Use --legacy-peer-deps flag
npm install --legacy-peer-deps

# Or with force
npm install --force

# With Bun (handles peer deps automatically)
bun install
```

### TypeScript Errors After Install

**Problem:** TypeScript can't find type definitions.

**Solution:**
1. Ensure TypeScript is installed:
   ```bash
   npm install -D typescript
   ```
2. Check `tsconfig.json` includes node_modules:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "bundler",
       "types": ["node"]
     }
   }
   ```
3. Restart TypeScript server in your IDE

## Build Errors

### Module Not Found

**Problem:** Build fails with "Cannot find module '@pie-element/X'"

**Solution:**
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check import paths are correct:
   ```typescript
   // ✅ Correct
   import { MultipleChoice } from '@pie-element/multiple-choice';

   // ❌ Wrong
   import { MultipleChoice } from '@pie-element/multiple-choice/src';
   ```
3. Verify package is in dependencies (not devDependencies)

### Vite Build Fails

**Problem:** Vite build throws errors about SSR or dependencies.

**Solution:**
1. Configure Vite for proper externals:
   ```typescript
   // vite.config.ts
   export default {
     build: {
       rollupOptions: {
         external: ['@pie-element/*']
       }
     }
   }
   ```
2. For SSR, use dynamic imports:
   ```typescript
   const MultipleChoice = await import('@pie-element/multiple-choice');
   ```

### Circular Dependency Warnings

**Problem:** Build warns about circular dependencies.

**Solution:**
1. These are often false positives from monorepo structure
2. If real, refactor shared code to break cycles
3. Suppress warnings if unavoidable:
   ```typescript
   // vite.config.ts
   export default {
     build: {
       rollupOptions: {
         onwarn(warning, warn) {
           if (warning.code === 'CIRCULAR_DEPENDENCY') return;
           warn(warning);
         }
       }
     }
   }
   ```

## Runtime Errors

### "document is not defined"

**Problem:** SSR fails with "document is not defined" or "window is not defined"

**Solution:**
1. **SvelteKit**: Use `$effect` for client-only code:
   ```svelte
   <script>
     import { MultipleChoice } from '@pie-element/multiple-choice';

     let mounted = $state(false);

     $effect(() => {
       mounted = true;
     });
   </script>

   {#if mounted}
     <MultipleChoice {model} {session} {env} />
   {/if}
   ```

2. **Next.js**: Use dynamic import with ssr: false:
   ```typescript
   const MultipleChoice = dynamic(
     () => import('@pie-element/multiple-choice'),
     { ssr: false }
   );
   ```

3. **Nuxt**: Use client-only component:
   ```vue
   <ClientOnly>
     <MultipleChoice :model="model" />
   </ClientOnly>
   ```

### Custom Element Not Defined

**Problem:** "Uncaught DOMException: Failed to execute 'define' on 'CustomElementRegistry'"

**Solution:**
1. Ensure you're importing the element before using:
   ```javascript
   import '@pie-element/multiple-choice'; // Must come first
   ```
2. Check for duplicate registrations:
   ```javascript
   if (!customElements.get('pie-multiple-choice')) {
     customElements.define('pie-multiple-choice', MultipleChoiceElement);
   }
   ```
3. Avoid hot module replacement issues in dev:
   ```javascript
   if (import.meta.hot) {
     import.meta.hot.accept(() => {
       // Re-registration handled automatically
     });
   }
   ```

### Event Listeners Not Firing

**Problem:** `session-change` events aren't received.

**Solution:**
1. Check event name spelling:
   ```javascript
   // ✅ Correct
   element.addEventListener('session-change', handler);

   // ❌ Wrong
   element.addEventListener('sessionChange', handler);
   ```
2. Ensure element is mounted:
   ```javascript
   window.addEventListener('DOMContentLoaded', () => {
     const element = document.querySelector('pie-multiple-choice');
     element.addEventListener('session-change', handler);
   });
   ```
3. Check event bubbles up:
   ```javascript
   // Listen on parent
   document.addEventListener('session-change', (e) => {
     if (e.target.tagName === 'PIE-MULTIPLE-CHOICE') {
       console.log('Session changed:', e.detail);
     }
   });
   ```

### Props Not Updating

**Problem:** Changing props doesn't update the element.

**Solution:**
1. For objects, create new reference:
   ```javascript
   // ✅ Correct - new object
   element.model = { ...element.model, prompt: 'New prompt' };

   // ❌ Wrong - mutating
   element.model.prompt = 'New prompt';
   ```
2. Check prop is reactive in framework:
   ```svelte
   <!-- Svelte -->
   <MultipleChoice {model} /> <!-- Reactive -->
   ```
3. Force re-render if needed:
   ```javascript
   element.model = null;
   setTimeout(() => {
     element.model = newModel;
   }, 0);
   ```

## Testing Issues

### "document is not defined" in Tests

**Problem:** Tests fail with document errors.

**Solution:**
1. Use Vitest with happy-dom environment:
   ```typescript
   // vitest.config.ts
   export default {
     test: {
       environment: 'happy-dom'
     }
   };
   ```
2. Don't use Bun's test runner for component tests:
   ```bash
   # ✅ Correct
   bun run test  # Uses Vitest

   # ❌ Wrong
   bun test      # Uses Bun's test runner (no DOM)
   ```

### Playwright Tests Timeout

**Problem:** E2E tests timeout waiting for elements.

**Solution:**
1. Increase timeout:
   ```typescript
   test('my test', async ({ page }) => {
     await page.waitForSelector('pie-multiple-choice', {
       timeout: 10000
     });
   });
   ```
2. Wait for network idle:
   ```typescript
   await page.goto('/question', { waitUntil: 'networkidle' });
   ```
3. Use explicit waits:
   ```typescript
   await page.waitForFunction(() => {
     const el = document.querySelector('pie-multiple-choice');
     return el && el.model;
   });
   ```

### Component Tests Fail

**Problem:** `@testing-library/svelte` tests don't render component.

**Solution:**
1. Ensure all imports are correct:
   ```typescript
   import { render } from '@testing-library/svelte';
   import MultipleChoice from './MultipleChoice.svelte';
   ```
2. Provide all required props:
   ```typescript
   const { getByRole } = render(MultipleChoice, {
     props: {
       model: createDefaultModel(),
       session: { value: null },
       env: { mode: 'gather', role: 'student' }
     }
   });
   ```
3. Mock any external dependencies

## Integration Problems

### React: Props Warning

**Problem:** "Warning: Invalid prop X supplied to Component"

**Solution:**
1. Use correct casing:
   ```tsx
   {/* ✅ Correct */}
   <MultipleChoice onSessionChange={handler} />

   {/* ❌ Wrong */}
   <MultipleChoice onSessionchange={handler} />
   ```
2. Check prop types match:
   ```tsx
   // Ensure session is object, not null initially
   const [session, setSession] = useState<Session>({ value: null });
   ```

### Vue: Props Not Reactive

**Problem:** Vue component doesn't react to prop changes.

**Solution:**
1. Use v-bind for objects:
   ```vue
   <pie-multiple-choice
     :model="model"
     :session="session"
     :env="env"
   />
   ```
2. Make data reactive:
   ```vue
   <script setup>
   import { ref, reactive } from 'vue';

   const model = reactive({ /* ... */ });
   const session = ref({ value: null });
   </script>
   ```

### Angular: Custom Element Not Recognized

**Problem:** "Unknown element: pie-multiple-choice"

**Solution:**
1. Add to schemas:
   ```typescript
   import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

   @Component({
     selector: 'app-question',
     template: '<pie-multiple-choice></pie-multiple-choice>',
     schemas: [CUSTOM_ELEMENTS_SCHEMA]
   })
   ```
2. Import before use:
   ```typescript
   import '@pie-element/multiple-choice';
   ```

## Performance Issues

### Slow Initial Render

**Problem:** Element takes long time to render first time.

**Solution:**
1. Lazy load elements:
   ```typescript
   // Load only when needed
   const loadElement = async () => {
     await import('@pie-element/multiple-choice');
   };
   ```
2. Preload critical elements:
   ```html
   <link rel="modulepreload" href="/@pie-element/multiple-choice" />
   ```
3. Use code splitting in bundler

### Memory Leaks

**Problem:** Page memory grows over time.

**Solution:**
1. Clean up event listeners:
   ```javascript
   // Svelte: automatic cleanup
   onDestroy(() => {
     element.removeEventListener('session-change', handler);
   });
   ```
2. Destroy rich text editors:
   ```javascript
   // TipTap editor cleanup happens automatically in Svelte
   ```
3. Clear large data when unmounting:
   ```javascript
   onDestroy(() => {
     model = null;
     session = null;
   });
   ```

### Sluggish Interactions

**Problem:** Element feels slow or laggy.

**Solution:**
1. Debounce session updates:
   ```typescript
   import { debounce } from 'lodash-es';

   const debouncedUpdate = debounce((session) => {
     saveSession(session);
   }, 300);
   ```
2. Use virtual scrolling for long lists
3. Optimize re-renders:
   ```svelte
   <!-- Svelte: Use $derived for computed values -->
   const filteredChoices = $derived(
     choices.filter(c => c.visible)
   );
   ```

## Styling Problems

### Styles Not Applied

**Problem:** Element doesn't use custom theme.

**Solution:**
1. Check DaisyUI theme is set:
   ```html
   <html data-theme="light">
   ```
2. Verify CSS variables are defined:
   ```css
   :root {
     --color-primary: #3b82f6;
     --color-base-100: #ffffff;
   }
   ```
3. Check specificity isn't too low:
   ```css
   /* ✅ Specific enough */
   pie-multiple-choice .choice {
     color: red;
   }

   /* ❌ Too vague */
   .choice {
     color: red;
   }
   ```

### CSS Conflicts

**Problem:** Global styles conflict with element styles.

**Solution:**
1. Scope your global styles:
   ```css
   /* Don't affect PIE elements */
   :not(pie-multiple-choice) button {
     /* your styles */
   }
   ```
2. Use CSS layers:
   ```css
   @layer base, components, pie-elements;

   @layer pie-elements {
     /* PIE-specific overrides */
   }
   ```
3. Increase specificity for overrides:
   ```css
   pie-multiple-choice button.submit {
     /* Override PIE defaults */
   }
   ```

### Dark Mode Not Working

**Problem:** Element doesn't switch to dark theme.

**Solution:**
1. Set data-theme dynamically:
   ```javascript
   document.documentElement.setAttribute('data-theme', 'dark');
   ```
2. Check theme attribute inheritance:
   ```html
   <!-- Theme should be on root -->
   <html data-theme="dark">
     <body>
       <pie-multiple-choice></pie-multiple-choice>
     </body>
   </html>
   ```
3. Verify CSS variables for dark theme are defined

## Getting More Help

### Debug Mode

Enable debug logging:

```javascript
localStorage.setItem('pie:debug', 'true');
// Reload page to see debug logs
```

### Browser DevTools

1. **Elements tab**: Inspect element DOM and styles
2. **Console tab**: Check for errors and warnings
3. **Network tab**: Verify resources load correctly
4. **Performance tab**: Profile slow operations

### Reporting Issues

When reporting issues, include:

1. **Environment**:
   - Browser and version
   - Framework and version
   - Package versions (`npm list @pie-element/*`)

2. **Steps to reproduce**:
   - Minimal code example
   - Expected vs actual behavior

3. **Error messages**:
   - Full error stack traces
   - Console warnings
   - Network errors

4. **Screenshots/videos** if visual issue

### Community Resources

- **GitHub Issues**: [Report bugs](https://github.com/your-org/pie-elements-ng/issues)
- **Discussions**: [Ask questions](https://github.com/your-org/pie-elements-ng/discussions)
- **Documentation**: [Read full docs](../README.md)

## See Also

- [USAGE.md](./USAGE.md) - Usage guide
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [INTEGRATION.md](./INTEGRATION.md) - Framework integration
- [testing.md](./testing.md) - Testing guide

---

**Last Updated**: 2025-01-08
