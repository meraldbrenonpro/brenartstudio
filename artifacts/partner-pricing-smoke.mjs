import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Compile in memory: the production Node >=20 baseline cannot import TS itself.
const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../components/partner-pricing.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm', target: ['node20'],
});
const {
  PARTNER_DAILY_RATE, PARTNER_INITIAL_MONTHS, PARTNER_MIN_DAYS, PARTNER_MAX_DAYS,
  getPartnerQuote, normalisePartnerDays, getPartnerContactUrl,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].contents).toString('base64')}`);

assert.equal(PARTNER_DAILY_RATE, 400);
assert.equal(PARTNER_MIN_DAYS, 2);
assert.equal(PARTNER_MAX_DAYS, 10);
assert.equal(PARTNER_INITIAL_MONTHS, 3);
assert.deepEqual(getPartnerQuote(), { days: 2, monthly: 800, initialTotal: 2400 });
assert.deepEqual(getPartnerQuote(10), { days: 10, monthly: 4000, initialTotal: 12000 });
for (const value of [-40, 0, 1, '', NaN, Infinity, undefined, null, {}, '<script>']) assert.equal(normalisePartnerDays(value), 2);
assert.equal(normalisePartnerDays(45), 10);
assert.equal(normalisePartnerDays('6'), 6);
assert.equal(normalisePartnerDays(5.8), 6);

// Successive inputs calculate from the latest volume without throttling state.
for (let repeat = 0; repeat < 100; repeat++) {
  for (let day = 2; day <= 10; day++) {
    const quote = getPartnerQuote(day);
    assert.equal(quote.monthly, day * 400);
    assert.equal(quote.initialTotal, day * 400 * 3);
  }
}
const base = new URL(getPartnerContactUrl(2), 'https://brenartstudio.fr');
assert.equal(base.pathname, '/contact');
assert.equal(base.hash, '#bs-type');
assert.equal(base.searchParams.get('type'), 'studio-partenaire');
assert.equal(base.searchParams.get('jours'), '2');
assert.equal(base.searchParams.has('domaines'), false);
const configured = new URL(getPartnerContactUrl('7', ['web', '3d', 'web', 'motion', '<img src=x>']), base);
assert.equal(configured.searchParams.get('jours'), '7');
assert.equal(configured.searchParams.get('domaines'), '3d,motion,web');
assert.equal(configured.href.includes('<'), false);
assert.equal(getPartnerContactUrl(99).includes('jours=10'), true);
console.log('Studio Partenaire pricing: defaults, limits, repeated updates and encoded contact URL pass.');
