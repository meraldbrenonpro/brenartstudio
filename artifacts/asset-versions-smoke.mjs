import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { versionAssetLinks } from '../lib/asset-versions.mjs';

const root = mkdtempSync(join(tmpdir(), 'brenart-asset-versions-'));
try {
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'assets/site.css'), 'body { color: black; }');
  writeFileSync(join(root, 'assets/motion.js'), 'const motion = true;');
  writeFileSync(join(root, 'support.js'), 'const runtime = true;');
  const html = `<link rel="stylesheet" href="assets/site.css">
<script src='/assets/motion.js?mode=light&amp;v=old#module' defer></script>
<script src="./support.js"></script>
<link href="https://example.com/theme.css" rel="stylesheet">
<script src="//example.com/widget.js"></script>
<img src="assets/photo.png">
<a href="/services#web">Services</a>`;
  const first = versionAssetLinks(html, root);
  assert.match(first, /assets\/site\.css\?v=[a-f0-9]{16}/);
  assert.match(first, /motion\.js\?mode=light&amp;v=[a-f0-9]{16}#module/);
  assert.match(first, /\.\/support\.js\?v=[a-f0-9]{16}/);
  assert.ok(first.includes('https://example.com/theme.css'));
  assert.ok(first.includes('//example.com/widget.js'));
  assert.ok(first.includes('src="assets/photo.png"'));
  assert.ok(first.includes('href="/services#web"'));
  assert.equal(versionAssetLinks(first, root), first, 'A repeated build must keep the same URLs.');
  writeFileSync(join(root, 'assets/site.css'), 'body { color: blue; }');
  const second = versionAssetLinks(first, root);
  const cssUrl = (value) => value.match(/assets\/site\.css\?v=[a-f0-9]{16}/)[0];
  assert.notEqual(cssUrl(first), cssUrl(second), 'Changed styling must bypass the previously cached URL.');
  assert.equal(second.replace(cssUrl(second), cssUrl(first)), first, 'Unchanged resources must keep their cached URLs.');
  assert.throws(() => versionAssetLinks('<script src="assets/missing.js"></script>', root), /ENOENT/);
  console.log('PASS: changed CSS gets a new URL; unchanged assets, external URLs and anchors stay stable; repeated builds are idempotent.');
} finally {
  rmSync(root, { recursive: true, force: true });
}
