import { describe, expect, it } from 'vitest';
import { transformJsCombinatoricsToV2 } from '../src/lib/upstream/sync-imports';

describe('transformJsCombinatoricsToV2', () => {
  it('rewrites the 0.5 combination import and calls to the 2.x Combination class', () => {
    const input = `import { combination } from 'js-combinatorics';
// combination(correct, 2) stays documentation text.
const pairs = combination(correct, 2).toArray();
const label = "combination(answer, 2)";
`;

    const output = transformJsCombinatoricsToV2(input);

    expect(output).toBe(`import { Combination } from 'js-combinatorics';
// combination(correct, 2) stays documentation text.
const pairs = new Combination(correct, 2).toArray();
const label = "combination(answer, 2)";
`);
    expect(transformJsCombinatoricsToV2(output)).toBe(output);
  });

  it('keeps an aliased binding', () => {
    const input = `import { combination as pairsOf, permutation } from 'js-combinatorics';
const pairs = pairsOf(answer, 2).toArray();
`;

    expect(
      transformJsCombinatoricsToV2(input)
    ).toBe(`import { Combination as pairsOf, permutation } from 'js-combinatorics';
const pairs = new pairsOf(answer, 2).toArray();
`);
  });

  it('leaves a combination function from another module alone', () => {
    const input = `import { combination } from './math';
const pairs = combination(answer, 2);
`;

    expect(transformJsCombinatoricsToV2(input)).toBe(input);
  });
});
