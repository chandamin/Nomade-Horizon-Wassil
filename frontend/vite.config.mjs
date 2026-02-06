// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     allowedHosts: [
//       'unpenciled-unhumored-thora.ngrok-free.dev',
//     ],
//   }
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        'auto-loader': '/src/auto-loader.jsx',
        main: '/src/index.jsx'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  },
  server: {
    allowedHosts: ['.ngrok-free.dev'],
    hmr: false
  }
})
