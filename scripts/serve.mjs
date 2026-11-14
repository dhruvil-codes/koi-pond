import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, sep, extname } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const port = Number(process.env.PORT || 4173)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const parts = path.split('/')
    if (parts.some(part => part.startsWith('.')) || path.includes('\\')) throw Error('Forbidden')
    const target = resolve(root, '.' + (path === '/' ? '/index.html' : path))
    if (!target.startsWith(root.endsWith(sep) ? root : root + sep)) throw Error('Forbidden')
    if (!(await stat(target)).isFile()) throw Error('Not found')
    response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' })
    response.end(await readFile(target))
  } catch { response.writeHead(404); response.end('Not found') }
})
server.on('error', error => { console.error(error.message); process.exitCode = 1 })
server.listen(port, '127.0.0.1', () => console.log(`Koi Pond: http://127.0.0.1:${port} (Ctrl+C to stop)`))
