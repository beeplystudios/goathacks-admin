/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#30419C",
          50: "#A9B6FC",
          100: "#8798EF",
          200: "#6C7FE0",
          300: "#6278E8",
          400: "#4B5EC3",
          500: "#30419C",
          600: "#26368F",
          700: "#19297E",
          800: "#122172",
          900: "#08145A",
        },
        neutral: {
          DEFAULT: "101010",
          50: "#B1B1B1",
          100: "#8D8989",
          200: "#646464",
          300: "#2D2D2D",
          400: "#1D1D1D",
          500: "#101010",
          600: "#0E0E0E",
          700: "#0B0B0B",
          800: "#060606",
          900: "#030303",
        },
        feedback: {
          success: {
            primary: "#59E380",
            secondary: "#308147",
          },
          warning: {
            primary: "#E3C559",
            secondary: "#947A1D",
          },
          error: {
            hover: "#ED7272",
            primary: "#E35959",
            secondary: "#610A0A",
          },
        },
        pastel: {
          purple: {
            primary: "#AFADFC",
            secondary: "#282843",
          },
          green: {
            primary: "#ADFCB0",
            secondary: "#315333",
          },
          yellow: {
            primary: "#FCEAAD",
            secondary: "#5B553E",
          },
          teal: {
            primary: "#8BDFCB",
            secondary: "#184F42",
          },
          fuchsia: {
            primary: "#C98BDF",
            secondary: "#593840",
          },
          rose: {
            primary: "#DF8B8B",
            secondary: "#623737",
          },
        },
      },
    },
  },
  plugins: [],
};
