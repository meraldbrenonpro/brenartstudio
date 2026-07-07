import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import { createContactHandler } from './contact.js'

const rootDir = fileURLToPath(new URL('../', import.meta.url))

// Le repo racine contient aussi server/, spec/, package.json, node_modules, .env…
// serveStatic ne doit exposer que ces entrées publiques précises (default-deny).
const ALLOWED_ROOT_FILES = new Set([
  '/index.html',
  '/support.js',
  '/skills-lock.json',
  "/CGV - Bren'Art Studio.dc.html",
  '/Confidentialité - Bren\'Art Studio.dc.html',
  '/Mentions légales - Bren\'Art Studio.dc.html',
])
const ALLOWED_ROOT_DIRS = ['/assets/', '/uploads/']

function isAllowedStaticPath(pathname) {
  if (pathname.includes('..') || pathname.includes('\0')) return false
  if (pathname === '/') return true
  if (ALLOWED_ROOT_FILES.has(pathname)) return true
  return ALLOWED_ROOT_DIRS.some((dir) => pathname.startsWith(dir))
}

const app = new Hono()

app.post(
  '/api/contact',
  createContactHandler({
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.CONTACT_FROM || "Bren'Art Studio <contact@brenartstudio.fr>",
    to: process.env.CONTACT_TO || 'contact@brenartstudio.fr',
  })
)

app.use('/*', async (c, next) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(c.req.url).pathname)
  } catch {
    return c.notFound()
  }
  if (!isAllowedStaticPath(pathname)) return c.notFound()
  await next()
})

app.use(
  '/*',
  serveStatic({
    root: rootDir,
    rewriteRequestPath: (path) => (path === '/' ? '/index.html' : path),
  })
)

const port = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server listening on port ${info.port}`)
})
