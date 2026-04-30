/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ganadero: {
          sidebar: "#1e2235", // Dark blue-grey from your image
          active: "#2ecc71", // Vibrant green from your active tab
          background: "#f8f9fa", // Light grey for the content area
        },
      },
    },
  },
  plugins: [],
};
