/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes').light,
          primary: '#ee4923',
          'primary-content': '#ffffff',
        },
      },
      {
        dark: {
          ...require('daisyui/src/theming/themes').dark,
          primary: '#ff5733',
          'primary-content': '#ffffff',
        },
      },
    ],
  },
};
