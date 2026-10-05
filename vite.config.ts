import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite = the development server + build tool.
// Tailwind is loaded as a plugin, so there is no separate tailwind.config file:
// the design tokens (colors, fonts) live in src/index.css under @theme.
export default defineConfig({
  base: '/The-Human-Algorithm/',
  plugins: [react(), tailwindcss()],
})
