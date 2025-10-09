import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Provide default API base URL based on environment
    __API_BASE_URL__: JSON.stringify(
      process.env.VITE_API_BASE_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://api.synapsyx.tn' : 'https://dev-api.synapsyx.tn')
    ),
  },
})
