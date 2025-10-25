/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    // Common DaisyUI classes used in the app
    'link', 'link-primary',
    'dropdown', 'dropdown-end', 'dropdown-content',
    'avatar', 'menu-title',
    'input-error', 'label-text-alt',
    'text-error', 'bg-primary/5', 'border-primary/50'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ["corporate", "dark"],
  },
}
