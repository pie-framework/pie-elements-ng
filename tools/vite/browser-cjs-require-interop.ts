import { dirname, join, normalize } from 'node:path/posix';
import type { Plugin } from 'vite';

const REQUIRE_PROXY_MESSAGE = 'Calling `require` for';
const SUPPORTED_REQUIRE_SPECIFIERS = new Set([
  'react',
  'react-dom',
  'react-dom/client',
  'classnames',
  'prop-types',
]);
const NODE_BUILTIN_REQUIRE_SPECIFIERS = new Set([
  'assert',
  'buffer',
  'crypto',
  'events',
  'fs',
  'http',
  'https',
  'os',
  'path',
  'process',
  'stream',
  'url',
  'util',
  'zlib',
]);

type ChunkLike = {
  type: 'chunk';
  fileName: string;
  code: string;
};

type HelperChunk = {
  chunk: ChunkLike;
  exportedNames: Set<string>;
  helperNames: string[];
  requiredSpecifiers: Set<string>;
};

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function isRequireLikeSpecifier(value: string, importedHelper: boolean): boolean {
  const hasSpecifierShape =
    /^(node:)?(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(value);
  if (!hasSpecifierShape) {
    return false;
  }
  if (!importedHelper) {
    return true;
  }
  return (
    SUPPORTED_REQUIRE_SPECIFIERS.has(value) ||
    NODE_BUILTIN_REQUIRE_SPECIFIERS.has(value) ||
    value.startsWith('node:') ||
    value.startsWith('@') ||
    value.includes('/')
  );
}

function collectRequireHelperNames(code: string): string[] {
  const helperPattern =
    /(?:^|[^\w$])([A-Za-z_$][\w$]*)\s*=\s*\/\*\s*@__PURE__\s*\*\/\s*\(\([^)]*\)\s*=>[\s\S]{0,1200}?Calling `require` for/g;
  return [...code.matchAll(helperPattern)].map((match) => match[1]);
}

function collectRequireSpecifiers(
  code: string,
  helperNames: string[],
  options: { importedHelper?: boolean } = {}
): Set<string> {
  const specifiers = new Set<string>();
  for (const helperName of helperNames) {
    const callPattern = new RegExp(
      `(?:^|[^\\w$])${escapeRegExp(helperName)}\\s*\\(\\s*(['"])([^'"]+)\\1\\s*\\)`,
      'g'
    );
    for (const match of code.matchAll(callPattern)) {
      if (isRequireLikeSpecifier(match[2], options.importedHelper === true)) {
        specifiers.add(match[2]);
      }
    }
  }
  return specifiers;
}

function replaceRequireHelpers(code: string, helperNames: string[]): string {
  let transformed = code;
  for (const helperName of helperNames) {
    const helperPattern = new RegExp(
      `(^|[^\\w$])(${escapeRegExp(
        helperName
      )}\\s*=\\s*)\\/\\*\\s*@__PURE__\\s*\\*\\/\\s*\\(\\([^]*?\\)\\(function\\([^)]*\\)\\s*\\{[^]*?Calling \`require\` for[^]*?\\}\\)`,
      'g'
    );
    transformed = transformed.replace(helperPattern, '$1$2__pieBrowserCjsRequire');
  }
  return transformed;
}

function collectHelperExportNames(code: string, helperNames: string[]): Set<string> {
  const helperNameSet = new Set(helperNames);
  const exportedNames = new Set<string>();
  const exportPattern = /export\s*\{([^}]+)\}/g;

  for (const exportMatch of code.matchAll(exportPattern)) {
    for (const rawPart of exportMatch[1].split(',')) {
      const part = rawPart.trim();
      const match = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(part);
      if (!match) {
        continue;
      }
      const localName = match[1];
      const exportedName = match[2] ?? localName;
      if (helperNameSet.has(localName)) {
        exportedNames.add(exportedName);
      }
    }
  }

  return exportedNames;
}

function collectImportedHelperNames(
  code: string,
  fileName: string,
  helperChunksByFileName: Map<string, HelperChunk>
): Array<{ helperChunk: HelperChunk; localName: string }> {
  const importedHelpers: Array<{ helperChunk: HelperChunk; localName: string }> = [];
  const importPattern = /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];/g;

  for (const importMatch of code.matchAll(importPattern)) {
    const importSource = importMatch[2];
    if (!importSource.startsWith('.')) {
      continue;
    }

    const importedFileName = normalize(join(dirname(fileName), importSource));
    const helperChunk = helperChunksByFileName.get(importedFileName);
    if (!helperChunk) {
      continue;
    }

    for (const rawPart of importMatch[1].split(',')) {
      const part = rawPart.trim();
      const match = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(part);
      if (!match) {
        continue;
      }
      const importedName = match[1];
      const localName = match[2] ?? importedName;
      if (helperChunk.exportedNames.has(importedName)) {
        importedHelpers.push({ helperChunk, localName });
      }
    }
  }

  return importedHelpers;
}

function assertSupportedSpecifiers(
  specifiers: Set<string>,
  error: (message: string) => void
): void {
  const unsupportedSpecifiers = [...specifiers].filter(
    (specifier) => !SUPPORTED_REQUIRE_SPECIFIERS.has(specifier)
  );
  if (unsupportedSpecifiers.length > 0) {
    error(`Unsupported browser CJS require helper target(s): ${unsupportedSpecifiers.join(', ')}`);
  }
}

function findImportInsertionIndex(code: string): number {
  let offset = 0;
  for (const line of code.split(/(?<=\n)/)) {
    if (!line.startsWith('import ')) {
      break;
    }
    offset += line.length;
  }
  return offset;
}

function makeRequireInteropPrelude(specifiers: Set<string>): string {
  const lines: string[] = [];

  if (specifiers.has('react')) {
    lines.push('import * as __pieBrowserCjsReactRequire from "react";');
  }

  if (specifiers.has('react-dom')) {
    lines.push('import * as __pieBrowserCjsReactDomRequire from "react-dom";');
  }

  if (specifiers.has('react-dom/client')) {
    lines.push('import * as __pieBrowserCjsReactDomClientRequire from "react-dom/client";');
  }

  if (specifiers.has('classnames')) {
    lines.push(`const __pieBrowserCjsClassnamesRequire = (...inputs) => {
  const classes = [];
  const append = (value) => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      classes.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) append(item);
      return;
    }
    if (typeof value === "object") {
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key) && value[key]) classes.push(key);
      }
    }
  };
  for (const input of inputs) append(input);
  return classes.join(" ");
};`);
  }

  if (specifiers.has('prop-types')) {
    lines.push(`const __pieBrowserCjsCreatePropTypeValidator = () => {
  const validator = () => null;
  validator.isRequired = validator;
  return validator;
};
const __pieBrowserCjsCreatePropTypeFactory = () => () => __pieBrowserCjsCreatePropTypeValidator();
const __pieBrowserCjsPropTypeFactories = [
  "arrayOf",
  "exact",
  "instanceOf",
  "objectOf",
  "oneOf",
  "oneOfType",
  "shape"
];
const __pieBrowserCjsPropTypesRequire = new Proxy({
  checkPropTypes: () => {},
  resetWarningCache: () => {}
}, {
  get(target, property) {
    if (property === "__esModule") return false;
    if (property === "default") return __pieBrowserCjsPropTypesRequire;
    if (property in target) return target[property];
    if (__pieBrowserCjsPropTypeFactories.includes(String(property))) {
      return __pieBrowserCjsCreatePropTypeFactory();
    }
    return __pieBrowserCjsCreatePropTypeValidator();
  }
});`);
  }

  lines.push(`const __pieBrowserCjsRequire = (specifier) => {
  switch (specifier) {
    ${specifiers.has('react') ? 'case "react": return __pieBrowserCjsReactRequire;' : ''}
    ${specifiers.has('react-dom') ? 'case "react-dom": return __pieBrowserCjsReactDomRequire;' : ''}
    ${
      specifiers.has('react-dom/client')
        ? 'case "react-dom/client": return __pieBrowserCjsReactDomClientRequire;'
        : ''
    }
    ${
      specifiers.has('classnames')
        ? 'case "classnames": return __pieBrowserCjsClassnamesRequire;'
        : ''
    }
    ${
      specifiers.has('prop-types')
        ? 'case "prop-types": return __pieBrowserCjsPropTypesRequire;'
        : ''
    }
    default:
      throw new Error(\`Unsupported browser CJS require: \${specifier}\`);
  }
};`);

  return `${lines.join('\n')}\n`;
}

export function browserCjsRequireInteropPlugin(): Plugin {
  return {
    name: 'pie-browser-cjs-require-interop',
    generateBundle(_options, bundle) {
      const helperChunksByFileName = new Map<string, HelperChunk>();

      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk' || !output.code.includes(REQUIRE_PROXY_MESSAGE)) {
          continue;
        }

        const helperNames = collectRequireHelperNames(output.code);
        if (helperNames.length === 0) {
          continue;
        }

        const requiredSpecifiers = collectRequireSpecifiers(output.code, helperNames);
        assertSupportedSpecifiers(requiredSpecifiers, (message) => this.error(message));

        helperChunksByFileName.set(output.fileName, {
          chunk: output,
          exportedNames: collectHelperExportNames(output.code, helperNames),
          helperNames,
          requiredSpecifiers,
        });
      }

      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') {
          continue;
        }

        const importedHelpers = collectImportedHelperNames(
          output.code,
          output.fileName,
          helperChunksByFileName
        );
        for (const { helperChunk, localName } of importedHelpers) {
          const requiredSpecifiers = collectRequireSpecifiers(output.code, [localName], {
            importedHelper: true,
          });
          assertSupportedSpecifiers(requiredSpecifiers, (message) => this.error(message));
          for (const specifier of requiredSpecifiers) {
            helperChunk.requiredSpecifiers.add(specifier);
          }
        }
      }

      for (const helperChunk of helperChunksByFileName.values()) {
        if (helperChunk.requiredSpecifiers.size === 0 && helperChunk.exportedNames.size > 0) {
          for (const specifier of SUPPORTED_REQUIRE_SPECIFIERS) {
            helperChunk.requiredSpecifiers.add(specifier);
          }
        }
        if (helperChunk.requiredSpecifiers.size === 0) {
          continue;
        }

        const transformedCode = replaceRequireHelpers(
          helperChunk.chunk.code,
          helperChunk.helperNames
        );
        const insertionIndex = findImportInsertionIndex(transformedCode);
        helperChunk.chunk.code = `${transformedCode.slice(
          0,
          insertionIndex
        )}${makeRequireInteropPrelude(helperChunk.requiredSpecifiers)}${transformedCode.slice(
          insertionIndex
        )}`;
      }
    },
  };
}
