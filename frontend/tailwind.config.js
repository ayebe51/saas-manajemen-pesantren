/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
        },
        muted: 'var(--text-muted)',
        main: 'var(--text-main)',
        inverse: 'var(--text-inverse)',
        app: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        'surface-glass': 'var(--bg-surface-glass)',
        light: 'var(--border-light)',
      },
      borderColor: {
        DEFAULT: 'var(--border-light)',
      }
    },
  },
  plugins: [],
}

