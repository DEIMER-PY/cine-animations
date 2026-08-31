import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const allowedTmdbPaths = [
  /^\/(movie|tv)\/\d+\/videos$/,
  /^\/trending\/movie\/(day|week)$/,
  /^\/trending\/person\/(day|week)$/,
  /^\/trending\/tv\/(day|week)$/,
  /^\/movie\/(popular|top_rated|now_playing|upcoming)$/,
  /^\/movie\/\d+$/,
  /^\/search\/movie$/,
  /^\/search\/person$/,
  /^\/genre\/movie\/list$/,
  /^\/person\/\d+$/,
  /^\/tv\/(popular|top_rated|on_the_air|airing_today)$/,
  /^\/tv\/\d+$/,
  /^\/search\/tv$/,
  /^\/genre\/tv\/list$/,
];

function tmdbLocalProxy(token) {
  return {
    name: 'cine-tmdb-local-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tmdb', async (request, response) => {
        try {
          if (!token) throw new Error('TMDB_TOKEN no configurado');
          const incoming = new URL(request.url, 'http://localhost');
          const tmdbPath = incoming.searchParams.get('path') || '';
          if (!allowedTmdbPaths.some((pattern) => pattern.test(tmdbPath))) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: 'PATH_NOT_ALLOWED' }));
            return;
          }
          const target = new URL(`https://api.themoviedb.org/3${tmdbPath}`);
          for (const [key, value] of incoming.searchParams.entries()) if (key !== 'path') target.searchParams.set(key, value);
          const upstream = await fetch(target, { headers: { Authorization: `Bearer ${token}`, accept: 'application/json' } });
          response.statusCode = upstream.status;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.setHeader('cache-control', upstream.ok ? 'public, max-age=300' : 'no-store');
          response.end(await upstream.text());
        } catch (error) {
          response.statusCode = 503;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [react(), tmdbLocalProxy(env.TMDB_TOKEN)],
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          r3f: ['@react-three/fiber', '@react-three/drei'],
          gsap: ['gsap'],
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          data: ['@supabase/supabase-js', 'zustand'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  };
});
