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
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/og-image.jpg',
])
const ALLOWED_ROOT_DIRS = ['/assets/', '/uploads/']

// URLs « propres » -> fichier réel pré-rendu (build-static.mjs + pages légales).
// Le footer/nav pointent vers ces slugs ; on les sert depuis leur index.html.
// (Équivalent du `try_files $uri $uri/` de nginx.conf pour le déploiement Node.)
const PAGE_ROUTES = new Map([
  ['/a-propos', '/a-propos/index.html'],
  ['/services', '/services/index.html'],
  ['/contact', '/contact/index.html'],
  ['/portfolio', '/portfolio/index.html'],
  ['/portfolio/ineeva', '/portfolio/ineeva/index.html'],
  ['/portfolio/acasa', '/portfolio/acasa/index.html'],
  ['/portfolio/koryaa', '/portfolio/koryaa/index.html'],
  ['/portfolio/laure-fagbohoun', '/portfolio/laure-fagbohoun/index.html'],
  ['/cgv', '/cgv/index.html'],
  ['/mentions-legales', '/mentions-legales/index.html'],
  ['/confidentialite', '/confidentialite/index.html'],
])

// Redirections 301 : anciennes URLs légales (.dc.html avec espaces/accents)
// -> nouveaux slugs propres. (Parité avec nginx.conf pour le SEO / liens entrants.)
const LEGACY_REDIRECTS = [
  [/^\/Mentions.*Bren.*\.dc\.html$/i, '/mentions-legales'],
  [/^\/Confidentialit.*Bren.*\.dc\.html$/i, '/confidentialite'],
  [/^\/CGV.*Bren.*\.dc\.html$/i, '/cgv'],
]

// Supprime un éventuel « / » final (sauf la racine) pour comparer les chemins.
const normPath = (p) => (p.length > 1 ? p.replace(/\/+$/, '') || '/' : p)

function isAllowedStaticPath(pathname) {
  if (pathname.includes('..') || pathname.includes('\0')) return false
  if (pathname === '/') return true
  if (PAGE_ROUTES.has(normPath(pathname))) return true
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
  const redirect = LEGACY_REDIRECTS.find(([re]) => re.test(pathname))
  if (redirect) return c.redirect(redirect[1], 301)
  if (!isAllowedStaticPath(pathname)) return c.notFound()
  await next()
})

app.use(
  '/*',
  serveStatic({
    root: rootDir,
    rewriteRequestPath: (path) => {
      if (path === '/') return '/index.html'
      return PAGE_ROUTES.get(normPath(path)) ?? path
    },
  })
)

const port = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server listening on port ${info.port}`)
})
