/**
 * Players pass element models verbatim, so every delivery and print sink that writes HTML into
 * the DOM runs it through `sanitizeModelHtml`. A sink that writes markup the element builds
 * itself is listed below with the reason it needs no sanitizing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';

const root = process.cwd();

const SOURCES = [
  'packages/elements-react/*/src/{delivery,print}/**/*.{ts,tsx}',
  'packages/elements-svelte/*/src/{delivery,print}/**/*.{ts,svelte}',
  'packages/lib-react/{charting,graphing,graphing-solution-set,mask-markup,plot,render-ui,text-select}/src/**/*.{ts,tsx}',
];

const IGNORE = ['**/__tests__/**', '**/*.test.*', '**/node_modules/**'];

// Each sink up to the end of the value it writes: `}}` for React, `;` for an assignment, `}` for Svelte.
const SINKS =
  /dangerouslySetInnerHTML=\{\{[\s\S]*?\}\}|\.innerHTML\s*=(?!=)[^;]*;|\{@html\s[^}]*\}/g;

// `[file, line content]` for sinks that write markup the element builds itself.
const ELEMENT_BUILT: [string, string][] = [
  // Rubric custom-element tags built from the element's own tag names and id prefix.
  ['packages/elements-react/complex-rubric/src/delivery/index.ts', 'this.innerHTML = rubricTag;'],
  [
    'packages/elements-react/complex-rubric/src/print/index.ts',
    "this.innerHTML = rubricTags[this._type]?.(this._idPrefix) || '';",
  ],
  // Part containers and a translated heading.
  ['packages/elements-react/ebsr/src/delivery/index.tsx', 'this.innerHTML = `'],
  ['packages/elements-react/ebsr/src/print/index.tsx', 'this.innerHTML = `'],
  // A translated warning.
  [
    'packages/elements-react/image-cloze-association/src/delivery/root.tsx',
    '<WarningMessage dangerouslySetInnerHTML={{ __html: message }} />',
  ],
  [
    'packages/elements-react/multi-trait-rubric/src/delivery/trait.tsx',
    "<NoDescription dangerouslySetInnerHTML={{ __html: 'No Description' }} />",
  ],
  [
    'packages/lib-react/mask-markup/src/components/dropdown.tsx',
    "<StyledSelectedIndicator dangerouslySetInnerHTML={{ __html: c.value === value ? ' &check;' : '' }} />",
  ],
  // Copies a label this dropdown rendered sanitized.
  [
    'packages/lib-react/mask-markup/src/components/dropdown.tsx',
    'preview.innerHTML = ref.innerHTML;',
  ],
  // Re-serializes markup parsed from sanitized input.
  [
    'packages/elements-react/select-text/src/delivery/utils.tsx',
    "div.innerHTML = '<div separator=\\'true\\'>'.concat(txtDom.innerHTML, '</div>');",
  ],
  [
    'packages/lib-react/text-select/src/utils.tsx',
    "dom.innerHTML = dom.innerHTML.replace(/\\n\\n/g, '\\n');",
  ],
  ['packages/lib-react/text-select/src/utils.tsx', 'div.innerHTML = `<p>'],
  ['packages/lib-react/render-ui/src/transform-headings.tsx', 'heading.innerHTML = el.innerHTML;'],
  // Tokens reach the page through TokenSelect's html, which is sanitized whole.
  [
    'packages/lib-react/text-select/src/token-select/token.tsx',
    "dangerouslySetInnerHTML={{ __html: (text || '').replace(/\\n/g, '<br>') }}",
  ],
  // The authoring tokenizer.
  [
    'packages/lib-react/text-select/src/tokenizer/token-text.tsx',
    'dangerouslySetInnerHTML={{ __html: formattedText }}',
  ],
  // Model CSS inside a <style>, scoped to the element.
  [
    'packages/lib-react/render-ui/src/ui-layout.tsx',
    '<style dangerouslySetInnerHTML={{ __html: `.',
  ],
];

// `[file, call]` for helpers that sanitize before they parse.
const SANITIZING_HELPERS: [string, string][] = [
  ['packages/lib-react/render-ui/src/preview-prompt.tsx', 'this.parsedText('],
  ['packages/elements-react/passage/src/delivery/stimulus-tabs.tsx', 'this.parsedText('],
];

const isElementBuilt = (file: string, line: string) =>
  ELEMENT_BUILT.some(([listed, content]) => listed === file && line.includes(content));

const isSanitized = (file: string, sink: string) =>
  sink.includes('sanitizeModelHtml(') ||
  SANITIZING_HELPERS.some(([listed, call]) => listed === file && sink.includes(call));

describe('model HTML sinks', () => {
  test('sanitize what they write, or are listed as writing element-built markup', () => {
    const files = SOURCES.flatMap((pattern) =>
      globSync(pattern, { cwd: root, ignore: IGNORE })
    ).sort();
    const unsanitized: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(root, file), 'utf-8');

      for (const { 0: sink, index } of source.matchAll(SINKS)) {
        const lineStart = source.lastIndexOf('\n', index) + 1;
        const line = source.slice(lineStart, source.indexOf('\n', index));
        if (
          isSanitized(file, sink) ||
          /\.innerHTML\s*=\s*['"]{2};/.test(sink) ||
          isElementBuilt(file, line)
        ) {
          continue;
        }
        const lineNumber = source.slice(0, index).split('\n').length;
        unsanitized.push(`${file}:${lineNumber}: ${line.trim()}`);
      }
    }

    expect(files.length).toBeGreaterThan(100);
    expect(unsanitized).toEqual([]);
  });
});
