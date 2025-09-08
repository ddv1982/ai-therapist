/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      colors: {
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
        "therapy-sm": "0.5rem",
        "therapy-md": "0.75rem",
        "therapy-lg": "1rem",
        "therapy-xl": "1.5rem",
      },
      spacing: {
        "0.5": "0.125rem",
        "1.5": "0.375rem",
        "2.5": "0.625rem",
        "3.5": "0.875rem",
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "6.5": "1.625rem",
        "7.5": "1.875rem",
        "18": "4.5rem",
        "88": "22rem",
        "therapy-xs": "0.5rem",
        "therapy-sm": "1rem",
        "therapy-md": "1.5rem",
        "therapy-lg": "2rem",
        "therapy-xl": "3rem",
        "therapy-2xl": "4rem",
        "therapy-3xl": "6rem",
      },
      fontSize: {
        "therapy-xs": ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
        "therapy-sm": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }],
        "therapy-base": ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        "therapy-lg": ["1.125rem", { lineHeight: "1.75rem", fontWeight: "500" }],
        "therapy-xl": ["1.25rem", { lineHeight: "1.875rem", fontWeight: "600" }],
        "therapy-2xl": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        "therapy-3xl": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
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
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary))" },
          "50%": { boxShadow: "0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))" },
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
