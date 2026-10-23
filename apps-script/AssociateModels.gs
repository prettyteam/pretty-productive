/**
 * My Work photos and videos on Marketing Proofs (Alexandra, Oct 23 2026).
 * Everyone on the team adds a before and an after (photo or video) in the team app's My Work page. The desk script saves them in
 * Drive under "Associate Model Photos/<name>" (small pictures and video covers in ".small"). Here, every time Marketing Proofs
 * loads, any new ones are added to that person's own album ("Kat’s Work"), so Alexandra and Dominique see them by name.
 * Nothing is copied: the album points at the same Drive files. Deleting one on Marketing Proofs trashes it in Drive.
 *
 * Hooked into Marketing.gs mkt_: case 'state': mktModelsSync_(s); return mktPublic_(s);
 */
const MODELS_FOLDER = 'Associate Model Photos';

function mktModelsSync_(s) {
  const cache = CacheService.getScriptCache();
  if (cache.get('mktModels')) return false;   // look at Drive at most every 2 minutes
  cache.put('mktModels', '1', 120);
  const it = DriveApp.getFoldersByName(MODELS_FOLDER);
  if (!it.hasNext()) return false;
  const root = it.next(), have = {}, small = {};
  s.photos.forEach(p => { if (p.f) have[p.f] = 1; });
  const si = root.getFoldersByName('.small');
  if (si.hasNext()) { const fi = si.next().getFiles(); while (fi.hasNext()) { const f = fi.next(); if (!f.isTrashed()) small[f.getName()] = f.getId(); } }
  const noExt = n => n.replace(/\.\w+$/, '');   // a video's cover is a .jpg, so match names without the ending
  const smallFor = n => { n = noExt(n); const k = Object.keys(small).find(x => noExt(x).slice(-(n.length + 1)) === ' ' + n); return k ? small[k] : ''; };
  let changed = false;
  const subs = root.getFolders();
  while (subs.hasNext()) {
    const sub = subs.next(), name = sub.getName();
    if (name === '.small' || sub.isTrashed()) continue;
    const files = sub.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      if (have[f.getId()] || f.isTrashed()) continue;
      let a = s.albums.find(x => x.model === name);
      if (!a) { a = { id: 'm' + Utilities.getUuid().replace(/-/g, '').slice(0, 10), name: (name + '’s Work').slice(0, 60), model: name, createdAt: Date.now() }; s.albums.push(a); }
      const m = f.getName().replace(/\.\w+$/, '').match(/^\d{4}-\d{2}-\d{2} (.+) - (before|after)$/);   // "2026-10-22 Basic blowdry - before"
      const by = name + (m ? ' · ' + m[1] + ', ' + m[2] : '');
      const vid = /^video\//.test(f.getMimeType());
      s.photos.unshift({ id: (vid ? 'v' : 'p') + Utilities.getUuid().replace(/-/g, '').slice(0, 14), album: a.id, kind: vid ? 'video' : 'photo', w: 0, h: 0, addedAt: f.getDateCreated().getTime(), by: by.slice(0, 60), f: f.getId(), t: smallFor(f.getName()) || f.getId() });
      have[f.getId()] = 1; changed = true;
    }
  }
  if (changed) mktWrite_(s);
  return changed;
}
