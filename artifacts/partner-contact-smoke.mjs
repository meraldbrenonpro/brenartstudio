// Exercise real form serialization and the server contract without sending email.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { validateContact, buildContactEmail, createContactHandler } from '../server/contact.js';

const valid = { nom: 'Test local', email: 'test@example.invalid', type: 'studio-partenaire',
  budget: '4', domaines: ['3d', 'web'], message: 'Message de contrôle local, jamais envoyé.' };
assert.equal(validateContact(valid), null);
for (const budget of ['0', '1', '11', '-2', '<script>', 4, {}, null]) {
  assert.match(validateContact({ ...valid, budget }), /volume/);
}
for (const domaines of ['web', ['web', 'web'], ['prototype'], [null], ['__proto__']]) {
  assert.match(validateContact({ ...valid, domaines }), /expertises/);
}
for (const body of [null, [], 42, 'invalid']) assert.ok(validateContact(body));
assert.equal(validateContact({ ...valid, budget: '', domaines: [] }), null);
assert.equal(validateContact({ ...valid, budget: 'plus' }), null);
const email = buildContactEmail({ ...valid, nom: '<img src=x>', message: '<script>alert(1)</script>\nSeconde ligne' });
assert.match(email.text, /4 jours \/ mois — 1.600 € HT \/ mois/);
assert.match(email.text, /Visuels 3D & CGI, Web/);
assert.ok(!email.html.includes('<script>'));
assert.match(email.html, /&lt;img src=x&gt;/);
assert.match(email.html, /<br>Seconde ligne/);
const oneoff = buildContactEmail({ ...valid, type: 'projet-ponctuel', budget: '10' });
assert.ok(!oneoff.text.includes('4 000'));
assert.ok(!oneoff.text.includes('Expertises:'));

const context = body => ({ req: { json: async () => body, header: () => 'local-test' },
  json: (response, status = 200) => ({ response, status }) });
// An absent API key is intentional; no provider is initialized in these tests.
const handler = createContactHandler({ resendApiKey: '', from: '', to: '' });
assert.equal((await handler(context(null))).status, 400);
assert.equal((await handler(context({ ...valid, budget: '1' }))).status, 400);
assert.equal((await handler(context({ website: 'honeypot' }))).status, 200);
assert.equal((await handler(context(valid))).status, 500);

const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  .match(/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
const window = { location: { search: '?type=studio-partenaire&jours=4&domaines=3d,web,unknown' },
  matchMedia: () => ({ matches: true }) };
const calls = [];
class Logic {
  setState(next, callback) { Object.assign(this.state, typeof next === 'function' ? next(this.state) : next); callback?.(); }
}
const Component = vm.runInNewContext(`${source}\nComponent`, {
  DCLogic: Logic, window, URLSearchParams, document: {},
  FormData: class { constructor(input) { return input; } },
  fetch: (url, request) => { calls.push({ url, payload: JSON.parse(request.body) }); return Promise.resolve({ ok: true }); },
});
const component = new Component();
component._applyContactIntent();
assert.equal(component.state.requestType, 'studio-partenaire');
assert.equal(component.state.partnerDays, '4');
assert.deepEqual(Array.from(component.state.partnerAreas), ['3d', 'web']);
component.state.partnerDays = '6';
component._applyContactIntent();
assert.equal(component.state.partnerDays, '6', 'Returning to the same enquiry preserves manual changes');
window.location.search = '?type=studio-partenaire&jours=999&domaines=<script>,motion';
component._applyContactIntent();
assert.equal(component.state.partnerDays, '2');
assert.deepEqual(Array.from(component.state.partnerAreas), ['motion']);

const data = new FormData();
for (const [name, value] of Object.entries(valid)) if (name !== 'domaines') data.append(name, value);
data.append('domaines', '3d'); data.append('domaines', 'web');
component.renderVals().submitForm({ preventDefault() {}, target: data });
await Promise.resolve();
assert.deepEqual(calls[0].payload.domaines, ['3d', 'web'], 'Both checkboxes survive serialization');
assert.equal(calls[0].payload.message, valid.message, 'The visitor message remains unchanged');
component.state.sending = false;
data.set('type', 'projet-ponctuel');
component.renderVals().submitForm({ preventDefault() {}, target: data });
await Promise.resolve();
assert.ok(!('budget' in calls[1].payload));
assert.ok(!('domaines' in calls[1].payload));
console.log('Studio Partenaire contact: intent, serialization, validation, escaped email and local-only error paths pass.');
