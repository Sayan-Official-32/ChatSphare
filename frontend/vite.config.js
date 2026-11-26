import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables from project root (where master .env lives)
  const rootDir = path.resolve(__dirname, '..');
  const env = loadEnv(mode, rootDir, '');

  // When running in Docker, VITE_API_TARGET is set to http://backend:8000
  // When running locally, it falls back to http://127.0.0.1:8000
  const apiTarget = env.VITE_API_TARGET || process.env.VITE_API_TARGET || 'http://127.0.0.1:8000';

  return {
    // envDir points to project root so Vite reads root .env directly
    envDir: rootDir,
    base: '/',
    plugins: [react()],
    resolve: {
      alias: {
        // Use '@/' as a shorthand for 'src/' in all imports
        // Example: import { supabase } from '@/lib/supabaseClient'
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/widget-embed.js': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/fullscreen-widget': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-other';
            }
          },
        },
      },
    },
    chunkSizeWarningLimit: 600,
  };
});

