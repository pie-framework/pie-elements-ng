import { MathMLToLaTeX } from '@pie-framework/mathml-to-latex';
import { mmlToLatex } from '@pie-element/shared-math-rendering-mathjax';

/**
 * MathML to LaTeX for editing, through `@pie-framework/mathml-to-latex`, the converter the legacy
 * renderer uses. It mistakes several constructs authored content holds, writing LaTeX that reads
 * wrong or that MathJax cannot read at all. Those are fixed here, in the MathML before it converts
 * and in the LaTeX after, so that the rest of what it writes stays as the legacy editor had it.
 */

// The invisible operators: function application, times, separator and plus. They only space the
// math, and the converter writes them into the LaTeX as they are, the separator as `\llbracket`.
const INVISIBLE_OPERATOR = /^[⁡-⁤]$/;

// Function names, which the converter writes as letters: `sin x` for `\sin x`.
const FUNCTION_NAMES = new Set(
  'arccos arcsin arctan arg cos cosh cot coth csc deg det dim exp gcd hom inf ker lg lim ln log max min Pr sec sin sinh sup tan tanh'.split(
    ' '
  )
);

// What a `munderover` with an empty under writes, which stands in for each `msup` (see `rewrite`).
const EMPTY_SUBSCRIPT = /_\{\}\^/g;

// `\left.` and `\right.` come out of the converter for every `|`, unpaired. `balanceFences` pairs
// the fences again, and gives `\left.` or `\right.` only to a fence that has no partner.
const EMPTY_FENCE = /\\left\.\s*|\\right\.\s*/g;

// The arrows the converter writes as accents wherever they are, `x \overrightarrow 0` for `x → 0`.
// Over a base, as an accent, they are followed by it in braces.
const ARROW_AS_OPERATOR = /\\over(right|leftright)arrow(?!\{)/g;

// The converter writes `°` as `\degree`, which MathJax does not define.
const DEGREE = /\\degree(?![a-zA-Z])/g;

// The converter writes prescripts as `\_{1}^{2}C`, an underscore character, for `{}_{1}^{2}C`.
const PRESCRIPT = /\\_\{/g;

// A fence, `\left(`, but not `\leftarrow`; an environment's start or end; a command; a brace; text.
const FENCE_TOKEN =
  /\\(left|right)(?![a-zA-Z])\s*(\\[a-zA-Z]+|\\.|[^\s\\])|\\(begin|end)\{[^}]*\}|\\[a-zA-Z]+|\\.|[{}]|[^\\{}]+/g;

const ESCAPED_DELIMITERS: Record<string, string> = { '{': '\\{', '}': '\\}' };

// Fences that open and close alike, so that the second of two closes the first.
const SAME_BOTH_SIDES = new Set(['|', '\\|']);

const parse = (mathMl: string): HTMLElement => {
  // An inert document, so that nothing the markup holds loads or runs.
  const span = document.implementation.createHTMLDocument('').createElement('span');

  span.innerHTML = mathMl;

  return span;
};

/**
 * Markup as XML, as the converter reads it, with no `&nbsp;`, which XML does not know and some
 * serializers still write.
 */
const serialize = (nodes: Node[]): string => {
  const serializer = new XMLSerializer();

  return nodes
    .map((node) => serializer.serializeToString(node))
    .join('')
    .replaceAll('&nbsp;', '&#xA0;');
};

const create = (near: Element, name: string, text?: string): Element => {
  const element = near.ownerDocument.createElementNS(near.namespaceURI, name);

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
};

const isFence = (element: Element | null) => element?.localName === 'mo';

/**
 * Rewrites what the converter mistakes into MathML it reads right. Its `<mi>` keeps text it does not
 * know as it is, so LaTeX made here goes through it unchanged.
 */
const rewrite = (root: Element) => {
  for (const mo of Array.from(root.querySelectorAll('mo'))) {
    if (INVISIBLE_OPERATOR.test(mo.textContent?.trim() ?? '')) {
      mo.remove();
    }
  }

  for (const token of Array.from(root.querySelectorAll('mi, mo'))) {
    const name = token.textContent?.trim() ?? '';

    if (FUNCTION_NAMES.has(name)) {
      token.textContent = `\\${name}`;
    }
  }

  // A fraction with no bar, a binomial coefficient's: the converter gives it a bar. Innermost first,
  // so that each one's parts are converted once.
  for (const mfrac of Array.from(root.querySelectorAll('mfrac')).reverse()) {
    if (mfrac.children.length !== 2 || Number.parseFloat(mfrac.getAttribute('linethickness') ?? '') !== 0) {
      continue;
    }

    const [top, bottom] = Array.from(mfrac.children, (part) => latexOf(`<math>${serialize([part])}</math>`));

    mfrac.replaceWith(create(mfrac, 'mi', `{${top} \\atop ${bottom}}`));
  }

  // The converter drops the caret of every `msup` but a prime's, so `x²` reads back as `x2`. Its
  // `munderover` is sound, so each `msup` goes to it with an empty under. Not its `msubsup`, which
  // parenthesizes a fenced base a second time. A base of several parts gets parentheses, as `a + b`
  // with an exponent would read as `a + b^{2}`, unless it is fenced already.
  for (const msup of Array.from(root.querySelectorAll('msup'))) {
    if (msup.children.length !== 2) {
      continue;
    }

    const [base, superscript] = Array.from(msup.children);
    const munderover = create(msup, 'munderover');

    if (
      base.localName === 'mrow' &&
      base.children.length > 1 &&
      !(isFence(base.firstElementChild) && isFence(base.lastElementChild))
    ) {
      base.prepend(create(msup, 'mo', '('));
      base.append(create(msup, 'mo', ')'));
    }

    munderover.append(base, create(msup, 'mrow'), superscript);
    msup.replaceWith(munderover);
  }

  // The converter writes the outermost table as bare rows, `1 & 2 \\ 3 & 4`, which only an
  // environment can hold, and a table inside it as a `matrix`. So each outermost table goes inside
  // one more. Not within an `mfenced`, which writes its tables as matrices itself.
  for (const mtable of Array.from(root.querySelectorAll('mtable'))) {
    if (mtable.parentElement?.closest('mtable, mfenced')) {
      continue;
    }

    const outer = create(mtable, 'mtable');
    const row = create(mtable, 'mtr');
    const cell = create(mtable, 'mtd');

    outer.append(row);
    row.append(cell);
    mtable.replaceWith(outer);
    cell.append(mtable);
  }
};

/**
 * The LaTeX with every `\left` closed by a `\right` in its group. The converter writes each fence of
 * the MathML as its own `\left` or `\right`, wherever its partner is, `|` as `\left|` both times,
 * and braces unescaped. Fences that pair up stay sized; one without a partner gets an empty one.
 */
const balanceFences = (latex: string): string => {
  const out: string[] = [];
  const groups: { start: number; open: string[] }[] = [{ start: 0, open: [] }];
  const closeAll = (group: { open: string[] }) => out.push(...group.open.map(() => '\\right.'));

  for (const [token, side, written, environment] of latex.matchAll(FENCE_TOKEN)) {
    const group = groups[groups.length - 1];

    if (side) {
      const delimiter = ESCAPED_DELIMITERS[written] ?? written;
      const closes = side === 'right' || (SAME_BOTH_SIDES.has(delimiter) && group.open.at(-1) === delimiter);

      if (!closes) {
        group.open.push(delimiter);
        out.push(`\\left${delimiter}`);
        continue;
      }

      if (!group.open.pop()) {
        out.splice(group.start, 0, '\\left.');
      }

      out.push(`\\right${delimiter}`);
    } else if (token === '{' || environment === 'begin') {
      out.push(token);
      groups.push({ start: out.length, open: [] });
    } else if ((token === '}' || environment === 'end') && groups.length > 1) {
      closeAll(group);
      groups.pop();
      out.push(token);
    } else {
      out.push(token);
    }
  }

  for (const group of groups.reverse()) {
    closeAll(group);
  }

  return out.join('');
};

const tidy = (latex: string): string =>
  balanceFences(
    latex
      .replace(EMPTY_SUBSCRIPT, '^')
      .replace(EMPTY_FENCE, '')
      .replace(ARROW_AS_OPERATOR, '\\$1arrow')
      .replaceAll('^{\\degree}', '^{\\circ}')
      .replace(DEGREE, '^{\\circ}')
      .replace(PRESCRIPT, '{}_{')
  );

const prepare = (mathMl: string): string => {
  const root = parse(mathMl);

  rewrite(root);

  return serialize(Array.from(root.childNodes));
};

const latexOf = (mathMl: string): string => tidy(MathMLToLaTeX.convert(prepare(mathMl)));

/**
 * LaTeX for a MathML string, or null when there is none to give. A converter the page installed,
 * such as the legacy renderer's, answers first; `mmlToLatex` gives the input back when there is
 * none, and then this converts, so the ESM page, which installs only `renderMath`, converts too.
 * The legacy renderer's converter is this one, so both read the rewritten MathML.
 * The converter belongs here, not in the math adapter: only authoring needs it, and every
 * element's delivery bundle carries the adapter. It answers an empty string for MathML it cannot
 * read and throws on some; neither is LaTeX, and neither may become a math node.
 */
export const convertMathMlToLatex = (mathMl: string): string | null => {
  let prepared: string;
  let converted: string;

  try {
    prepared = prepare(mathMl.replaceAll('&nbsp;', ' '));
    converted = mmlToLatex(prepared);

    if (converted === prepared) {
      converted = MathMLToLaTeX.convert(prepared);
    }
  } catch {
    return null;
  }

  if (!converted || converted === prepared) {
    return null;
  }

  return tidy(converted) || null;
};
