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
        ink: "#0b1220",
        muted: "#6b7280",
        accent: "#2563eb",
        accent2: "#0ea5e9",
        border: "#e5e7eb",
        danger: "#b42318",
        panel: "#ffffff",
        bg: "#f7f9fc"
      },
      boxShadow: {
        soft: "0 12px 28px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl: "16px",
        lg: "14px"
      }
    }
  },
  plugins: []
};
