export type RewriteOptions = {
  esmShBaseUrl: string;
};

function shouldRewrite(specifier: string): boolean {
  if (!specifier) return false;
  if (specifier.startsWith('./') || specifier.startsWith('../')) return false;
  if (specifier.startsWith('/')) return false;
  if (specifier.startsWith('http://') || specifier.startsWith('https://')) return false;
  if (specifier.startsWith('@pie-element/')) return false;
  if (specifier.startsWith('@pie-lib/')) return false;
  return true;
}

function toEsmShUrl(specifier: string, esmShBaseUrl: string): string {
  const base = esmShBaseUrl.endsWith('/') ? esmShBaseUrl : `${esmShBaseUrl}/`;
  return `${base}${specifier}`;
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
      const next = shouldRewrite(spec) ? toEsmShUrl(spec, opts.esmShBaseUrl) : spec;
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
  const rewriteSpec = (spec: string) =>
    shouldRewrite(spec) ? toEsmShUrl(spec, opts.esmShBaseUrl) : spec;

  // from "x" / from 'x'
  code = code.replace(
    /(\bfrom\s+["'])([^"']+)(["'])/g,
    (_m, a, spec, c) => `${a}${rewriteSpec(spec)}${c}`
  );

  // import("x") / import('x')
  code = code.replace(
    /(\bimport\s*\(\s*["'])([^"']+)(["']\s*\))/g,
    (_m, a, spec, c) => `${a}${rewriteSpec(spec)}${c}`
  );

  // import "x" / import 'x' (side-effect import)
  code = code.replace(
    /(\bimport\s+["'])([^"']+)(["'])/g,
    (_m, a, spec, c) => `${a}${rewriteSpec(spec)}${c}`
  );

  return code;
}

export async function rewriteImports(code: string, opts: RewriteOptions): Promise<string> {
  const lexer = await tryRewriteWithEsModuleLexer(code, opts);
  if (lexer != null) return lexer;
  return rewriteWithRegexFallback(code, opts);
}
