/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'brand-yellow': 'rgb(var(--color-brand-yellow) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        primary: 'rgb(var(--color-text-main) / <alpha-value>)',
        'text-main': 'rgb(var(--color-text-main) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Atkinson Hyperlegible Next', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        body: ['16px', { lineHeight: '1.5' }],
        h1: ['32px', { lineHeight: '1.25', fontWeight: '700' }],
        h2: ['28px', { lineHeight: '1.3', fontWeight: '700' }],
        h3: ['24px', { lineHeight: '1.35', fontWeight: '700' }],
        label: ['14px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
      },
    },
  },
  plugins: [],
};