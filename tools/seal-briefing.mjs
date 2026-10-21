// Seals Alexandra's briefing page into briefing/<id>.json, readable only with her private link secret + passcode.
// Usage: node tools/seal-briefing.mjs --in briefing.html --keys briefing.keys.json
// briefing.keys.json (kept OUTSIDE the repo): {id, secret, pin}. Created on first run; the link is printed then.
import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), v[i + 1]]] : r), []));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ITER = 150000;
const enc = new TextEncoder();
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
const b64 = (u) => Buffer.from(u).toString('base64');
const b64url = (u) => Buffer.from(u).toString('base64url');

let keys = fs.existsSync(a.keys) ? JSON.parse(fs.readFileSync(a.keys, 'utf8')) : null;
if (!keys) {
  const r = rand(12); let pin = ''; for (let i = 0; i < 6; i++) pin += String(r[i] % 10);
  keys = { id: b64url(rand(9)), secret: b64url(rand(18)), pin };
  fs.writeFileSync(a.keys, JSON.stringify(keys, null, 2));
  console.log('new link: https://prettyteam.taffetadesign.com/briefing/#b.' + keys.id + '.' + keys.secret);
}
const payload = { html: fs.readFileSync(a.in, 'utf8'), sealedAt: new Date().toISOString() };
const salt = rand(16), iv = rand(12);
const baseKey = await crypto.subtle.importKey('raw', enc.encode(keys.secret + ':' + keys.pin), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(payload))));
const back = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)));
if (back.html !== payload.html) throw new Error('round-trip mismatch');
fs.writeFileSync(path.join(root, 'briefing', keys.id + '.json'), JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
console.log('sealed briefing/' + keys.id + '.json');
