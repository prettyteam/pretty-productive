// Pretty Productive site publisher.
// Encrypts today's data into d/<id>.json, one file per stylist plus one for The Pretty Report.
// Each file opens only with that person's private link secret + PIN. No secrets are written to the repo.
//
// Usage:
//   node tools/publish.mjs --data data.json --keys keys.json --base https://prettyteam.taffetadesign.com/
//
// data.json: { daily: {...}, pages: [ {slug,name,...}, ... ], week: {...} }   (same shapes as The Pretty Report's database)
// keys.json: { leadership: {id, secret, pin}, stylists: { <slug>: {id, secret, pin} } }   (kept OUTSIDE the repo)
// Stylists missing from keys.json get new keys; keys.json is rewritten and the new links are printed.
import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createHmac } from 'node:crypto';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'd');
const base = (args.base || 'https://prettyteam.taffetadesign.com/').replace(/\/?$/, '/');
const ITER = 150000;
const enc = new TextEncoder();
const b64 = (u) => Buffer.from(u).toString('base64');
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
const b64url = (u) => Buffer.from(u).toString('base64url');
const pinOf = (len) => { let s = ''; const r = rand(len * 2); for (let i = 0; i < len; i++) s += String(r[i] % 10); return s; };

async function seal(obj, secret, pin) {
  const salt = rand(16), iv = rand(12);
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(secret + ':' + pin), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
  // verify round-trip before writing
  const back = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)));
  if (JSON.stringify(back) !== JSON.stringify(obj)) throw new Error('round-trip mismatch');
  return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
const newKey = (pinLen) => ({ id: b64url(rand(9)), secret: b64url(rand(18)), pin: pinOf(pinLen) });
const linkFor = (kind, k) => `${base}#${kind}.${k.id}.${k.secret}`;


// Encrypted documents (handbook, desk guide). PDFs are encrypted once with a per-set key; the key travels only inside
// the sealed page data of people who may read it. Source PDFs live outside the repo (--docs <dir>).
import { createHash } from 'node:crypto';
async function sealBytes(bytes, keyB64) {
  const iv = rand(12);
  const key = await crypto.subtle.importKey('raw', Buffer.from(keyB64, 'base64'), 'AES-GCM', false, ['encrypt', 'decrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const back = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
  if (Buffer.compare(Buffer.from(back), Buffer.from(bytes)) !== 0) throw new Error('doc round-trip mismatch');
  const out = new Uint8Array(12 + ct.length); out.set(iv, 0); out.set(ct, 12); return out;
}

const data = JSON.parse(fs.readFileSync(args.data, 'utf8'));
const keys = fs.existsSync(args.keys) ? JSON.parse(fs.readFileSync(args.keys, 'utf8')) : {};
keys.stylists ||= {};
const created = [];
// Team Hub (time clock): each person's app link carries a signed token the Apps Script checks.
keys.team ||= { secret: b64url(rand(24)), admin: b64url(rand(18)) };
const teamSign = (slug) => createHmac('sha256', keys.team.secret).update(String(slug)).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 22);
keys.docs ||= {};
if (args.docs) {
  // <dir>/docs.json: { hb:{name, files:["hb"]}, fg:{name, tabs:[[file,label],...]} }; PDFs are <dir>/<file>.pdf
  const cfg = JSON.parse(fs.readFileSync(path.join(args.docs, 'docs.json'), 'utf8'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  for (const [set, c] of Object.entries(cfg)) {
    keys.docs[set] ||= { key: Buffer.from(rand(32)).toString('base64'), sha: {} };
    keys.docs[set].name = c.name; keys.docs[set].tabs = c.tabs || null;
    const files = c.tabs ? c.tabs.map((t) => t[0]) : c.files;
    for (const f of files) {
      const bytes = fs.readFileSync(path.join(args.docs, f + '.pdf'));
      const sha = createHash('sha256').update(bytes).digest('hex');
      const out = path.join(root, 'docs', f + '.enc');
      if (keys.docs[set].sha[f] !== sha || !fs.existsSync(out)) { fs.writeFileSync(out, await sealBytes(bytes, keys.docs[set].key)); keys.docs[set].sha[f] = sha; }
    }
  }
}
const docsFor = (slug, leader) => {
  const o = {};
  if (keys.docs.hb) o.hb = { k: keys.docs.hb.key, name: keys.docs.hb.name, files: ['hb'] };
  if (keys.docs.fg && (leader || guideSet.has(slug))) o.fg = { k: keys.docs.fg.key, name: keys.docs.fg.name, tabs: keys.docs.fg.tabs };
  return Object.keys(o).length ? o : null;
};
// Team app defaults live in tools/team.json, so a run that doesn't send 'team' keeps the time clock and extra pages.
const teamDefaults = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'team.json'), 'utf8'));
const fullGuideSet = new Set((data.team && data.team.fullGuide) || teamDefaults.fullGuide || []);
const advMap = { ...(teamDefaults.adv || {}), ...((data.team && data.team.adv) || {}) };
const guideUrl = keys.team && keys.team.guideUrl;
const guideSet = new Set((data.team && data.team.docsGuide) || teamDefaults.docsGuide || []);
const socialAll = (data.team && data.team.social) || teamDefaults.social || null;
const clockSet = new Set((data.team && data.team.clock) || teamDefaults.clock || []);
data.pages ||= [];
for (const x of ((data.team && data.team.extra) || teamDefaults.extra || [])) if (!data.pages.some((p) => p && p.slug === x.slug)) data.pages.push({ ...x });
if (!keys.leadership) { keys.leadership = newKey(6); created.push(['The Pretty Report', linkFor('r', keys.leadership), keys.leadership.pin]); }
const pages = (data.pages || []).filter((p) => p && p.slug);
for (const p of pages) {
  if (!keys.stylists[p.slug]) { keys.stylists[p.slug] = newKey(4); created.push([p.name, linkFor('s', keys.stylists[p.slug]), keys.stylists[p.slug].pin]); }
}
fs.mkdirSync(outDir, { recursive: true });
const strip = (p) => { const { link, ...rest } = p; return rest; };
let n = 0;
for (const p of pages) {
  const k = keys.stylists[p.slug];
  const mine = { ...strip(p), link: linkFor('s', k), staff: { slug: p.slug, t: teamSign(p.slug), clock: clockSet.has(p.slug) } };
  if (guideUrl && fullGuideSet.has(p.slug)) mine.fullGuide = guideUrl;
  if (advMap[p.slug]) mine.adv = advMap[p.slug];
  const dd = docsFor(p.slug, false); if (dd) { mine.docs = dd; if (dd.fg) delete mine.fullGuide; }
  if (socialAll) mine.social = { week: socialAll.week, posts: p.role === 'esthetician' ? socialAll.esti : socialAll.hair };
  fs.writeFileSync(path.join(outDir, k.id + '.json'), JSON.stringify(await seal({ daily: data.daily || null, mine }, k.secret, k.pin)));
  n++;
}
const board = { daily: data.daily || null, week: data.week || null, payroll: data.payroll || [], month: data.month || null, hub: { admin: keys.team.admin }, guideUrl: guideUrl || null, docs: docsFor('', true), pages: pages.map((p) => ({ ...strip(p), link: linkFor('s', keys.stylists[p.slug]) })) };
fs.writeFileSync(path.join(outDir, keys.leadership.id + '.json'), JSON.stringify(await seal(board, keys.leadership.secret, keys.leadership.pin)));
fs.writeFileSync(args.keys, JSON.stringify(keys, null, 1));
console.log(`Sealed ${n} stylist files + The Pretty Report into d/.`);
if (created.length) { console.log('NEW LINKS (send privately):'); for (const [name, url, pin] of created) console.log(`${name}\t${url}\tPIN ${pin}`); }
