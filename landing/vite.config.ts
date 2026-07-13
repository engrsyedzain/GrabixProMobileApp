import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative asset paths so the built site works when opened from any host
  // or a static file server (e.g. Dropbox, GitHub Pages subpath, local file).
  base: './',
});
