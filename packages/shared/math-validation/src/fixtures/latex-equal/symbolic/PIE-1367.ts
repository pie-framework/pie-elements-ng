// Arabic letters are variables and `،` separates list items.
export default {
  mode: 'symbolic',
  tests: [
    {
      target: 'ص=2س+1',
      eq: ['ص=1+2س', '2س+1=ص', 'ص-1=2س'],
      ne: ['ص=2س', 'ع=2س+1'],
    },
    { target: 'س+ص', eq: ['ص+س'], ne: ['س+ع'] },
    { target: '(1،2)', eq: ['(1,2)'], ne: ['(1,3)'] },
  ],
};
