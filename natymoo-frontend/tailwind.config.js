/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        blush: {
          DEFAULT: "#FBEEF0",
          soft: "#F6E1E4",
          deep: "#EFCBD1"
        },
        plum: {
          DEFAULT: "#5B3758",
          dark: "#3E2440",
          ink: "#241826"
        },
        rose: {
          DEFAULT: "#C97B84",
          light: "#DDA0A7"
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
