// Seals the Front Desk guide (checklists, desk guide pages, logins) with a key that only travels in the desk link.
// Usage: node tools/seal-desk.mjs --in desk-src.json --key <base64url 32 bytes> --out desk/guide.dat
import fs from 'node:fs';
const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), v[i + 1]]] : r), []));
const key = await crypto.subtle.importKey('raw', Buffer.from(a.key, 'base64url'), 'AES-GCM', false, ['encrypt', 'decrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const pt = new TextEncoder().encode(fs.readFileSync(a.in, 'utf8'));
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt));
const back = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
if (Buffer.compare(Buffer.from(back), Buffer.from(pt)) !== 0) throw new Error('round-trip mismatch');
const out = new Uint8Array(12 + ct.length); out.set(iv, 0); out.set(ct, 12);
fs.writeFileSync(a.out, out);
console.log('sealed', out.length, 'bytes');
