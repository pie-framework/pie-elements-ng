// Arabic letters are variables, also inside `\text`, and `،` separates list items.
export default {
  mode: 'literal',
  tests: [
    { target: 'س+ص', eq: ['س+ص'], ne: ['ص+س'] },
    { target: 'س+ص', opts: { literal: { ignoreOrder: true } }, eq: ['ص+س'] },
    { target: '5\\text{سم}', eq: ['5\\text{سم}'], ne: ['5\\text{م}', '5'] },
    { target: '(1،2)', eq: ['(1,2)'], ne: ['(2,1)'] },
  ],
};
