/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          black: '#191414',
          white: '#FFFFFF',
          gray: '#535353'
        }
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}