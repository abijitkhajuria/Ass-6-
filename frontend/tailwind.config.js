/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'Segoe UI', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Surfaces are driven by CSS variables so light and dark share one scale.
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',
        },
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        accent: {
          DEFAULT: '#6366f1',
          soft: '#818cf8',
          deep: '#4f46e5',
        },
        secondary: {
          DEFAULT: '#22d3ee',
          soft: '#67e8f9',
        },
        pass: '#10b981',
        fail: '#f43f5e',
        warn: '#f59e0b',
      },
      borderRadius: {
        xl2: '1.125rem',
        '4xl': '2rem',
      },
      boxShadow: {
        lift: '0 1px 2px rgb(0 0 0 / 0.04), 0 12px 32px -12px rgb(0 0 0 / 0.28)',
        glow: '0 0 0 1px rgb(99 102 241 / 0.25), 0 12px 40px -12px rgb(99 102 241 / 0.45)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
