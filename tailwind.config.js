/** @type {import('tailwindcss').Config} */
export default {
  darkMode: '[data-theme="dark"]',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        ribbon: {
          50: 'oklch(var(--color-ribbon-50))',
          100: 'oklch(var(--color-ribbon-100))',
          200: 'oklch(var(--color-ribbon-200))',
          300: 'oklch(var(--color-ribbon-300))',
          400: 'oklch(var(--color-ribbon-400))',
          500: 'oklch(var(--color-ribbon-500))',
          600: 'oklch(var(--color-ribbon-600))',
          700: 'oklch(var(--color-ribbon-700))',
          800: 'oklch(var(--color-ribbon-800))',
          900: 'oklch(var(--color-ribbon-900))',
          950: 'oklch(var(--color-ribbon-950))',
        },
        paper: {
          50: 'oklch(var(--color-paper-50))',
          100: 'oklch(var(--color-paper-100))',
          200: 'oklch(var(--color-paper-200))',
          300: 'oklch(var(--color-paper-300))',
          400: 'oklch(var(--color-paper-400))',
          500: 'oklch(var(--color-paper-500))',
          600: 'oklch(var(--color-paper-600))',
          700: 'oklch(var(--color-paper-700))',
          800: 'oklch(var(--color-paper-800))',
          900: 'oklch(var(--color-paper-900))',
          950: 'oklch(var(--color-paper-950))',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};