/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4B5E4F",
        sage: "#8FA392",
        beige: "#D4D0BA",
        paper: "#F7F7F2",
        darkText: "#2A332C",
      },
      fontFamily: {
        serif: ['"Lora"', "serif"],
        sans: ['"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
