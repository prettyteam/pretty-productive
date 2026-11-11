// Decrypt the owner Inventory doc (docs/<keys.inv.file>.enc) to a JSON file OUTSIDE the repo, for tools/color-refresh.py.
//   node tools/inv-open.mjs --keys keys.json --out inv.json
// keys.json is The Pretty Report's board/sitekeys doc (secret: never commit it or print it).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const keys = JSON.parse(fs.readFileSync(args.keys, 'utf8'));
if (!keys.inv || !keys.inv.file) throw new Error('no inv key in keys.json');
const raw = fs.readFileSync(path.join(root, 'docs', keys.inv.file + '.enc'));
const k = await crypto.subtle.importKey('raw', Buffer.from(keys.inv.key, 'base64'), 'AES-GCM', false, ['decrypt']);
const pt = Buffer.from(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.subarray(0, 12) }, k, raw.subarray(12)));
fs.writeFileSync(args.out, pt);
const R = JSON.parse(pt).report || {};
console.log(JSON.stringify({ ok: true, ran: R.ran || '', refreshed: R.refreshed || '', shades: (R.onHand || []).length }));
