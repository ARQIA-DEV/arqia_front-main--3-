/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A1F44',     // Azul escuro
        accent: '#B8A363',      // Dourado
        background: '#F8F5F0',  // Off-white

        // Extras para dark mode
        darkBg: '#0F172A',
        darkText: '#F1F5F9',
      },
    },
  },
  plugins: [],
}
