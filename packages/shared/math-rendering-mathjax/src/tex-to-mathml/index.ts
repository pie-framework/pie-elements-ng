/**
 * `@pie-element/shared-math-rendering-mathjax/mathml`: authored HTML with its TeX as MathML Core,
 * for views that show item content without loading MathJax, such as pie-players' item summaries.
 * It reads the dialect delivery typesets: the legacy macros, MathJax's default delimiters and the
 * legacy renderer's `[data-latex]` elements, skipping what `mathjax_ignore` marks. It runs in Node
 * and the browser, and bundles the MathJax it uses.
 */
import { liteAdaptor } from '@mathjax/src/js/adaptors/liteAdaptor.js';
import type { LiteDocument } from '@mathjax/src/js/adaptors/lite/Document.js';
import type { LiteElement, LiteNode } from '@mathjax/src/js/adaptors/lite/Element.js';
import type { LiteText } from '@mathjax/src/js/adaptors/lite/Text.js';
import { STATE } from '@mathjax/src/js/core/MathItem.js';
import type { MathDocument } from '@mathjax/src/js/core/MathDocument.js';
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { mathjax } from '@mathjax/src/js/mathjax.js';
import {
  dataLatexAsInlineMath,
  IGNORE_CLASS,
  LEGACY_MACROS,
  PROCESS_CLASS,
  TEX_MARKERS,
} from '../tex-dialect.js';
import { TEX_PACKAGES } from '../tex-packages.js';
import { MathmlCoreVisitor } from './serialize.js';

type Adaptor = ReturnType<typeof liteAdaptor>;
type Converter = { adaptor: Adaptor; tex: TeX<LiteNode, LiteText, LiteDocument> };

let converter: Converter | undefined;

function getConverter(): Converter {
  if (!converter) {
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    // bussproofs lays proofs out from output metrics, which MathML has none of.
    const packages = TEX_PACKAGES.filter((name) => name !== 'bussproofs');
    converter = { adaptor, tex: new TeX({ packages, macros: { ...LEGACY_MACROS } }) };
  }
  return converter;
}

/**
 * `html` with each TeX expression in it replaced by a `<math>` element in MathML Core. HTML without
 * TeX comes back as given; otherwise it comes back reserialized. TeX that fails to parse becomes
 * MathML's error element, as delivery shows it. Authored `<math>` passes through unchanged. The
 * published declaration is `vite.mathml.config.ts`'s copy of this signature.
 */
export function texToMathml(html: string): string {
  if (!TEX_MARKERS.test(html) && !html.includes('data-latex')) return html;
  const { adaptor, tex } = getConverter();
  const doc: MathDocument<LiteNode, LiteText, LiteDocument> = mathjax.document(html, {
    InputJax: tex,
  });
  const body = adaptor.body(doc.document);
  wrapLatexElements(adaptor, body);
  tex.reset();
  doc.findMath().compile();

  // The document holds a placeholder for each expression, and the serialized MathML replaces it.
  const nonce = Math.random().toString(36).slice(2);
  const mathml: string[] = [];
  const visitor = new MathmlCoreVisitor();
  for (const item of doc.math) {
    item.typesetRoot = adaptor.text(`\u{e000}${nonce}:${mathml.length}\u{e001}`);
    mathml.push(visitor.visitTree(item.root));
    item.state(STATE.TYPESET);
  }
  doc.updateDocument();
  const placeholder = new RegExp(`\u{e000}${nonce}:(\\d+)\u{e001}`, 'gu');
  return adaptor.innerHTML(body).replace(placeholder, (_, i: string) => mathml[Number(i)]);
}

/**
 * Rewrites the LaTeX of each `[data-latex]` element as inline math and marks it handled, as the
 * delivery adapter does, so a renderer run over the output leaves the MathML alone.
 */
function wrapLatexElements(adaptor: Adaptor, root: LiteElement): void {
  for (const element of elements(adaptor, root)) {
    if (!adaptor.hasAttribute(element, 'data-latex')) continue;
    if (adaptor.getAttribute(element, 'data-math-handled')) continue;
    if (isIgnored(adaptor, element, root)) continue;
    const latex = adaptor.textContent(element);
    if (!latex) continue;
    for (const child of [...adaptor.childNodes(element)]) adaptor.remove(child);
    adaptor.append(element, adaptor.text(dataLatexAsInlineMath(latex)));
    adaptor.setAttribute(element, 'data-math-handled', 'true');
  }
}

function* elements(adaptor: Adaptor, node: LiteElement): Generator<LiteElement> {
  for (const child of adaptor.childNodes(node)) {
    const kind = adaptor.kind(child);
    if (kind === '#text' || kind === '#comment') continue;
    yield child as LiteElement;
    yield* elements(adaptor, child as LiteElement);
  }
}

/** Whether MathJax skips `element`: the nearest ignore or process class up to `root` decides. */
function isIgnored(adaptor: Adaptor, element: LiteElement, root: LiteElement): boolean {
  for (let node: LiteElement | null = element; node && node !== root; node = adaptor.parent(node)) {
    if (adaptor.hasClass(node, PROCESS_CLASS)) return false;
    if (adaptor.hasClass(node, IGNORE_CLASS)) return true;
  }
  return false;
}
