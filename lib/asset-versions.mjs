import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Keep long-lived asset caching while changing the URL whenever its content changes.
export function versionAssetLinks(html, root) {
  const fingerprints = new Map();
  return html.replace(/<(?:link|script)\b[^>]*>/gi, (tag) =>
    tag.replace(/\b(href|src)=(['"])([^'"]+)\2/i, (attribute, name, quote, value) => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return attribute;
      const url = new URL(value.replace(/&amp;/g, '&'), 'https://brenartstudio.fr/');
      if (!/\.(?:css|js)$/.test(url.pathname)) return attribute;
      if (!url.pathname.startsWith('/assets/') && url.pathname !== '/support.js') return attribute;
      if (!fingerprints.has(url.pathname)) {
        const content = readFileSync(join(root, url.pathname.slice(1)));
        fingerprints.set(url.pathname, createHash('sha256').update(content).digest('hex').slice(0, 16));
      }
      url.searchParams.set('v', fingerprints.get(url.pathname));
      const originalPath = value.split(/[?#]/, 1)[0];
      const query = url.searchParams.toString().replace(/&/g, '&amp;');
      return `${name}=${quote}${originalPath}?${query}${url.hash}${quote}`;
    })
  );
}
