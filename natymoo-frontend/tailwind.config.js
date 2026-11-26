/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        blush: {
          DEFAULT: "#F2F3FC",
          soft: "#E4E7F8",
          deep: "#CDD3F0"
        },
        plum: {
          DEFAULT: "#2B3A8F",
          dark: "#1E2A6B",
          ink: "#171A3B"
        },
        rose: {
          DEFAULT: "#C97B84",
          light: "#DDA0A7"
        },
        night: {
          DEFAULT: "#1C1420",
          deep: "#16101A"
        },
        mist: "#F1E9EC",
        nocturne: {
          DEFAULT: "#0A1233",
          mid: "#1A2A6C"
        },
        sun: {
          DEFAULT: "#FFD23F",
          light: "#FFE27A"
        },
        moon: {
          DEFAULT: "#FFE6E0",
          glow: "#F2B8B0"
        },
        sage: {
          DEFAULT: "#8FA398",
          light: "#B7C6BC"
        }
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Work Sans", "sans-serif"]
      }
    },
  },
  plugins: [],
}