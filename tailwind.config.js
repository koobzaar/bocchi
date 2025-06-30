/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Anthropic-inspired dark theme colors
        anthracite: {
          900: '#0a0a0a', // Darkest background
          800: '#141414', // Dark background
          700: '#1a1a1a', // Card background
          600: '#2a2a2a', // Elevated surfaces
          500: '#3a3a3a', // Borders/dividers
          400: '#4a4a4a', // Hover states
          300: '#5a5a5a' // Active borders
        },
        claude: {
          purple: '#8b5cf6', // Primary accent
          'purple-light': '#a78bfa',
          'purple-dark': '#7c3aed',
          orange: '#ff6b6b', // Primary action
          'orange-light': '#ffa8a8',
          'orange-dark': '#f97316',
          blue: '#3b82f6',
          gold: '#c89b3c' // LoL theme accent
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#e5e5e5',
          muted: '#9ca3af',
          disabled: '#6b7280'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      animation: {
        dots: 'dots 1.5s steps(5, end) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        progress: 'progress 2s ease-in-out infinite'
      },
      keyframes: {
        dots: {
          '0%, 20%': {
            color: 'transparent',
            textShadow: '0.25em 0 0 transparent, 0.5em 0 0 transparent'
          },
          '40%': {
            color: 'white',
            textShadow: '0.25em 0 0 transparent, 0.5em 0 0 transparent'
          },
          '60%': {
            color: 'white',
            textShadow: '0.25em 0 0 white, 0.5em 0 0 transparent'
          },
          '80%, 100%': {
            color: 'white',
            textShadow: '0.25em 0 0 white, 0.5em 0 0 white'
          }
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        slideDown: {
          from: {
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      },
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding'
      }
    }
  },
  plugins: [
    // Custom plugin for scrollbar styling
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          }
        },
        '.scrollbar-track-anthracite': {
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#1e293b'
          }
        },
        '.scrollbar-thumb-anthracite': {
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#475569',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#64748b'
          }
        }
      })
    }
  ]
}
