import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { buildIceServers } from './functions/api/turn'

export default defineConfig(({ mode }) => {
  // Load every variable from .env.local (no VITE_ prefix filter).
  // This lets the local dev server see METERED_TURN_USERNAME,
  // CLOUDFLARE_TURN_KEY_ID, and the other server-side secrets.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        // In production, Cloudflare Pages Functions handle /api/turn.
        // In local development, this middleware fakes it so we can test
        // the exact same code path without deploying.
        name: 'turn-dev-endpoint',
        configureServer(server) {
          server.middlewares.use('/api/turn', async (req, res) => {
            try {
              const url = new URL(req.url ?? '/', 'http://localhost')
              const provider = url.searchParams.get('provider')
              const result = await buildIceServers(provider, env)
              res.statusCode = result.status
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', 'no-store')
              res.end(JSON.stringify(result.body))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : 'Unknown error',
                })
              )
            }
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  }
})