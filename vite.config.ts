import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfillsPlugin from 'rollup-plugin-polyfill-node';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfillsPlugin({
      include: ['process', 'fs', 'path']
    })
  ],
  define: {
    'process.env': {},
    global: 'globalThis',
    'process.stdout': {
      isTTY: false,
      columns: 80
    },
    'process.stderr': {
      isTTY: false,
      columns: 80
    }
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      util: 'util',
      path: 'path-browserify'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
});
