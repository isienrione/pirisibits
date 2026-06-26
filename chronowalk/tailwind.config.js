/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'warm-white': '#FFFDF8',
        sand: '#F4E7D0',
        limestone: '#E7D7BD',
        'deep-slate': '#17212B',
        'soft-slate': '#51606F',
        'sky-blue': '#7CB7D8',
        terracotta: '#C8643C',
        gold: '#D9A441',
        olive: '#7A8B5A',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        eyebrow: ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.12em', fontWeight: '500' }],
        caption: ['0.8125rem', { lineHeight: '1.25rem' }],
        'body-sm': ['0.9375rem', { lineHeight: '1.5rem' }],
        body: ['1rem', { lineHeight: '1.625rem' }],
        'section-sm': ['1.375rem', { lineHeight: '1.75rem' }],
        section: ['1.75rem', { lineHeight: '2.125rem' }],
        'section-lg': ['2rem', { lineHeight: '2.375rem' }],
        hero: ['clamp(2rem,4vw+1rem,2.75rem)', { lineHeight: '1.08' }],
        'hero-lg': ['clamp(2.25rem,5vw+1rem,3.25rem)', { lineHeight: '1.06' }],
      },
      borderRadius: {
        sheet: '2rem',
        panel: '1.25rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(23, 33, 43, 0.12), 0 2px 8px rgba(23, 33, 43, 0.06)',
        'glass-lg': '0 12px 40px rgba(23, 33, 43, 0.16), 0 4px 12px rgba(23, 33, 43, 0.08)',
        'sheet-up': '0 -12px 40px rgba(23, 33, 43, 0.14)',
        cta: '0 8px 24px rgba(200, 100, 60, 0.28)',
      },
      spacing: {
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-top': 'max(0.75rem, env(safe-area-inset-top))',
      },
      backdropBlur: {
        glass: '16px',
      },
      transitionTimingFunction: {
        'motion-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        150: '150ms',
        250: '250ms',
        350: '350ms',
      },
    },
  },
  plugins: [],
}
