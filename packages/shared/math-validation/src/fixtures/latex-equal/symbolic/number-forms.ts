export default {
  mode: 'symbolic',
  tests: [
    {
      target: '1000',
      eq: ['1{,}000', '1\\,000', '1,000'],
      ne: ['1,0000', '0'],
    },
    {
      target: '\\frac{2}{3}',
      eq: ['\\dfrac{2}{3}', '\\tfrac{4}{6}'],
    },
    {
      label: 'a spaced mixed number is a sum',
      target: '19\\frac{1}{2}',
      eq: ['19\\ \\frac{1}{2}', '19\\,\\frac{1}{2}', '19.5'],
      ne: ['9.5'],
    },
    { target: '2\\ \\frac{m}{s}', eq: ['\\frac{2m}{s}'] },
  ],
};
