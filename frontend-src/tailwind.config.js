/** @type {import('tailwindcss').Config} */

// Neutral scale: cool concrete greys with a faint green cast (site concrete, photo paper,
// graphite). It replaces Tailwind's blue-tinted slate so every existing `slate-*` class
// picks up the new palette.
const concrete = {
  50: '#f7f8f5',
  100: '#eef0ec',
  200: '#e1e4df',
  300: '#c9cec8',
  400: '#9ca39d',
  500: '#6e7671',
  600: '#4d5551',
  700: '#353c39',
  800: '#252b28',
  900: '#1b201e',
  950: '#121614'
};

// The date-imprint orange of old film cameras. Reserved for dates, the shutter and
// "today" states; 600/700 are the text-safe shades on light backgrounds.
const stamp = {
  50: '#fff4ea',
  100: '#ffe5cf',
  200: '#ffc89c',
  300: '#ffa863',
  400: '#ff9440',
  500: '#ff7b1c',
  600: '#e2620a',
  700: '#b14b07',
  800: '#7f3606',
  900: '#4a2205',
  950: '#2b1403'
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: concrete,
        ink: concrete,
        brand: stamp,
        stamp
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Big Shoulders Display"', '"Instrument Sans"', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(180deg, #ff8a30 0%, #f26c0e 100%)'
      },
      boxShadow: {
        soft: '0 1px 0 rgba(27,32,30,0.04), 0 10px 30px -18px rgba(27,32,30,0.35)',
        glow: '0 8px 22px -10px rgba(255,123,28,0.65)',
        print: '0 1px 2px rgba(27,32,30,0.12), 0 12px 28px -14px rgba(27,32,30,0.45)'
      },
      borderRadius: {
        print: '6px'
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'pop-in': { from: { opacity: 0, transform: 'translateY(8px) scale(0.98)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        develop: { from: { opacity: 0, filter: 'grayscale(1) brightness(1.6) contrast(0.6)' }, to: { opacity: 1, filter: 'none' } }
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 280ms cubic-bezier(0.32, 0.72, 0, 1)',
        'pop-in': 'pop-in 260ms ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        develop: 'develop 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) both'
      }
    }
  },
  plugins: []
};
