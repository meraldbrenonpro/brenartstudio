// Serveur statique de test — reproduit la réécriture "clean URL" de Nginx :
//   /portfolio -> /portfolio/index.html, fallback SPA sur / index.html
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8123;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain',
  '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
};

async function tryFile(p) { try { const s = await stat(p); return s.isFile() ? p : null; } catch { return null; } }

// Reproduit les redirections 301 de nginx.conf pour les anciennes URLs
// des pages légales (noms de fichiers .dc.html avec espaces/accents).
const LEGACY_REDIRECTS = [
  [/^\/Mentions.*Bren.*\.dc\.html$/i, '/mentions-legales'],
  [/^\/Confidentialit.*Bren.*\.dc\.html$/i, '/confidentialite'],
  [/^\/CGV.*Bren.*\.dc\.html$/i, '/cgv'],
];

const server = createServer(async (req, res) => {
  let path = decodeURIComponent((req.url || '/').split('?')[0]);
  const redirect = LEGACY_REDIRECTS.find(([re]) => re.test(path));
  if (redirect) {
    res.writeHead(301, { Location: redirect[1] });
    res.end();
    return;
  }
  let file =
    (await tryFile(join(ROOT, path))) ||
    (await tryFile(join(ROOT, path, 'index.html'))) ||
    (extname(path) === '' ? await tryFile(join(ROOT, path + '.html')) : null) ||
    join(ROOT, 'index.html'); // fallback SPA
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('404');
  }
});
server.listen(PORT, () => console.log(`static-server on http://localhost:${PORT}`));
