/**
 * Every Unicode decimal digit system, for tests that check a comparison holds
 * in each one. Element controller tests import it through `@workspace`.
 */

const runStarts: number[] = [];
for (let codePoint = 0, inRun = false; codePoint <= 0x10ffff; codePoint++) {
  const isDigit = /\p{Nd}/u.test(String.fromCodePoint(codePoint));
  if (isDigit && !inRun) runStarts.push(codePoint);
  inRun = isDigit;
}

/** The code point of each system's zero. Abutting runs (the mathematical digits) start a new zero every ten. */
export const DIGIT_ZEROS: number[] = runStarts.flatMap((zero) => {
  const zeros = [zero];
  for (let next = zero + 10; /\p{Nd}/u.test(String.fromCodePoint(next)); next += 10)
    zeros.push(next);
  return zeros;
});

/** `ascii` with each of 0–9 written in the system whose zero is `zero`. */
export const inSystem = (zero: number, ascii: string): string =>
  ascii.replace(/[0-9]/g, (digit) => String.fromCodePoint(zero + Number(digit)));

/** A label for assertion messages: the system's zero and its code point. */
export const systemName = (zero: number): string =>
  `${String.fromCodePoint(zero)} U+${zero.toString(16).toUpperCase().padStart(4, '0')}`;
