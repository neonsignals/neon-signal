import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { buildIceServers } from './functions/api/turn'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'turn-dev-endpoint',
        configureServer(server) {
          server.middlewares.use('/api/turn', async (req, res) => {
            const url = new URL(req.url ?? '', 'http://localhost')
            const result = await buildIceServers(url.searchParams.get('provider'), env)
            res.statusCode = result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.body))
          })
        },
      },
    ],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: { port: 5173, open: true },
  }
})