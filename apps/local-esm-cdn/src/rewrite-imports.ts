export type RewriteOptions = {
  esmShBaseUrl: string;
  pkg?: string; // e.g., "@pie-lib/render-ui"
  subpath?: string; // e.g., "controller/index" or empty
};

function shouldRewriteToEsmSh(specifier: string): boolean {
  if (!specifier) return false;
  if (specifier.startsWith('./') || specifier.startsWith('../')) return false;
  if (specifier.startsWith('/')) return false;
  if (specifier.startsWith('http://') || specifier.startsWith('https://')) return false;
  if (specifier.startsWith('@pie-element/')) return false;
  if (specifier.startsWith('@pie-lib/')) return false;
  if (specifier.startsWith('@pie-elements-ng/')) return false;
  if (specifier.startsWith('@pie-framework/')) return false;
  return true;
}

function rewriteSpecifier(specifier: string, opts: RewriteOptions): string {
  // Rewrite external packages to esm.sh
  if (shouldRewriteToEsmSh(specifier)) {
    const base = opts.esmShBaseUrl.endsWith('/') ? opts.esmShBaseUrl : `${opts.esmShBaseUrl}/`;
    return `${base}${specifier}`;
  }

  // Rewrite relative imports to absolute package imports
  if (opts.pkg && (specifier.startsWith('./') || specifier.startsWith('../'))) {
    // For relative imports, convert to absolute package path
    // e.g., "./feedback.js" in @pie-lib/render-ui becomes "/@pie-lib/render-ui/feedback.js"

    // Remove leading ./ or ../
    let cleaned = specifier;
    if (cleaned.startsWith('./')) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith('../')) {
      // Handle ../ by going up in the subpath
      // For now, just remove the ../
      cleaned = cleaned.slice(3);
    }

    // Construct absolute path
    if (opts.subpath) {
      // If we're in a subpath, go up one level
      const parts = opts.subpath.split('/');
      parts.pop(); // Remove the file part
      if (parts.length > 0) {
        return `/${opts.pkg}/${parts.join('/')}/${cleaned}`;
      }
    }

    return `/${opts.pkg}/${cleaned}`;
  }

  return specifier;
}

async function tryRewriteWithEsModuleLexer(
  code: string,
  opts: RewriteOptions
): Promise<string | null> {
  try {
    // Optional dependency: present via workspace deps in many setups.
    // If it's missing, we'll fall back to a simple regex approach.
    const mod = (await import('es-module-lexer')) as unknown as {
      init: Promise<void>;
      parse: (source: string) => [{ s: number; e: number }[], unknown];
    };

    await mod.init;
    const [imports] = mod.parse(code);

    let out = '';
    let last = 0;
    for (const i of imports) {
      const spec = code.slice(i.s, i.e);
      const next = rewriteSpecifier(spec, opts);
      if (next !== spec) {
        out += code.slice(last, i.s);
        out += next;
        last = i.e;
      }
    }
    out += code.slice(last);
    return out;
  } catch {
    return null;
  }
}

function rewriteWithRegexFallback(code: string, opts: RewriteOptions): string {
  // from "x" / from 'x'
  code = code.replace(
    /(\bfrom\s+["'])([^"']+)(["'])/g,
    (_m, a, spec, c) => `${a}${rewriteSpecifier(spec, opts)}${c}`
  );

  // import("x") / import('x')
  code = code.replace(
    /(\bimport\s*\(\s*["'])([^"']+)(["']\s*\))/g,
    (_m, a, spec, c) => `${a}${rewriteSpecifier(spec, opts)}${c}`
  );

  // import "x" / import 'x' (side-effect import)
  code = code.replace(
    /(\bimport\s+["'])([^"']+)(["'])/g,
    (_m, a, spec, c) => `${a}${rewriteSpecifier(spec, opts)}${c}`
  );

  return code;
}

export async function rewriteImports(code: string, opts: RewriteOptions): Promise<string> {
  const lexer = await tryRewriteWithEsModuleLexer(code, opts);
  if (lexer != null) return lexer;
  return rewriteWithRegexFallback(code, opts);
}
