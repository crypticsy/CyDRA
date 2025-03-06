/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'selector',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/primereact/**/*.js", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
