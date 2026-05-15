/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        cream:        '#fbfaf7',
        'warm-black': '#1a1612',
        'muted-cream':'#ece9e2',
        'subtle-text':'#5a4f3c',
        'body-text':  '#2a2620',
      },
      fontFamily: {
        serif: ['Charter', 'Georgia', 'serif'],
        sans:  ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1px',
      },
      letterSpacing: {
        trust: '0.12em',
      },
    },
  },
  plugins: [],
};
