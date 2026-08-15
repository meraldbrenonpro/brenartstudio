# Bren'Art Studio — import notes

Imported from the Claude Design project `c33f0466-a802-400b-b84f-a4086122a7aa`
(file `Brenart Studio.dc.html`) into this folder.

## What this is

A finished, self-contained site built in Claude Design's reactive `.dc.html` format.
It is **not** a static HTML page — `support.js` is the runtime that:

- loads React 18.3.1 + Babel from `unpkg.com` (it does this itself, on load),
- parses the `<x-dc>` template and the `<script data-dc-script>` logic block,
- renders the page and drives all interactivity (page switching via the `#accueil`,
  `#portfolio`, `#services`, `#about`, `#contact` hash routes; mobile menu; FAQ
  accordions; the contact form; magnetic buttons; stats; ticker).

GSAP + ScrollTrigger + Lenis and the Archivo / Clash Display fonts also load from CDNs.
So the site **needs an internet connection** to run, and should be opened over HTTP
(not `file://`, or the fonts/CDNs and relative asset paths misbehave).

## Files imported

- `index.html` — the main site (was `Brenart Studio.dc.html`)
- `support.js` — the Claude Design runtime (verbatim)
- `Mentions légales - Bren'Art Studio.dc.html`
- `Confidentialité - Bren'Art Studio.dc.html`
- `CGV - Bren'Art Studio.dc.html`

The three legal pages link back to the home page. Their internal links were rewritten
from `Brenart Studio.dc.html` to `index.html` to match the new filename. The home
page's footer still links to the legal pages by their original filenames (kept intact).

## Run it locally

The site is now served by a small Node app (`server/index.js`) instead of a plain
static server, so that the contact form can send email through Resend without
exposing the API key client-side (see "Contact form" below).

```
cp .env.example .env   # fill in RESEND_API_KEY
npm install
npm start
```

then open http://localhost:3000/ . The nav pills switch "pages" without a reload
(they are hash routes handled by the runtime). Static files are served through an
allowlist (`index.html`, the legal pages, `support.js`, `assets/`, `uploads/`) —
`server/`, `spec/`, `package.json`, `node_modules/` and any dotfile are not reachable
over HTTP.

## Assets — action needed

The design references 31 images and 1 hero video. Claude Design's file API caps a single
file transfer at 256 KiB, which truncates anything larger, and the UHD hero video is far
over that. So only the small UI assets could be imported automatically:

**Imported (present):**
- `assets/instagram-white.png`
- `assets/ineeva-avatar.png`
- `assets/tools/notion.png`

**Still needed — copy these from the source Design project's `assets/` and `uploads/`
folders (they exist there at full quality). Easiest path: copy the whole `assets/` and
`uploads/` folders over, overwriting.**

```
assets/acasa-ecran-01.png          assets/koryaa-creme.png
assets/acasa-logo-grain.png        assets/koryaa-motif.png
assets/acasa-logo-grid.png         assets/koryaa-packaging.jpg
assets/acasa-palette.mp4           assets/koryaa-palette.png
assets/acasa-principal.png         assets/koryaa-principal.png
assets/acasa-sketch.png            assets/koryaa-trace.png
assets/acasa-univers.png           assets/koryaa-wordmark.png
assets/ineeva-affiche.jpg          assets/laure-fagbohoun-avis.png
assets/ineeva-carte-visite.png     assets/laure-mobile.png
assets/ineeva-garde.jpg            assets/laure-principal.jpg
assets/ineeva-mockup-mobile.png    assets/linkedin-white.png
assets/ineeva-planche-01.png       assets/portrait-merald.png
assets/ineeva-principal.jpg        assets/tools/figma.png
                                   assets/tools/framer.png
                                   assets/tools/illustrator.png
                                   assets/tools/photoshop.png

uploads/12188729-uhd_3840_2160_25fps (1).mp4   (hero background video)
```

Until these are in place you'll see broken-image icons and no hero video; the layout,
text, navigation, and animations still work.

## Contact form (Resend)

The `#contact` form posts to `POST /api/contact` (`server/contact.js`), which validates
input, applies a honeypot + in-memory rate limit (5 req / 10 min / IP), then sends via
the `resend` SDK: `from` = `CONTACT_FROM` (the verified domain sender), `to` =
`CONTACT_TO`, `replyTo` = the visitor's own email — so replying to the notification
email replies straight to the prospect.

**Environment variables** (set in Coolify's environment panel, never committed):

| Variable          | Example                                        |
|-------------------|-------------------------------------------------|
| `RESEND_API_KEY`  | `re_...` (Resend dashboard → API Keys)          |
| `CONTACT_TO`      | `contact@brenartstudio.fr`                      |
| `CONTACT_FROM`    | `Bren'Art Studio <contact@brenartstudio.fr>`    |
| `PORT`            | `3000` (Coolify usually injects this)           |

**Key rotation**: an API key was shared in plaintext during setup and was used once to
verify the send path end-to-end. Revoke it in the Resend dashboard and generate a fresh
one for the `RESEND_API_KEY` used in Coolify.

## Optional hardening

- The CDN `<script>` tags (React, GSAP, Lenis) have no Subresource Integrity hashes.
  For production you can add `integrity="sha384-…" crossorigin="anonymous"` to pin them.
