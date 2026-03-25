/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
          bg: "#0A0F1A",
          card: "#111827",
          border: "#1F2937",
          accent: "#06D6A0",
          warning: "#FFD166",
          danger: "#EF476F",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
