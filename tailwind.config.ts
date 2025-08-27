import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Emotion colors to prevent purging
    'bg-slate-600',
    'bg-red-600', 
    'bg-blue-600',
    'bg-yellow-500',
    'bg-orange-500',
    'bg-pink-600',
    'bg-indigo-600',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem", // 16px - 8pt grid
        sm: "2rem",      // 32px - 8pt grid
        lg: "4rem",      // 64px - 8pt grid
        xl: "5rem",      // 80px - 8pt grid
        "2xl": "6rem",   // 96px - 8pt grid
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Modern shadcn v2 semantic color system
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Therapeutic color extensions for specialized components
        therapy: {
          primary: "hsl(var(--primary))",
          accent: "hsl(var(--accent))",
          warning: "hsl(var(--destructive))",
          success: "hsl(147 45% 55%)",
          info: "hsl(210 85% 60%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Additional 8pt-based radius options
        "therapy-sm": "0.5rem", // 8px
        "therapy-md": "0.75rem", // 12px
        "therapy-lg": "1rem", // 16px
        "therapy-xl": "1.5rem", // 24px
      },
      spacing: {
        // Strict 8pt Grid System - All spacing in 8px increments
        "0.5": "0.125rem", // 2px - for fine adjustments
        "1.5": "0.375rem", // 6px - for fine adjustments  
        "2.5": "0.625rem", // 10px - for fine adjustments
        "3.5": "0.875rem", // 14px - for fine adjustments
        "4.5": "1.125rem", // 18px - for fine adjustments
        "5.5": "1.375rem", // 22px - for fine adjustments
        "6.5": "1.625rem", // 26px - for fine adjustments
        "7.5": "1.875rem", // 30px - for fine adjustments
        // Main 8pt Grid (multiples of 8px)
        "18": "4.5rem", // 72px - keeping existing
        "88": "22rem", // 352px - keeping existing
        // Professional component spacing
        "therapy-xs": "0.5rem", // 8px
        "therapy-sm": "1rem", // 16px
        "therapy-md": "1.5rem", // 24px
        "therapy-lg": "2rem", // 32px
        "therapy-xl": "3rem", // 48px
        "therapy-2xl": "4rem", // 64px
        "therapy-3xl": "6rem", // 96px
      },
      fontSize: {
        // Enhanced therapeutic typography system
        "therapy-xs": ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }], // 12px/16px
        "therapy-sm": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }], // 14px/20px
        "therapy-base": ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }], // 16px/24px
        "therapy-lg": ["1.125rem", { lineHeight: "1.75rem", fontWeight: "500" }], // 18px/28px
        "therapy-xl": ["1.25rem", { lineHeight: "1.875rem", fontWeight: "600" }], // 20px/30px
        "therapy-2xl": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }], // 24px/32px
        "therapy-3xl": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }], // 30px/36px
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
        "glow": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary))" },
          "50%": { boxShadow: "0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))" },
        },
        "gentle-glow": {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },
        "shimmer": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "pulse-therapy": {
          "0%, 100%": { 
            opacity: "1",
            transform: "scale(1)"
          },
          "50%": { 
            opacity: "0.8",
            transform: "scale(1.02)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "glow": "glow 2s ease-in-out infinite alternate",
        "gentle-glow": "gentle-glow 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-therapy": "pulse-therapy 2s ease-in-out infinite",
      },
      fontFamily: {
        // Use the chat font (Inter) everywhere for consistency
        sans: [
          "var(--font-inter)",
          "system-ui",
          "sans-serif"
        ],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;