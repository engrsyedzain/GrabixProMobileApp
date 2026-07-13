/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Grabix Pro brand — electric blue / cyan on a cool navy-black,
        // matching the crystalline launcher icon.
        ink: {
          DEFAULT: '#070B11',
          900: '#0A0F16',
          800: '#0E141D',
          700: '#141C27',
          600: '#1B2531',
        },
        line: '#24303E',
        mist: '#8798A9',
        haze: '#566578',
        frost: '#EAF2FB',
        blue: {
          DEFAULT: '#22B6FF',
          deep: '#0E7FBF',
          soft: '#7CD4FF',
        },
        cyan: {
          DEFAULT: '#45E0E6',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 60px -12px rgba(34,182,255,0.45)',
        card: '0 24px 60px -24px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        grad: 'linear-gradient(135deg, #22B6FF 0%, #45E0E6 100%)',
        'grad-soft':
          'linear-gradient(135deg, rgba(34,182,255,0.14), rgba(69,224,230,0.06))',
      },
      keyframes: {
        marquee: {
          '0%': {transform: 'translateX(0)'},
          '100%': {transform: 'translateX(-50%)'},
        },
        float: {
          '0%,100%': {transform: 'translateY(0)'},
          '50%': {transform: 'translateY(-10px)'},
        },
        glowpulse: {
          '0%,100%': {opacity: '0.5'},
          '50%': {opacity: '1'},
        },
        risein: {
          '0%': {opacity: '0', transform: 'translateY(14px)'},
          '100%': {opacity: '1', transform: 'translateY(0)'},
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'marquee-reverse': 'marquee 46s linear infinite reverse',
        float: 'float 6s ease-in-out infinite',
        glowpulse: 'glowpulse 4s ease-in-out infinite',
        risein: 'risein 0.6s ease-out both',
      },
    },
  },
  plugins: [],
};
