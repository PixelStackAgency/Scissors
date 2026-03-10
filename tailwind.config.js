/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#c8a86e',
          light:   '#e2c99a',
          dark:    '#9a7a48',
          muted:   '#6a5030',
        },
        salon: {
          black:  '#000000',
          near:   '#080808',
          card:   '#0f0f0f',
          card2:  '#161616',
          card3:  '#1c1c1c',
          border: 'rgba(200,168,110,0.16)',
          text:   '#f5f0e8',
          muted:  '#7a6e5e',
          dim:    '#3a3028',
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease both',
        'scale-in':  'scaleIn 0.35s ease both',
        'fade-in':   'fadeIn 0.3s ease both',
        'spin-slow': 'spin 1s linear infinite',
        'pulse-gold':'pulseGold 3s ease infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.93)' },     to: { opacity: 1, transform: 'scale(1)' } },
        fadeIn:    { from: { opacity: 0 },                               to: { opacity: 1 } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(200,168,110,0)' }, '50%': { boxShadow: '0 0 28px 6px rgba(200,168,110,0.18)' } },
      },
    },
  },
  plugins: [],
};
