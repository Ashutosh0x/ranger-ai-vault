/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#b9e6fe",
          300: "#7cd4fd",
          400: "#36bffa",
          500: "#0ca5ea",
          600: "#0083c8",
          700: "#0169a3",
          800: "#065886",
          900: "#0b4970",
        },
        vault: {
          bg: "var(--vault-bg)",
          card: "var(--vault-card)",
          border: "var(--vault-border)",
          accent: "var(--vault-accent)",
          warning: "var(--vault-warning)",
          danger: "var(--vault-danger)",
          text: "var(--vault-text)",
          "text-secondary": "var(--vault-text-secondary)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
