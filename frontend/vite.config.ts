import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  
  // Optimize dependencies for faster dev server startup
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'reactflow',
    ],
    exclude: [
      'react-international-phone'
    ]
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    
    // Proxy API requests to backend during development
    // This avoids CORS issues when frontend and backend are on different ports
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        ws: true,              // Enable WebSocket proxying
        secure: false,         // Allow self-signed certificates
        rewrite: (path) => path,  // Keep /api in the path
      },
    },
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@mui/material', '@mui/icons-material'],
          'vendor-emotion': ['@emotion/react', '@emotion/styled'],
          'vendor-reactflow': ['reactflow'],
        }
      }
    }
  }
});
