/** @type {import('tailwindcss').Config} */
import { preset } from "@govtechmy/myds-style";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/@govtechmy/myds-react/dist/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [preset],
  theme: {
    extend: {},
  },
  plugins: [],
}
