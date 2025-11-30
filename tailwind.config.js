/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'tcdd-navy': '#1B3A6B',
        'tcdd-red': '#E31E24',
        'tcdd-blue-light': '#F0F4F8',
        'tcdd-navy-dark': '#0F172A',
        'dark-bg': '#121212',
        'dark-card': '#1F2228', // User Request
        'dark-primary': '#FFD700', // Gold
        'light-primary': '#EAB308', // Gold/Amber
        'light-bg': '#FFFFFF', // White
        'light-card': '#F3F4F6', // Light Gray
      }
    },
  },
  plugins: [],
}
