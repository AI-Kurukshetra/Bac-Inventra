/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a1a",
        muted: "#6b6b6b",
        accent: "#0f766e",
        accent2: "#f59e0b",
        border: "#e7e1d8",
        danger: "#b42318",
        panel: "#ffffff",
        bg: "#f6f3ee"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      },
      borderRadius: {
        xl: "16px",
        lg: "14px"
      }
    }
  },
  plugins: []
};
