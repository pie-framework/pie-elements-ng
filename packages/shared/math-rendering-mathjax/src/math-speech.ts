/**
 * Speaks MathML as English, for the accessible name of a control that contains math. It reads the
 * hidden MathML both MathJax versions emit, so it runs without MathJax's speech engine and its
 * worker, which a strict CSP blocks. Coverage is the school-math core: numbers, identifiers,
 * operators, fences, fractions, roots, scripts, limits on sums and integrals, accents and tables.
 * An element outside it speaks its children in order. A host that wants SRE or another engine
 * passes its own speaker to `mathContentName`.
 */

const SILENT = /[⁡-⁤]/g;

const SIGNS: Record<string, string> = {
  '+': 'positive',
  '-': 'negative',
  '−': 'negative',
  '±': 'plus or minus',
  '∓': 'minus or plus',
};

const OPENING: Record<string, string> = {
  '(': 'open parenthesis',
  '[': 'open bracket',
  '{': 'open brace',
  '⟨': 'open angle bracket',
  '⌊': 'open floor',
  '⌈': 'open ceiling',
};

const CLOSING: Record<string, string> = {
  ')': 'close parenthesis',
  ']': 'close bracket',
  '}': 'close brace',
  '⟩': 'close angle bracket',
  '⌋': 'close floor',
  '⌉': 'close ceiling',
};

/** Operators that follow their operand, so what comes after them is an operator again. */
const POSTFIX: Record<string, string> = {
  '!': 'factorial',
  '%': 'percent',
  '°': 'degrees',
  '′': 'prime',
  '″': 'double prime',
};

const OPERATORS: Record<string, string> = {
  '+': 'plus',
  '-': 'minus',
  '−': 'minus',
  '±': 'plus or minus',
  '∓': 'minus or plus',
  '×': 'times',
  '⋅': 'times',
  '·': 'times',
  '*': 'times',
  '÷': 'divided by',
  '/': 'divided by',
  '=': 'equals',
  '≠': 'does not equal',
  '<': 'is less than',
  '>': 'is greater than',
  '≤': 'is less than or equal to',
  '≥': 'is greater than or equal to',
  '≈': 'is approximately equal to',
  '≡': 'is equivalent to',
  '∝': 'is proportional to',
  '∈': 'is an element of',
  '∉': 'is not an element of',
  '⊂': 'is a subset of',
  '⊆': 'is a subset of or equal to',
  '∪': 'union',
  '∩': 'intersection',
  '→': 'right arrow',
  '←': 'left arrow',
  '⇒': 'implies',
  '⇔': 'if and only if',
  '∑': 'sum',
  '∏': 'product',
  '∫': 'integral',
  '∞': 'infinity',
  '∠': 'angle',
  '⊥': 'is perpendicular to',
  '∥': 'is parallel to',
  '∴': 'therefore',
  ',': 'comma',
  ';': 'semicolon',
  ':': 'colon',
  '|': 'vertical bar',
  '‖': 'double vertical bar',
  ...OPENING,
  ...CLOSING,
  ...POSTFIX,
};

const BARS = new Set(['|', '\u2016']);

const LARGE_OPERATORS = new Set(['∑', '∏', '∫', '∪', '∩']);

const IDENTIFIERS: Record<string, string> = {
  α: 'alpha',
  β: 'beta',
  γ: 'gamma',
  δ: 'delta',
  ε: 'epsilon',
  θ: 'theta',
  λ: 'lambda',
  μ: 'mu',
  π: 'pi',
  ρ: 'rho',
  σ: 'sigma',
  τ: 'tau',
  φ: 'phi',
  ω: 'omega',
  Δ: 'capital delta',
  Σ: 'capital sigma',
  Ω: 'capital omega',
  '∞': 'infinity',
  sin: 'sine',
  cos: 'cosine',
  tan: 'tangent',
  sec: 'secant',
  csc: 'cosecant',
  cot: 'cotangent',
  ln: 'natural log',
  lim: 'limit',
};

/** The accents a `mover` puts over its base, by what the base is then called. */
const ACCENTS: Record<string, string> = {
  '¯': 'bar',
  '‾': 'bar',
  '―': 'bar',
  '^': 'hat',
  ˆ: 'hat',
  '~': 'tilde',
  '˜': 'tilde',
  '→': 'vector',
  '⃗': 'vector',
  '˙': 'dot',
};

const DENOMINATORS: Record<number, [string, string]> = {
  2: ['half', 'halves'],
  3: ['third', 'thirds'],
  4: ['quarter', 'quarters'],
  5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'],
  7: ['seventh', 'sevenths'],
  8: ['eighth', 'eighths'],
  9: ['ninth', 'ninths'],
  10: ['tenth', 'tenths'],
};

const text = (element: Element) =>
  (element.textContent ?? '').replace(SILENT, '').replace(/\s+/g, ' ').trim();

const tidy = (spoken: string) => spoken.replace(/\s+/g, ' ').trim();

const elements = (element: Element) => [...element.children];

/** One token, which needs no `end` marker after it. */
function isAtom(element: Element | undefined): boolean {
  if (!element) return true;
  if (['mn', 'mi', 'mtext', 'mo'].includes(element.localName)) return true;
  return ['mrow', 'mstyle'].includes(element.localName) && element.children.length === 1
    ? isAtom(element.children[0])
    : false;
}

function integer(element: Element | undefined): number | undefined {
  const value = element ? text(element) : '';
  return /^\d{1,3}$/.test(value) ? Number(value) : undefined;
}

function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen
    ? 'th'
    : (({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th');
  return `${n}${suffix}`;
}

function identifier(symbol: string): string {
  return IDENTIFIERS[symbol] ?? symbol;
}

function operator(symbol: string): string {
  return OPERATORS[symbol] ?? symbol;
}

/** The children of an `mrow`, with a sign before an operand spoken as a sign rather than as an operator. */
function sequence(children: Element[]): string {
  const parts: string[] = [];
  let operand = false;

  for (const child of children) {
    if (child.localName !== 'mo') {
      parts.push(speak(child));
      operand = true;
      continue;
    }
    const symbol = text(child);
    if (!symbol) continue;
    if (!operand && SIGNS[symbol]) {
      parts.push(SIGNS[symbol]);
    } else if (symbol in POSTFIX) {
      parts.push(POSTFIX[symbol]);
    } else {
      parts.push(operator(symbol));
      // A bar after an operand closes it; a bar elsewhere opens a new one.
      operand = symbol in CLOSING || (BARS.has(symbol) && operand);
    }
  }

  return parts.filter(Boolean).join(' ');
}

function row(children: Element[]): string {
  const [first, ...rest] = children;
  const last = rest[rest.length - 1];
  const bar = (element?: Element) =>
    element?.localName === 'mo' && ['|', '‖'].includes(text(element));
  const inside = rest.slice(0, -1);
  if (inside.length && bar(first) && bar(last) && text(first) === text(last) && !inside.some(bar)) {
    const inner = tidy(sequence(inside));
    return text(first) === '|'
      ? `absolute value of ${inner} end absolute value`
      : `norm of ${inner} end norm`;
  }
  return sequence(children);
}

function fraction(numerator: Element | undefined, denominator: Element | undefined): string {
  const n = integer(numerator);
  const d = integer(denominator);
  const names = d === undefined ? undefined : DENOMINATORS[d];
  if (n !== undefined && names) return `${n} ${n === 1 ? names[0] : names[1]}`;

  const top = numerator ? speak(numerator) : '';
  const bottom = denominator ? speak(denominator) : '';
  return isAtom(numerator) && isAtom(denominator)
    ? `${top} over ${bottom}`
    : `the fraction with numerator ${top} and denominator ${bottom}`;
}

function root(radicand: string, index: string, atom: boolean): string {
  return atom ? `${index} of ${radicand}` : `${index} of ${radicand} end root`;
}

function power(base: string, exponent: Element | undefined): string {
  const value = exponent ? text(exponent) : '';
  if (exponent && isAtom(exponent)) {
    if (value === '2') return `${base} squared`;
    if (value === '3') return `${base} cubed`;
    if (value in POSTFIX) return `${base} ${POSTFIX[value]}`;
  }
  const spoken = exponent ? speak(exponent) : '';
  return isAtom(exponent)
    ? `${base} to the power of ${spoken}`
    : `${base} to the power of ${spoken} end power`;
}

function subscript(base: string, sub: Element | undefined): string {
  const spoken = sub ? speak(sub) : '';
  return isAtom(sub) ? `${base} sub ${spoken}` : `${base} sub ${spoken} end sub`;
}

/** A sum, product, integral or limit, with the bounds that sit on it. */
function limits(
  base: Element,
  lower: Element | undefined,
  upper: Element | undefined
): string | undefined {
  const symbol = text(base);
  if (symbol === 'lim') return `limit as ${lower ? speak(lower) : ''} of`;
  if (!LARGE_OPERATORS.has(symbol)) return undefined;
  const from = lower ? `from ${speak(lower)}` : '';
  const to = upper ? `to ${speak(upper)}` : '';
  return `${operator(symbol)} ${from} ${to} of`;
}

function table(element: Element): string {
  const rows = elements(element).filter((child) => ['mtr', 'mlabeledtr'].includes(child.localName));
  const cells = rows.map((tr) => elements(tr).filter((cell) => cell.localName === 'mtd'));
  const columns = Math.max(0, ...cells.map((r) => r.length));
  const spoken = cells.map(
    (r, i) => `row ${i + 1}: ${r.map((cell) => tidy(sequence(elements(cell)))).join(', ')}`
  );
  return `table with ${rows.length} ${rows.length === 1 ? 'row' : 'rows'} and ${columns} ${
    columns === 1 ? 'column' : 'columns'
  }. ${spoken.join('. ')}`;
}

function fenced(element: Element): string {
  const open = element.getAttribute('open') ?? '(';
  const close = element.getAttribute('close') ?? ')';
  const separators = (element.getAttribute('separators') ?? ',').replace(/\s+/g, '').split('');
  const parts = elements(element).map((child, i, all) =>
    i < all.length - 1
      ? `${speak(child)} ${operator(separators[Math.min(i, separators.length - 1)] ?? ',')}`
      : speak(child)
  );
  return [operator(open), ...parts, operator(close)].filter(Boolean).join(' ');
}

function speak(element: Element): string {
  const children = elements(element);
  switch (element.localName) {
    case 'mi':
      return identifier(text(element));
    case 'mn':
    case 'mtext':
    case 'ms':
      return text(element);
    case 'mo':
      return operator(text(element));
    case 'mspace':
    case 'mphantom':
    case 'annotation':
    case 'annotation-xml':
      return '';
    case 'semantics':
      return children[0] ? speak(children[0]) : '';
    case 'mfrac':
      return fraction(children[0], children[1]);
    case 'msqrt': {
      const radicand = tidy(sequence(children));
      return root(radicand, 'square root', children.length === 1 && isAtom(children[0]));
    }
    case 'mroot': {
      const n = integer(children[1]);
      const index =
        n === 2
          ? 'square root'
          : n === 3
            ? 'cube root'
            : n
              ? `${ordinal(n)} root`
              : `root with index ${children[1] ? speak(children[1]) : ''}`;
      return root(children[0] ? speak(children[0]) : '', index, isAtom(children[0]));
    }
    case 'msup':
      return power(children[0] ? speak(children[0]) : '', children[1]);
    case 'msub':
      return subscript(children[0] ? speak(children[0]) : '', children[1]);
    case 'msubsup': {
      const bounded = children[0] ? limits(children[0], children[1], children[2]) : undefined;
      if (bounded) return bounded;
      return power(subscript(children[0] ? speak(children[0]) : '', children[1]), children[2]);
    }
    case 'munder':
    case 'mover':
    case 'munderover': {
      const [base, a, b] = children;
      const lower = element.localName === 'mover' ? undefined : a;
      const upper =
        element.localName === 'munder' ? undefined : element.localName === 'mover' ? a : b;
      const bounded = base ? limits(base, lower, upper) : undefined;
      if (bounded) return bounded;
      const spokenBase = base ? speak(base) : '';
      const accent = element.localName === 'mover' && a ? ACCENTS[text(a)] : undefined;
      if (accent) return accent === 'vector' ? `vector ${spokenBase}` : `${spokenBase} ${accent}`;
      return [
        spokenBase,
        lower ? `with ${speak(lower)} below` : '',
        upper ? `with ${speak(upper)} above` : '',
      ]
        .filter(Boolean)
        .join(' ');
    }
    case 'mfenced':
      return fenced(element);
    case 'mtable':
      return table(element);
    case 'mrow':
    case 'math':
      return row(children);
    default:
      return children.length ? sequence(children) : text(element);
  }
}

/** The English speech of one `<math>` element. */
export function speakMathml(math: Element): string {
  return tidy(speak(math));
}
