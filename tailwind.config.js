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
        'dark-bg': '#0F172A', // Deep Navy (Background)
        'dark-card': '#1E293B', // Card Background
        'dark-input': '#334155', // Input/Search Background
        'dark-primary': '#3B82F6', // Primary Blue (Active)
        'dark-text-primary': '#F1F5F9', // Whiteish text
        'dark-text-secondary': '#94A3B8', // Muted text
        'light-primary': '#EAB308', // Gold/Amber (Keeping for legacy/light mode)
        'light-bg': '#FFFFFF', // White
        'light-card': '#F3F4F6', // Light Gray
        'status-error': '#EF4444', // Red
        'status-warning': '#F59E0B', // Amber
        'status-success': '#10B981', // Emerald
        'status-info': '#0EA5E9', // Sky
      }
    },
  },
  plugins: [],
}
