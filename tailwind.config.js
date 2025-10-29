/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#F3EFE0',
        primary: '#29477B',
        'primary-foreground': '#F3EFE0',
        secondary: '#64463C',
        accent: '#D4A856',
        muted: '#A1A2A6',
        'muted-foreground': '#6B7280',
        card: '#FFFFFF',
        foreground: '#1F2937',
        border: '#D1D5DB',
        ring: '#29477B',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};