/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      /* ========================================
         COLORS (OKLCH for better accessibility)
         ======================================== */
      colors: {
        border: 'oklch(var(--border))',
        input: 'oklch(var(--input))',
        ring: 'oklch(var(--ring))',
        background: 'oklch(var(--background))',
        foreground: 'oklch(var(--foreground))',
        primary: {
          DEFAULT: 'oklch(var(--primary))',
          foreground: 'oklch(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary))',
          foreground: 'oklch(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive))',
          foreground: 'oklch(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted))',
          foreground: 'oklch(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent))',
          foreground: 'oklch(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover))',
          foreground: 'oklch(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'oklch(var(--card))',
          foreground: 'oklch(var(--card-foreground))',
        },
        therapy: {
          success: 'oklch(var(--therapy-success))',
          warning: 'oklch(var(--therapy-warning))',
          info: 'oklch(var(--therapy-info))',
        },
        emotion: {
          fear: 'oklch(var(--emotion-fear))',
          anger: 'oklch(var(--emotion-anger))',
          sadness: 'oklch(var(--emotion-sadness))',
          joy: 'oklch(var(--emotion-joy))',
          anxiety: 'oklch(var(--emotion-anxiety))',
          shame: 'oklch(var(--emotion-shame))',
          guilt: 'oklch(var(--emotion-guilt))',
        },
      },

      /* ========================================
         BORDER RADIUS (8pt grid: 4, 8, 12px)
         ======================================== */
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },

      /* ========================================
         SPACING (8pt grid system)
         ======================================== */
      spacing: {
        0.5: '0.125rem', // 2px
        1: '0.25rem',    // 4px
        2: '0.5rem',     // 8px
        3: '0.75rem',    // 12px
        4: '1rem',       // 16px
        6: '1.5rem',     // 24px
        8: '2rem',       // 32px
        12: '3rem',      // 48px
        16: '4rem',      // 64px
        20: '5rem',      // 80px
        24: '6rem',      // 96px
      },

      /* ========================================
         TYPOGRAPHY (4 sizes, 2 weights)
         ======================================== */
      fontSize: {
        '3xl': '1.875rem', // 30px - Large headings
        xl: '1.25rem',     // 20px - Subheadings
        base: '1rem',      // 16px - Body text
        sm: '0.875rem',    // 14px - Small text
      },
      fontWeight: {
        normal: '400',   // Regular
        semibold: '600', // Semibold
      },
      fontFamily: {
        sans: ['var(--font-system)'], // Apple SF Pro / system fonts
        mono: ['var(--font-mono)'],   // SF Mono / monospace
      },
      lineHeight: {
        tight: '1.2',
        normal: '1.3',
        relaxed: '1.5',
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
      },

      /* ========================================
         BACKGROUND GRADIENTS (Extracted from inline styles)
         ======================================== */
      backgroundImage: {
        // App container subtle gradient (2 radial gradients)
        'app-subtle': `
          radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, hsl(var(--accent) / 0.05) 0%, transparent 50%)
        `,
        // Sidebar decorative gradient (linear + radial)
        'sidebar-gradient': `
          linear-gradient(180deg, transparent 0%, hsl(var(--accent) / 0.03) 100%),
          radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.05) 0%, transparent 50%)
        `,
      },
      backgroundColor: {
        // Sidebar background from CSS var
        sidebar: 'var(--sidebar-background)',
      },

      /* ========================================
         GLASSMORPHISM (Apple frosted glass)
         ======================================== */
      backdropBlur: {
        glass: '20px',
      },
      backdropSaturate: {
        glass: '180%',
      },

      /* ========================================
         SHADOWS (Apple-style subtle shadows)
         ======================================== */
      boxShadow: {
        'apple-sm': 'var(--shadow-sm)',
        'apple-md': 'var(--shadow-md)',
        'apple-lg': 'var(--shadow-lg)',
        'apple-xl': 'var(--shadow-xl)',
        'apple-primary': 'var(--shadow-primary)',
        'apple-accent': 'var(--shadow-accent)',
      },

      /* ========================================
         ANIMATIONS (Spring physics)
         ======================================== */
      transitionDuration: {
        instant: '150ms',
        fast: '200ms',
        base: '300ms',
        slow: '500ms',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.5, 1.25, 0.75, 1.25)',      // Bouncy spring
        'ease-out-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth deceleration
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',     // Ultra smooth
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'pulse-therapy': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slide-in 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-therapy': 'pulse-therapy 2s ease-in-out infinite',
      },
    },
  },
  
  /* ========================================
     CUSTOM PLUGINS
     ======================================== */
  plugins: [
    // Tap highlight utilities (for mobile touch interactions)
    function({ addUtilities }) {
      addUtilities({
        '.tap-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.tap-primary': {
          '-webkit-tap-highlight-color': 'hsl(var(--primary) / 0.2)',
        },
      })
    },
  ],
};
export default config;
