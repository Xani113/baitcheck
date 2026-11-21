/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#070b14",
          card: "#0d1527",
          border: "#1a2744",
          accent: "#00f0ff",
          green: "#00ff88",
          red: "#ff2a5f",
          yellow: "#ffb703"
        }
      }
    },
  },
  plugins: [],
};
