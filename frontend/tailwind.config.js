/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors (refined for premium)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          600: '#0284c7',
          900: '#0F172A'
        },
        // User panel - Emerald (premium shade)
        user: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b'
        },
        // Cashier panel - Amber (warm)
        cashier: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          900: '#78350f'
        },
        // Admin panel - Violet (sophisticated)
        admin: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          900: '#4c1d95'
        },
        // Supporting colors
        status: {
          success: '#14B8A6',
          warning: '#EA580C',
          error: '#DC2626',
          info: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '0' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
        lg: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        xl: ['28px', { lineHeight: '36px', letterSpacing: '-0.01em' }],
        '2xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.01em' }],
        '3xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.01em' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        elevation: '0 4px 12px -2px rgb(0 0 0 / 0.15)',
        'dark': '0 10px 15px -3px rgb(0 0 0 / 0.5)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '25px',
        xl: '40px',
      },
      animation: {
        // Fade animations
        'fade-in': 'fadeIn 300ms ease-in-out',
        'fade-out': 'fadeOut 300ms ease-in-out',
        'fade-in-up': 'fadeInUp 300ms ease-out',
        'fade-in-down': 'fadeInDown 300ms ease-out',

        // Scale animations
        'scale-in': 'scaleIn 300ms ease-out',
        'scale-out': 'scaleOut 300ms ease-in',

        // Slide animations
        'slide-in-top': 'slideInTop 300ms ease-out',
        'slide-in-bottom': 'slideInBottom 300ms ease-out',
        'slide-in-left': 'slideInLeft 300ms ease-out',
        'slide-in-right': 'slideInRight 300ms ease-out',

        // Pulse animations
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',

        // Other premium animations
        'shimmer': 'shimmer 2s infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
        'rotate-smooth': 'rotateSmooth 20s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        // Fade
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },

        // Scale
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' }
        },

        // Slide
        slideInTop: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInBottom: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },

        // Pulse
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' }
        },

        // Shimmer
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },

        // Bounce soft
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },

        // Rotate smooth
        rotateSmooth: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },

        // Float
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'smooth': '300ms',
        'slow': '500ms',
      },
      transitionTimingFunction: {
        'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      maxWidth: {
        'screen-2xl': '1400px',
      },
      zIndex: {
        hide: '-1',
        auto: 'auto',
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    },
  },
  plugins: [],
}
