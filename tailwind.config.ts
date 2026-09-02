import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        acuity: {
          navy: "#002137",
          navyHover: "#083353",
          navyDark: "#001524",
          navyLight: "#0c3b5e",
          gold: "#b89047",
          goldHover: "#c59f52",
          goldLight: "#dfb74a",
          goldMuted: "#ecd699",
        },
        brand: {
          50: "#f0f6fa",
          100: "#e0edf5",
          200: "#b8d5e8",
          300: "#80b4d6",
          400: "#3d88ba",
          500: "#004b79",
          600: "#003b60",
          700: "#002d4a",
          800: "#002137",
          900: "#001828",
          950: "#000f1a",
        },
        goldBrand: {
          50: "#fbf8f1",
          100: "#f6eedc",
          200: "#ebd9b2",
          300: "#dfc081",
          400: "#d2a857",
          500: "#b89047",
          600: "#9e7737",
          700: "#7e5a2b",
          800: "#674926",
          900: "#563c22",
        },
        emeraldBrand: {
          50: "#ecfdf5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        amberBrand: {
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"],
        heading: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        logo: ['"Montserrat"', '"Outfit"', '"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
