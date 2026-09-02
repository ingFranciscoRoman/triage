/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind 3, no 4: NativeWind 4 está construido sobre la 3 y su propio
  // package.json fija tailwindcss 3.4.x. La v5 de NativeWind es la que usa
  // Tailwind 4, y sigue en preview.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
