/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Category palette — used by cover.ts and category badges.
        cat: {
          ci:       { DEFAULT: '#0d9488', dark: '#134e4a' }, // teal — CI / pipelines
          iac:      { DEFAULT: '#4f46e5', dark: '#312e81' }, // indigo — IaC
          container:{ DEFAULT: '#d97706', dark: '#78350f' }, // amber — containers
          k8s:      { DEFAULT: '#2563eb', dark: '#1e3a8a' }, // blue — Kubernetes
          security: { DEFAULT: '#dc2626', dark: '#7f1d1d' }, // crimson — security
          obs:      { DEFAULT: '#16a34a', dark: '#14532d' }, // green — observability
          release:  { DEFAULT: '#7c3aed', dark: '#4c1d95' }, // violet — release
          ir:       { DEFAULT: '#e11d48', dark: '#881337' }, // red — incident response
          finops:   { DEFAULT: '#ca8a04', dark: '#713f12' }, // gold — FinOps
        },
        ink: {
          50:  '#f7f8fa',
          100: '#eef0f4',
          200: '#d8dde5',
          300: '#b6bfcc',
          400: '#8592a6',
          500: '#5b6a82',
          600: '#3e4a5f',
          700: '#2a3446',
          800: '#1a2130',
          900: '#0d1220',
          950: '#070a14',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.06)',
      },
    },
  },
  plugins: [],
};
