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
        ag: {
          primary: "var(--ag-primary)",
          secondary: "var(--ag-secondary)",
          bg: "var(--ag-bg)",
          surface: "var(--ag-surface)",
          text: "var(--ag-text)",
          border: "var(--ag-border)",
          danger: "var(--ag-danger)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
