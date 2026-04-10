import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/app_notas/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Organizer DB',
        short_name: 'Organizer',
        description: 'Gerenciador Pessoal Cyberpunk',
        theme_color: '#0d1219',
        background_color: '#080b0f',
        display: 'standalone',
        icons: [
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: '../app_notas',
    emptyOutDir: true
  }
})
