/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#FDFCFA',
          100: '#F8F4EE',
          200: '#EFE8DC',
          300: '#E2D5C5',
          400: '#C9B89F',
        },
        sage: {
          100: '#D8E8DA',
          200: '#B6D1BA',
          300: '#8FB595',
          400: '#6B8F71',
          500: '#4F7055',
          600: '#375240',
        },
        terra: {
          50:  '#FDF1EC',
          100: '#F5DDD3',
          200: '#E8B9A8',
          300: '#C4704F',
          400: '#A85A3C',
          500: '#8B422A',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.45s ease-out both',
        'slide-up':  'slideUp 0.4s ease-out both',
        'slide-right': 'slideRight 0.28s cubic-bezier(0.32,0.72,0,1) both',
        'skeleton':  'skeleton 1.5s ease-in-out infinite',
        'pop':       'pop 0.2s ease-out both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { transform: 'translateX(110%)' },
          to:   { transform: 'translateX(0)' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        pop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '70%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)',
        'panel': '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        'float': '0 -2px 16px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
