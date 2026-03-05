import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        },
        neutral: {
          0: "var(--neutral-0)",
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
          1000: "var(--neutral-1000)",
        },
        surface: {
          glass: {
            1: "var(--surface-glass-1)",
            2: "var(--surface-glass-2)",
            3: "var(--surface-glass-3)",
          },
        },
        border: {
          weak: "var(--border-alpha-weak)",
          md: "var(--border-alpha-md)",
          strong: "var(--border-alpha-strong)",
        },
        danger: "var(--ag-danger)",
        ag: {
          primary: "var(--ag-primary)",
          accent: "var(--ag-accent)",
          deep: "var(--ag-deep)",
          ink: "var(--ag-ink)",
          glass: "var(--ag-glass)",
          border: "var(--ag-glass-border)",
          secondary: "var(--ag-secondary)",
          bg: "var(--ag-bg)",
          surface: "var(--ag-surface)",
          text: "var(--ag-text)",
          danger: "var(--ag-danger)",
        },
      },
      borderRadius: {
        1: "var(--radius-1)",
        2: "var(--radius-2)",
        3: "var(--radius-3)",
        4: "var(--radius-4)",
        5: "var(--radius-5)",
        6: "var(--radius-6)",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
        4: "var(--shadow-4)",
        5: "var(--shadow-5)",
        brand: "var(--shadow-glow-brand)",
      },
      backdropBlur: {
        sm: "var(--blur-sm)",
        md: "var(--blur-md)",
        lg: "var(--blur-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
