import { defineConfig } from 'vite';

// Vanilla + Fabric.js (no framework). Vite just serves the module app on a fixed port.
export default defineConfig({
  server: { port: 5178, strictPort: true },
});
