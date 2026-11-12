// @ts-nocheck

/**
 * LaTeX translation layer between the MathQuill-era content model and MathLive.
 *
 * Two independent concerns live here:
 *
 *  1. Newlines. MathQuill had no line break, so pie-lib registered a custom
 *     `newLine` embed that serialises to `\embed{newLine}[]`. MathLive has no
 *     embed system but supports real multiline environments, so we translate
 *     `\embed{newLine}[]` <-> `\\` inside `\displaylines{}`.
 *
 *     Authored content keeps its `\embed{newLine}[]` on-disk form (that is what
 *     @pie-lib/math-rendering already normalises for MathJax), so each renderer
 *     normalises at its own boundary and stored items stay compatible.
 *
 *  2. Keypad key -> MathLive action. MathQuill keys carry `write`/`command`/
 *     `keystroke` built for `mf.write()` / `mf.cmd()` / `mf.keystroke()`.
 *     MathLive has `insert()` and `executeCommand()` instead.
 */

export const NEWLINE_EMBED = '\\embed{newLine}[]';
const DISPLAYLINES_REGEX = /^\\displaylines\{([\s\S]*)\}$/;

/**
 * MathQuill's editable sub-field syntax, e.g. `\MathQuillMathField[r1]{}`.
 * These are the answer blocks in templated math items; MathLive expresses the
 * same idea as `\placeholder[id]{}` and reads them back via the prompts API.
 */
const MQ_FIELD = '\\MathQuillMathField';
const PLACEHOLDER = '\\placeholder';

/**
 * Index of the `}` that closes the group opened at `open`, or -1. Escaped braces
 * (`\{`, `\}`) do not count.
 *
 * @param {string} latex
 * @param {number} open index of a `{`
 * @returns {number}
 */
const groupEnd = (latex, open) => {
  let depth = 0;

  for (let i = open; i < latex.length; i++) {
    const ch = latex[i];

    if (ch === '\\') {
      i += 1;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
};

/**
 * Replace every `<command>[id]{content}`, where content may hold nested groups
 * (an answer such as `\frac{1}{2}`), with what `fn(id, content)` returns.
 *
 * @param {string} latex
 * @param {string} command e.g. `\MathQuillMathField`
 * @param {(id: string, content: string) => string} fn
 * @returns {string}
 */
const replaceFields = (latex, command, fn) => {
  const head = new RegExp(`${command.replace(/\\/g, '\\\\')}\\[([^\\]]*)\\]\\{`, 'g');
  let out = '';
  let from = 0;
  let match;

  while ((match = head.exec(latex)) !== null) {
    const open = match.index + match[0].length - 1;
    const close = groupEnd(latex, open);

    if (close === -1) {
      break;
    }

    out += latex.slice(from, match.index) + fn(match[1], latex.slice(open + 1, close));
    from = close + 1;
    head.lastIndex = from;
  }

  return out + latex.slice(from);
};

/**
 * Split latex on `separator` where it sits at the top level: outside any brace
 * group and any `\begin`/`\end` environment, so a matrix's `\\` row separators
 * and anything inside an answer box stay put.
 *
 * @param {string} latex
 * @param {string} separator
 * @returns {string[]}
 */
const splitTopLevel = (latex, separator) => {
  const parts = [];
  let depth = 0;
  let start = 0;
  let i = 0;

  while (i < latex.length) {
    if (depth === 0 && latex.startsWith(separator, i)) {
      parts.push(latex.slice(start, i));
      i += separator.length;
      start = i;
      continue;
    }

    const ch = latex[i];

    if (ch === '\\') {
      const command = latex.slice(i).match(/^\\(?:[a-zA-Z]+|.)/);
      const name = command ? command[0] : ch;

      if (name === '\\begin') {
        depth += 1;
      } else if (name === '\\end') {
        depth -= 1;
      }

      i += name.length;
      continue;
    }

    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
    }

    i += 1;
  }

  parts.push(latex.slice(start));

  return parts;
};

/**
 * Line breaks inside a group (an answer field holding a multiline answer, or the
 * blank lines of a print view) cannot be `\displaylines` rows, which only work
 * at the top level. Each such group becomes a one-column array instead.
 *
 * @param {string} latex
 * @returns {string}
 */
const nestedLineBreaksToArrays = (latex) => {
  if (latex.indexOf(NEWLINE_EMBED) === -1) {
    return latex;
  }

  let out = '';
  let i = 0;

  while (i < latex.length) {
    const ch = latex[i];

    if (ch === '\\') {
      out += latex.slice(i, i + 2);
      i += 2;
      continue;
    }

    if (ch === '{') {
      const close = groupEnd(latex, i);

      if (close !== -1) {
        const lines = splitTopLevel(nestedLineBreaksToArrays(latex.slice(i + 1, close)), NEWLINE_EMBED);

        out += `{${lines.length > 1 ? `\\begin{array}{l}${lines.join(' \\\\ ')}\\end{array}` : lines[0]}}`;
        i = close + 1;
        continue;
      }
    }

    out += ch;
    i += 1;
  }

  return out;
};

/**
 * A bare `$` is a literal dollar sign in stored latex (MathQuill and MathJax
 * read it so), but MathLive's parser takes it as a math-mode delimiter and drops
 * it. `\$` is the dollar sign to MathLive.
 *
 * @param {string} latex
 * @returns {string}
 */
const escapeDollars = (latex) => {
  if (latex.indexOf('$') === -1) {
    return latex;
  }

  let out = '';

  for (let i = 0; i < latex.length; i++) {
    if (latex[i] === '\\') {
      out += latex.slice(i, i + 2);
      i += 1;
    } else {
      out += latex[i] === '$' ? '\\$' : latex[i];
    }
  }

  return out;
};

/**
 * Unnamed placeholders, which MathLive inserts on its own.
 *
 * Typing a command with empty arguments (`\longdiv{}`, `\frac{}{}`) makes
 * MathLive serialise the empty slots as `\placeholder{}`. That token is
 * MathLive-specific: MathJax - which @pie-lib/math-rendering uses to render
 * prompts and previews - has no such command and renders it as red error text.
 * Stored latex must therefore keep plain empty groups.
 */
const BARE_PLACEHOLDER_REGEX = /\\placeholder\{([^{}]*)\}/g;
const BARE_PLACEHOLDER_NO_ARG_REGEX = /\\placeholder(?![[{a-zA-Z])/g;

/**
 * Response areas in authored templates, e.g. `\embed{answerBlock}[r1]`.
 *
 * MathQuill drew these through an embed's `htmlString`. MathLive has no embed
 * system, so the stored form maps to the `\answerBlock{id}` macro (see
 * `PIE_MACROS`), which renders a labelled box and serialises back unchanged:
 * the macro does not expand, so a block is one atom that a single backspace
 * removes.
 */
const ANSWER_BLOCK_EMBED_REGEX = /\\embed\{answerBlock\}\[([^\]]*)\]/g;
const ANSWER_BLOCK_MACRO_REGEX = /\\answerBlock\{([^{}]*)\}/g;

/**
 * Static latex for a filled response area: the answer inside the same box a
 * `\answerBlock` draws, tagged `data-answer-block` with the response id.
 *
 * This replaces MathQuill's pattern of rendering an empty embed and then
 * running `applyStaticMath` on a span inside it, which has no equivalent in
 * MathLive's markup.
 *
 * @param {string} id response id, e.g. `r1`
 * @param {string} [answer] stored latex of the answer
 * @returns {string}
 */
export const answerBlockLatex = (id, answer) => {
  // A line break inside the box cannot be a top-level `\displaylines` row, so a
  // multiline answer becomes a one-column array.
  const lines = answer ? splitTopLevel(answer, NEWLINE_EMBED) : [];
  const content =
    lines.length > 1 ? `\\begin{array}{l}${lines.join(' \\\\ ')}\\end{array}` : answer || '\\phantom{0}';

  return `\\htmlData{answer-block=${id}}{\\boxed{\\htmlData{answer-block-index=${id}}{\\textsf{R}}\\enspace ${content}}}`;
};

/** Default id used when stored latex has an unnamed field. */
export const DEFAULT_FIELD_ID = 'r1';

/**
 * A visible stand-in for an empty argument slot, used for STATIC rendering only.
 *
 * Stored latex legitimately contains empty groups - `\longdiv{}`, `\frac{}{}`,
 * `x^{}` - to express a command's shape. MathQuill drew those as a shaded box
 * (`.mq-empty`); MathLive renders `{}` as nothing, so `convertLatexToMarkup`
 * output comes out completely blank (not even the surrounding bracket, in the
 * case of `\enclose{longdiv}{}`).
 *
 * `\placeholder{}` is not usable here: in static markup it renders as a
 * non-breaking space, because its editable box only exists inside a live
 * mathfield. So something with real width is required.
 *
 * It must be a `\rule`, not a unicode glyph. A glyph's width comes from font
 * metrics, and U+25AB is not in the KaTeX fonts - the browser substitutes a
 * wider fallback while MathLive still sizes surrounding accents from its own
 * metrics. That left stretchy accents (`\overarc`, `\overleftrightarrow`)
 * visibly narrower than the box they were meant to span. A rule carries an
 * explicit em width, so accents size correctly - and a filled box is closer to
 * MathQuill's `.mq-empty` anyway.
 *
 * Live mathfields need none of this - MathLive manages empty slots itself.
 */
const EMPTY_SLOT = '\\htmlData{pie-empty=1}{\\rule{0.55em}{0.55em}}';
const EMPTY_GROUP_REGEX = /\{\s*\}/g;
// The smallest boxes are the ones in a subscript (`x_{}`, `\log_{}`) or exponent
// (`x^{}`): they sit at script size, so the 0.55em square reads cramped. They get
// 0.4em more height, and `\rule[-d]` decides which side it grows on:
//  - subscript / log base: all of it goes below, the top edge stays put;
//  - exponent: 0.3em goes above, plus 0.1em below.
const EMPTY_SUBSCRIPT_REGEX = /_\{\s*\}/g;
const EMPTY_SUPERSCRIPT_REGEX = /\^\{\s*\}/g;
const EMPTY_SUBSCRIPT_SLOT = '\\htmlData{pie-empty=1}{\\rule[-0.4em]{0.55em}{0.95em}}';
// The label clips what hangs below its line box (`overflow: hidden`), so the lowered
// box needs a zero-width strut after it to make room, or its bottom is cut off.
const EMPTY_SUBSCRIPT_STRUT = '\\rule[-0.5em]{0em}{0.5em}';
const EMPTY_SUPERSCRIPT_SLOT = '\\htmlData{pie-empty=1}{\\rule[-0.1em]{0.55em}{0.95em}}';
// The segment key (`\overline{}`). The keypad centres every label in its cell, and
// a thin bar is a much shorter label than the ray and line keys' stretchy arrows,
// so by default both its bar and its box sit off from theirs: the bar is lower
// than the arrows' shafts, and the box higher than theirs. Two zero-width struts
// fix that, found by rendering the three keys at 14-28px and measuring:
//  - inside the bar, above the box: pushes the bar up to the height of the
//    arrows' shafts (the bar-to-box distance then matches theirs);
//  - before the bar, from the baseline: raises the label's top, which moves the
//    whole label down so the box lands where theirs does.
const EMPTY_OVERLINE_REGEX = /\\overline\{\s*\}/g;
const EMPTY_OVERLINE_BAR_STRUT = '\\rule{0em}{0.87em}';
const EMPTY_OVERLINE_LABEL_STRUT = '\\rule{0em}{1.3em}';
// Empty delimiter pairs: `\abs{}` is converted to `\left|\right|`, and the
// parenthesis / bracket keys are `\left(\right)` / `\left[\right]`. None has a
// `{}` group for the rule above to catch, so they would render as bare fences.
const EMPTY_FENCE_REGEX = /\\left([([|])\s*\\right([)\]|])/g;
// The same muted fill as the other slots (`pie-empty`), but a tall rectangle
// rather than a square. It also sets the fences' height: `\left...\right` stretch
// to their content, so a taller slot gives taller parentheses.
//
// A `\rule` stands on the baseline, but the fences are centred on the math axis
// (0.25em above it), so an un-lifted box sat high between them. `[-0.25em]`
// lowers it by (axis - height / 2) = 0.25 - 1 / 2, centring it on the axis.
//
// Lowering it alone also shrinks the fences, which size themselves to their
// content (MathLive switches to short bars). The zero-width `\rule{0em}{1em}`
// strut keeps the content as tall as before, so the bars keep their height and
// only the box moves.
const EMPTY_FENCE_SLOT = '\\rule{0em}{1em}\\htmlData{pie-empty=1}{\\rule[-0.25em]{0.55em}{1em}}';

/**
 * Make empty argument slots visible, for static rendering.
 *
 * Display-only: never feed the result to a mathfield or to storage - the
 * original latex is what gets typed and saved.
 *
 * @param {string} latex
 * @returns {string}
 */
export const withVisibleEmptySlots = (latex) =>
  (latex || '')
    .replace(EMPTY_OVERLINE_REGEX, `${EMPTY_OVERLINE_LABEL_STRUT}\\overline{${EMPTY_OVERLINE_BAR_STRUT}${EMPTY_SLOT}}`)
    .replace(EMPTY_SUBSCRIPT_REGEX, `_{${EMPTY_SUBSCRIPT_SLOT}}${EMPTY_SUBSCRIPT_STRUT}`)
    .replace(EMPTY_SUPERSCRIPT_REGEX, `^{${EMPTY_SUPERSCRIPT_SLOT}}`)
    .replace(EMPTY_GROUP_REGEX, `{${EMPTY_SLOT}}`)
    .replace(EMPTY_FENCE_REGEX, (_m, open, close) => `\\left${open}${EMPTY_FENCE_SLOT}\\right${close}`);

/**
 * Pie commands that take an argument, and their native MathLive equivalents.
 *
 * These MUST NOT be handled as MathLive macros. A macro is serialised from the
 * arguments it was created with, so text typed inside its expansion never makes
 * it back out: `getValue('latex')` keeps returning `\longdiv{\placeholder{}}`
 * while `getValue('ascii-math')` shows the typed content. Setting
 * `captureSelection: false` lets the cursor in but does not change
 * serialisation.
 *
 * Expanding to native constructs instead gives real, editable atoms that
 * round-trip. All three targets are understood by MathJax too, so stored latex
 * still renders in @pie-lib/math-rendering without a reverse mapping.
 */
/**
 * Rewrite argument-taking pie commands into native MathLive latex.
 * Applied on the way *into* a mathfield.
 *
 * @param {string} latex
 * @returns {string}
 */
export const toNativeCommands = (latex) => {
  if (typeof latex !== 'string' || !latex) {
    return latex || '';
  }

  let out = latex;

  // \abs{x} -> \left|x\right| needs brace-aware handling, the rest are prefix
  // swaps.
  out = replaceAbs(out);
  out = out.replace(/\\longdiv\{/g, '\\enclose{longdiv}{');
  out = out.replace(/\\overarc\{/g, '\\overparen{');
  out = escapeBareComments(out);

  return out;
};

/**
 * Escape an unescaped `%`.
 *
 * In real LaTeX `%` starts a comment, so MathLive discards it *and everything
 * after it*: `50%` renders as `50`, and `x%y` as just `x`. MathQuill had no
 * such notion - it treated `%` as a symbol - so latex from anywhere outside the
 * keypad may still carry a bare one.
 *
 * Only a `%` preceded by an even number of backslashes is bare: `\%` is already
 * escaped, while the `%` in `\\%` (a line break, then a comment) is not.
 *
 * @param {string} latex
 * @returns {string}
 */
const escapeBareComments = (latex) => {
  if (latex.indexOf('%') === -1) {
    return latex;
  }

  let out = '';
  // Consecutive backslashes immediately before the current character.
  let backslashes = 0;

  for (let i = 0; i < latex.length; i++) {
    const ch = latex[i];

    out += ch === '%' && backslashes % 2 === 0 ? '\\%' : ch;
    backslashes = ch === '\\' ? backslashes + 1 : 0;
  }

  return out;
};

/** `\abs{x}` -> `\left|x\right|`, matching balanced braces. */
const replaceAbs = (latex) => {
  let out = latex;
  let idx = out.indexOf('\\abs{');

  while (idx !== -1) {
    const open = idx + '\\abs{'.length - 1;
    let depth = 0;
    let close = -1;

    for (let i = open; i < out.length; i++) {
      if (out[i] === '{') depth++;
      else if (out[i] === '}') {
        depth--;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }

    if (close === -1) {
      break;
    }

    const inner = out.slice(open + 1, close);

    out = `${out.slice(0, idx)}\\left|${inner}\\right|${out.slice(close + 1)}`;
    idx = out.indexOf('\\abs{');
  }

  return out;
};

/**
 * Ids of the answer blocks in a piece of stored latex, in document order.
 *
 * @param {string} latex
 * @returns {string[]}
 */
export const fieldIds = (latex) => {
  if (typeof latex !== 'string') {
    return [];
  }

  const out = [];

  replaceFields(latex, MQ_FIELD, (id) => {
    out.push(id || DEFAULT_FIELD_ID);
    return '';
  });

  return out;
};

/**
 * The answer in each answer block of stored latex, keyed by id.
 *
 * @param {string} latex
 * @returns {Record<string, string>}
 */
export const fieldValues = (latex) => {
  const out = {};

  if (typeof latex === 'string') {
    replaceFields(latex, MQ_FIELD, (id, content) => {
      out[id || DEFAULT_FIELD_ID] = content;
      return '';
    });
  }

  return out;
};

/**
 * Stored latex with every answer block emptied: what stays the same while a
 * student types.
 *
 * @param {string} latex
 * @returns {string}
 */
export const fieldTemplate = (latex) =>
  typeof latex === 'string'
    ? replaceFields(latex, MQ_FIELD, (id) => `${MQ_FIELD}[${id || DEFAULT_FIELD_ID}]{}`)
    : latex;

/**
 * Stored latex with each answer block holding `values[id]`. Everything outside
 * the blocks is kept exactly as stored, so it round-trips unchanged.
 *
 * @param {string} latex
 * @param {Record<string, string>} values
 * @returns {string}
 */
export const fillFields = (latex, values) =>
  replaceFields(latex, MQ_FIELD, (id, content) => {
    const key = id || DEFAULT_FIELD_ID;

    return `${MQ_FIELD}[${key}]{${values[key] !== undefined ? values[key] : content}}`;
  });

/**
 * Stored latex with each answer block replaced by its answer, `values[id]`, and
 * no `\MathQuillMathField` wrapper left around it: `x=\MathQuillMathField[r1]{}`
 * with `{ r1: '2' }` gives `x=2`. This is what MathQuill's `latex()` returned for
 * a static field, since a MathQuillMathField serialised as its content only,
 * and it is the form math-inline scores in Advanced Multi.
 *
 * @param {string} latex
 * @param {Record<string, string>} values
 * @returns {string}
 */
export const inlineFields = (latex, values) =>
  replaceFields(latex, MQ_FIELD, (id, content) => {
    const key = id || DEFAULT_FIELD_ID;

    return values[key] !== undefined ? values[key] : content;
  });

/**
 * Latex for a text alternative: the same expression without the display-only
 * markup that MathLive's MathML and speech conversions drop with its content.
 *
 * - `\htmlData{...}{x}` keeps `x`, and `\boxed{x}` keeps `x`;
 * - an answer block's "R" label goes, as it is decoration;
 * - an empty response area reads as a blank.
 *
 * @param {string} latex MathLive latex, after `toMathLive`
 * @returns {string}
 */
export const toAccessibleLatex = (latex) => {
  if (typeof latex !== 'string' || !latex) {
    return latex || '';
  }

  const unwrap = (input, command, fn) => {
    let out = input;
    let idx = out.indexOf(command);

    while (idx !== -1) {
      const open = idx + command.length;
      const close = out[open] === '{' ? groupEnd(out, open) : -1;

      if (close === -1) {
        idx = out.indexOf(command, idx + command.length);
        continue;
      }

      const replacement = fn(out, open, close);

      out = out.slice(0, idx) + replacement.text + out.slice(replacement.end);
      idx = out.indexOf(command, idx);
    }

    return out;
  };

  let out = latex.replace(ANSWER_BLOCK_MACRO_REGEX, '\\square');

  // `\htmlData{key=value}{content}`: the label of an answer block goes, any other content stays.
  out = unwrap(out, '\\htmlData', (text, open, close) => {
    const key = text.slice(open + 1, close);
    const contentOpen = close + 1;
    const contentClose = text[contentOpen] === '{' ? groupEnd(text, contentOpen) : -1;

    if (contentClose === -1) {
      return { text: '', end: close + 1 };
    }

    if (/^answer-block-index=/.test(key)) {
      // The label, and the space that separates it from the answer.
      const space = text.slice(contentClose + 1).match(/^\s*\\enspace\s*/);

      return { text: '', end: contentClose + 1 + (space ? space[0].length : 0) };
    }

    return { text: `{${text.slice(contentOpen + 1, contentClose)}}`, end: contentClose + 1 };
  });

  return unwrap(out, '\\boxed', (text, open, close) => ({ text: `{${text.slice(open + 1, close)}}`, end: close + 1 }));
};

/**
 * Convert stored latex (which may contain `\embed{newLine}[]`) into latex that
 * MathLive can parse and render as multiple lines.
 *
 * @param {string} latex
 * @returns {string}
 */
export const toMathLive = (latex) => {
  if (typeof latex !== 'string' || !latex) {
    return latex || '';
  }

  // Argument-taking pie commands -> native constructs, so their content stays
  // editable and serialises back correctly (see toNativeCommands).
  let out = toNativeCommands(latex);

  // Answer blocks: \MathQuillMathField[id]{x} -> \placeholder[id]{x}
  out = replaceFields(out, MQ_FIELD, (id, content) => `\\placeholder[${id || DEFAULT_FIELD_ID}]{${content}}`);

  // Response areas: \embed{answerBlock}[id] -> \answerBlock{id}
  out = out.replace(ANSWER_BLOCK_EMBED_REGEX, (_m, id) => `\\answerBlock{${id}}`);

  out = escapeDollars(out);

  // Breaks inside a group: one-column arrays.
  out = nestedLineBreaksToArrays(out);

  // Newlines: \embed{newLine}[] -> a multiline environment. Only top-level
  // breaks are rows; one inside a group (an answer box) is left alone.
  if (out.indexOf(NEWLINE_EMBED) !== -1) {
    const lines = splitTopLevel(out, NEWLINE_EMBED);

    if (lines.length > 1) {
      out = `\\displaylines{${lines.join(' \\\\ ')}}`;
    }
  }

  return out;
};

/**
 * Keypad command names that MathQuill treated as ALIASES of a different command.
 *
 * MathQuill registered `\\divide` as another name for `\\div` (and
 * `\\perpendicular` for `\\perp`), so pressing the key stored the real command.
 * MathLive only knows these names through `PIE_MACROS`, and serialises a macro
 * under its own name - so `\\divide` reached storage verbatim, where MathJax
 * (@pie-lib/math-rendering) has no such command and renders it as red text.
 *
 * Every other keypad command already matches what MathQuill stored (`\\degree`,
 * `\\nsim`, `\\ncong`, `\\nparallel`, `\\square`, `\\napprox`,
 * `\\parallelogram`), and MathJax understands those.
 */
const MATHQUILL_ALIASES = {
  '\\divide': '\\div',
  '\\perpendicular': '\\perp',
};

// Whole command names only: `\\divideontimes` is a real AMS symbol.
const MATHQUILL_ALIAS_REGEX = /\\(divide|perpendicular)(?![a-zA-Z])/g;

/**
 * Primes. MathLive turns a prime that follows a base into a superscript atom and
 * serialises it as `^{\\prime}`, or `^{\\doubleprime}` for the keypad's double
 * prime key (`5''` comes back out as `5^{\\doubleprime}`). MathJax has no
 * `\\doubleprime`, and two adjacent `^{\\prime}` groups - what typing `'` twice
 * produces - are a "double exponent" error. MathQuill stored plain apostrophes,
 * which both MathJax and MathLive read as primes, so store those.
 *
 * Only a superscript made of primes alone is rewritten: `x^{\\prime 2}` keeps
 * its group, since it holds more than primes.
 */
const PRIME_SUPERSCRIPT_REGEX = /\^\{((?:\s*\\(?:prime|doubleprime)(?![a-zA-Z]))+)\s*\}/g;
const BARE_DOUBLEPRIME_REGEX = /\\doubleprime(?![a-zA-Z])/g;

const primesToApostrophes = (primes) =>
  // eslint-disable-next-line quotes
  "'".repeat(
    (primes.match(/\\prime(?![a-zA-Z])/g) || []).length + 2 * (primes.match(BARE_DOUBLEPRIME_REGEX) || []).length,
  );

const BARE_PRIME_COMMAND_REGEX = /^\\(doubleprime|prime)(?![a-zA-Z])/;

/**
 * Primes that are *not* in a superscript.
 *
 * MathLive emits bare `\prime` / `\doubleprime` for a `′` or `″` typed or pasted
 * as a character (`5′6″` serialises as `5\prime6\doubleprime`). A bare `\prime`
 * is a full-size glyph in MathJax, while `''` is a superscript, so storing
 * `5\prime6''` drew the single prime visibly larger than each stroke of the
 * double prime. Both become apostrophes, the superscript primes MathQuill
 * stored, so they always match.
 *
 * Inside a script (`x^{\prime 2}`, `x^\prime`) a prime is already a
 * superscript, and an apostrophe there would mean something else, so
 * `\prime` is kept and `\doubleprime` (unknown to MathJax) becomes
 * `\prime\prime`.
 *
 * @param {string} latex
 * @returns {string}
 */
const barePrimesToApostrophes = (latex) => {
  if (latex.indexOf('prime') === -1) {
    return latex;
  }

  // One entry per open brace: is that group a super/subscript?
  const groups = [];
  let out = '';
  let i = 0;

  while (i < latex.length) {
    const ch = latex[i];

    if (ch === '\\') {
      const match = latex.slice(i).match(BARE_PRIME_COMMAND_REGEX);

      if (match) {
        const isDouble = match[1] === 'doubleprime';
        // `x^\prime`: the command is itself the script.
        const isScriptArgument = /[\^_]\s*$/.test(out);
        const inScript = isScriptArgument || groups.indexOf(true) !== -1;

        if (inScript) {
          out += isDouble ? '\\prime\\prime' : '\\prime';
        } else {
          // eslint-disable-next-line quotes
          out += isDouble ? "''" : "'";
        }

        i += match[0].length;
        continue;
      }

      // Copy any other command, or an escaped character such as `\{`, whole.
      const command = latex.slice(i).match(/^\\(?:[a-zA-Z]+|.)/);
      const text = command ? command[0] : ch;

      out += text;
      i += text.length;
      continue;
    }

    if (ch === '{') {
      groups.push(/[\^_]\s*$/.test(out));
    } else if (ch === '}') {
      groups.pop();
    }

    out += ch;
    i += 1;
  }

  return out;
};

/**
 * Rewrite what MathLive serialises into the form MathQuill stored: alias
 * command names, and primes.
 *
 * @param {string} latex
 * @returns {string}
 */
export const toCanonicalCommands = (latex) =>
  typeof latex === 'string'
    ? barePrimesToApostrophes(
        latex
          .replace(MATHQUILL_ALIAS_REGEX, (m) => MATHQUILL_ALIASES[m])
          .replace(PRIME_SUPERSCRIPT_REGEX, (_m, primes) => primesToApostrophes(primes)),
      )
    : latex;

/**
 * Commands whose arguments MathLive may write without braces, and how many
 * brace arguments each takes. `\sqrt` also takes an optional `[index]`.
 *
 * When it serialises content that was typed or edited, MathLive drops the
 * braces around a single-digit argument: the fraction key gives `\frac12`, the
 * root key `\sqrt2`. That is valid LaTeX, but MathQuill always stored
 * `\frac{1}{2}`, and the math-validation parser that scores math-inline answers
 * only accepts braced arguments, so an unbraced answer scores 0.
 *
 * The other argument-taking commands MathLive writes (`\overline`, `\binom`,
 * `\text`, ...) keep their braces; they are listed so that no future change in
 * MathLive's output can store an unbraced form either.
 */
const BRACED_ARGUMENT_COUNT = {
  '\\frac': 2,
  '\\dfrac': 2,
  '\\tfrac': 2,
  '\\cfrac': 2,
  '\\binom': 2,
  '\\dbinom': 2,
  '\\tbinom': 2,
  '\\sqrt': 1,
  '\\overline': 1,
  '\\underline': 1,
  '\\overrightarrow': 1,
  '\\overleftrightarrow': 1,
  '\\overparen': 1,
  '\\vec': 1,
  '\\hat': 1,
  '\\bar': 1,
};

const COMMAND_TOKEN_REGEX = /^\\(?:[a-zA-Z]+|.)/;

/**
 * Index of the `]` that closes the optional argument opened at `open`, or -1.
 * A `]` inside a brace group does not count.
 *
 * @param {string} latex
 * @param {number} open index of a `[`
 * @returns {number}
 */
const optionalEnd = (latex, open) => {
  let depth = 0;

  for (let i = open + 1; i < latex.length; i++) {
    const ch = latex[i];

    if (ch === '\\') {
      i += 1;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
    } else if (ch === ']' && depth === 0) {
      return i;
    }
  }

  return -1;
};

/**
 * The argument that starts at `start`: a brace group (its content, without the
 * braces), or a single digit or letter, the only arguments MathLive writes
 * unbraced.
 *
 * Anything else is not taken as an argument, so latex that only MathQuill wrote
 * stays as stored: `\sqrt(16)` and `\sqrt[4](16)` are still in content, the
 * scorer reads them as roots, and reading the `(` as the argument would break
 * them.
 *
 * @param {string} latex
 * @param {number} start
 * @returns {{content: string, end: number}|undefined}
 */
const readArgument = (latex, start) => {
  const ch = latex[start];

  if (ch === '{') {
    const close = groupEnd(latex, start);

    return close === -1 ? undefined : { content: latex.slice(start + 1, close), end: close + 1 };
  }

  return ch !== undefined && /^[0-9a-zA-Z]$/.test(ch) ? { content: ch, end: start + 1 } : undefined;
};

/**
 * Put braces around every argument of the commands in `BRACED_ARGUMENT_COUNT`:
 * `\frac12` -> `\frac{1}{2}`, `2\frac34` -> `2\frac{3}{4}`, `\sqrt2` ->
 * `\sqrt{2}`, at any depth. Latex whose arguments are already braced comes back
 * unchanged, whitespace included.
 *
 * @param {string} latex
 * @returns {string}
 */
export const braceArguments = (latex) => {
  if (typeof latex !== 'string' || latex.indexOf('\\') === -1) {
    return latex;
  }

  let out = '';
  let i = 0;

  while (i < latex.length) {
    if (latex[i] !== '\\') {
      out += latex[i];
      i += 1;
      continue;
    }

    // A lone trailing backslash has no command name.
    const token = latex.slice(i).match(COMMAND_TOKEN_REGEX);
    const name = token ? token[0] : '\\';

    out += name;
    i += name.length;

    const count = BRACED_ARGUMENT_COUNT[name];

    if (!count) {
      continue;
    }

    const skipSpaces = () => {
      const from = i;

      while (latex[i] === ' ') {
        i += 1;
      }

      out += latex.slice(from, i);
    };

    if (name === '\\sqrt') {
      skipSpaces();

      if (latex[i] === '[') {
        const close = optionalEnd(latex, i);

        if (close !== -1) {
          out += `[${braceArguments(latex.slice(i + 1, close))}]`;
          i = close + 1;
        }
      }
    }

    for (let n = 0; n < count; n++) {
      skipSpaces();

      const argument = readArgument(latex, i);

      if (!argument) {
        break;
      }

      out += `{${braceArguments(argument.content)}}`;
      i = argument.end;
    }
  }

  return out;
};

/**
 * Convert latex out of MathLive back into the stored form, so items authored
 * with the MathLive editor remain readable by @pie-lib/math-rendering and by
 * the existing MathQuill implementation.
 *
 * @param {string} latex
 * @returns {string}
 */
export const fromMathLive = (latex) => {
  if (typeof latex !== 'string' || !latex) {
    return latex || '';
  }

  const match = latex.trim().match(DISPLAYLINES_REGEX);
  let out = latex;

  // `\\` is a line break only as a top-level row of `\displaylines`; anywhere
  // else (a matrix, an array) it is the environment's own row separator.
  if (match) {
    out = splitTopLevel(match[1], '\\\\')
      .map((s) => s.trim())
      .join(NEWLINE_EMBED);
  }

  // Answer blocks: \placeholder[id]{x} -> \MathQuillMathField[id]{x}
  out = replaceFields(out, PLACEHOLDER, (id, content) => `\\MathQuillMathField[${id || DEFAULT_FIELD_ID}]{${content}}`);

  // Response areas: \answerBlock{id} -> \embed{answerBlock}[id]
  out = out.replace(ANSWER_BLOCK_MACRO_REGEX, (_m, id) => `\\embed{answerBlock}[${id}]`);

  // Unnamed placeholders are MathLive's own representation of an empty slot and
  // must not reach storage or MathJax. Unwrap them: keep any content, drop the
  // command itself (the surrounding braces are already part of the host latex,
  // so re-adding them here would produce `\longdiv{{}}`).
  out = out.replace(BARE_PLACEHOLDER_REGEX, (_m, content) => content);
  out = out.replace(BARE_PLACEHOLDER_NO_ARG_REGEX, '');

  // `\frac12` -> `\frac{1}{2}`: the braced form MathQuill stored and the scorer
  // parses (see BRACED_ARGUMENT_COUNT).
  out = braceArguments(out);

  // Store the command MathQuill stored, not the alias - also heals latex that was
  // saved with `\\divide` before the keypad resolved it.
  return toCanonicalCommands(out);
};

/**
 * MathQuill `cmd()` semantics: commands that take arguments should land the
 * cursor inside the first argument. MathLive expresses that with `#?`
 * placeholders in the inserted latex.
 */
const COMMANDS_WITH_ARGS = {
  // An explicit "blank over blank" key: both slots start empty.
  '\\frac': '\\frac{#?}{#?}',
  // Division, which must behave like MathQuill's `/`: whatever precedes the
  // cursor becomes the numerator and the caret lands in the denominator. `#@`
  // is MathLive's token for "the selection, or the item before the cursor" -
  // this is exactly the template MathLive binds to the `/` key itself. Using
  // `#?` here instead produced an empty fraction and left the typed number
  // stranded outside it.
  '/': '\\frac{#@}{#?}',
  '\\sqrt': '\\sqrt{#?}',
  '\\nthroot': '\\sqrt[#?]{#?}',
  '\\overline': '\\overline{#?}',
  '\\overrightarrow': '\\overrightarrow{#?}',
  '\\overleftrightarrow': '\\overleftrightarrow{#?}',
  // Native forms, not the pie macros: a macro would not serialise the user's
  // typed content back out (see toNativeCommands).
  '\\overarc': '\\overparen{#?}',
  '\\longdiv': '\\enclose{longdiv}{#?}',
  '^': '^{#?}',
  _: '_{#?}',
  '(': '\\left(#?\\right)',
  '[': '\\left[#?\\right]',
  '|': '\\left|#?\\right|',
};

/**
 * MathQuill keystroke names -> MathLive command selectors.
 */
const KEYSTROKES = {
  Left: 'moveToPreviousChar',
  Right: 'moveToNextChar',
  Backspace: 'deleteBackward',
  Delete: 'deleteForward',
  Up: 'moveUp',
  Down: 'moveDown',
};

/**
 * Translate a keypad key definition into a MathLive action.
 *
 * Mirrors the precedence in @pie-lib/math-input's MathInput.keypadPress:
 * latex (unless a command is present) -> write -> command -> keystroke.
 *
 * @param {object} key
 * @returns {{type: 'insert'|'command', value: string}|undefined}
 */
export const keyToAction = (key) => {
  if (!key) {
    return undefined;
  }

  if (key.latex && !key.command) {
    return { type: 'insert', value: key.latex };
  }

  if (key.write) {
    return { type: 'insert', value: key.write };
  }

  if (key.command) {
    // Some keys carry an array of commands (e.g. Measured Angle is
    // ['m', '\\angle'], log-base-n is ['\\log', '_']). MathQuill's `cmd()`
    // applied them in sequence; MathLive inserts one latex string, so expand
    // each part and concatenate.
    const parts = Array.isArray(key.command) ? key.command : [key.command];
    const value = parts.map((c) => COMMANDS_WITH_ARGS[c] || MATHQUILL_ALIASES[c] || c).join('');

    return { type: 'insert', value };
  }

  if (key.keystroke) {
    const selector = KEYSTROKES[key.keystroke];

    return selector ? { type: 'command', value: selector } : undefined;
  }

  return undefined;
};

export { COMMANDS_WITH_ARGS, KEYSTROKES, MATHQUILL_ALIASES };
