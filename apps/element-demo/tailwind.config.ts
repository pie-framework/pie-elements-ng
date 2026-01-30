import daisyui from 'daisyui';
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark'], // Use built-in themes
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
} satisfies Config;
