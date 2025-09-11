/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      colors: {
        /* Tailwind v4 OKLCH colors for better accessibility */
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring))",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary))",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary))",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive))",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted))",
          foreground: "oklch(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "oklch(var(--accent))",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        /* Simplified therapy colors - 60/30/10 rule compliance */
        therapy: {
          success: "oklch(var(--therapy-success))",
          warning: "oklch(var(--therapy-warning))",
          info: "oklch(var(--therapy-info))",
        },
        emotion: {
          fear: "oklch(var(--emotion-fear))",
          anger: "oklch(var(--emotion-anger))",
          sadness: "oklch(var(--emotion-sadness))",
          joy: "oklch(var(--emotion-joy))",
          anxiety: "oklch(var(--emotion-anxiety))",
          shame: "oklch(var(--emotion-shame))",
          guilt: "oklch(var(--emotion-guilt))",
        },
      },
      /* Simplified border radius following 8pt grid */
      borderRadius: {
        lg: "var(--radius)",              /* 12px from base.css */
        md: "calc(var(--radius) - 4px)", /* 8px - grid compliant */
        sm: "calc(var(--radius) - 8px)", /* 4px - grid compliant */
        /* Therapy border radius utilities following 8pt grid */
        "therapy-sm": "4px",   /* 4px - grid compliant */
        "therapy-md": "8px",   /* 8px - grid compliant */
        "therapy-lg": "12px",  /* 12px - grid compliant */
      },
      /* 8pt Grid System: ONLY spacing divisible by 8 or 4 */
      spacing: {
        /* Fire Your Design Team - strict grid compliance */
        "0.5": "0.125rem", /* 2px - minimal spacing */
        "1": "0.25rem",    /* 4px - divisible by 4 */
        "2": "0.5rem",     /* 8px - divisible by 8 */
        "3": "0.75rem",    /* 12px - divisible by 4 */
        "4": "1rem",       /* 16px - divisible by 8 */
        "6": "1.5rem",     /* 24px - divisible by 8 */
        "8": "2rem",       /* 32px - divisible by 8 */
        "12": "3rem",      /* 48px - divisible by 8 */
        "16": "4rem",      /* 64px - divisible by 8 */
        "20": "5rem",      /* 80px - divisible by 8 */
        "24": "6rem",      /* 96px - divisible by 8 */
      },
      /* Fire Your Design Team Typography: 4 sizes only */
      fontSize: {
        /* Size 1: Large headings - text-3xl */
        "3xl": "1.875rem",
        /* Size 2: Subheadings - text-xl */
        "xl": "1.25rem",
        /* Size 3: Body text - text-base */
        "base": "1rem",
        /* Size 4: Small text - text-sm */
        "sm": "0.875rem",
      },
      fontWeight: {
        /* Fire Your Design Team: Only 2 weights */
        normal: "400",    /* Regular weight */
        semibold: "600",  /* Semibold weight */
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px oklch(var(--primary))" },
          "50%": { boxShadow: "0 0 20px oklch(var(--primary)), 0 0 30px oklch(var(--primary))" },
        },
        "gentle-glow": {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "pulse-therapy": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
        "gentle-glow": "gentle-glow 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-therapy": "pulse-therapy 2s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
};
export default config;
