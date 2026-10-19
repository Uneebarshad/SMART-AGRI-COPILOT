const color = (name) => `rgb(var(--agri-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'rgb(var(--agri-page-bg) / <alpha-value>)',
        surface: 'rgb(var(--agri-surface) / <alpha-value>)',
        nav: 'rgb(var(--agri-nav) / <alpha-value>)',
        elevated: 'rgb(var(--agri-elevated) / <alpha-value>)',
        field: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, color(`field-${shade}`)])),
        leaf: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, color(`leaf-${shade}`)])),
        soil: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, color(`soil-${shade}`)])),
        sun: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, color(`sun-${shade}`)])),
        sky: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, color(`sky-${shade}`)])),
        teal: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, color(`teal-${shade}`)])),
        rust: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, color(`rust-${shade}`)])),
        ai: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, color(`ai-${shade}`)])),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.18), 0 1px 3px 0 rgb(0 0 0 / 0.12)',
        raised: '0 8px 24px -8px rgb(0 0 0 / 0.45), 0 2px 6px -2px rgb(0 0 0 / 0.25)',
        glow: '0 0 0 1px rgb(57 211 83 / 0.14), 0 8px 30px -12px rgb(57 211 83 / 0.28)',
      },
    },
  },
  plugins: [],
};
