/**
 * Wedding day favorites (Alexandra, Oct 23 2026).
 * After a wedding, the artists on it add their favorite photos and videos from the Weddings App (Schedule → the wedding → Photos).
 * Each wedding gets its own album on Taffeta Marketing Proofs (Photos tab), and its own Drive folder inside
 * "Taffeta Marketing Proofs (team photos)/Wedding Day Favorites", so Alexandra and Dom see everything in one place.
 * The album and its photos live in the Marketing Proofs state (Marketing.gs); album.wid ties it to the wedding.
 *
 * Videos are too big for one request, so the app sends them in 8 MB pieces: favVideoStart opens a Drive resumable upload,
 * favVideoChunk passes each piece along. Pieces run outside the script lock so a long video doesn't hold up everyone else.
 *
 * Hooked into Weddings.gs doPost:
 *   before the lock:  if (d.action === 'favVideoChunk' || d.action === 'favVideoCheck') (both, the same way)
 *                     if (d.action === 'favVideoChunk') { const w0 = who_(d); return json_(w0 ? favVideoChunk_(w0, d) : { ok: false, error: 'signin' }); }
 *                     if (d.action === 'addFav') { const w0 = who_(d); return json_(w0 ? addFav_(w0, d.id, d.photo) : { ok: false, error: 'signin' }); }
 *   inside the switch: case 'favVideoStart': return json_(favVideoStart_(who, d.id, d.video));
 */
const FAV_MAX = 200;   // per wedding

function favBy_(who) { return who.role === 'office' ? 'Office' : (who.member.preferredName || who.member.legalName || 'Artist'); }   // same name the app's other photos use

function favRoot_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FAV_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = mktFolder_().createFolder('Wedding Day Favorites');
  props.setProperty('FAV_FOLDER', f.getId());
  return f;
}

/** "Katie Layden · Oct 18, 2026" */
function favName_(w) {
  let when = '';
  if (w.d.date) { try { when = Utilities.formatDate(new Date(w.d.date + 'T12:00:00'), TZ, 'MMM d, yyyy'); } catch (e) { when = w.d.date; } }
  return (String(w.d.bride || 'Bride').trim() + (when ? ' · ' + when : '')).slice(0, 60);
}

/** The wedding's album on Marketing Proofs (made the first time someone adds a favorite), with its Drive folder. */
function favAlbum_(s, w) {
  let a = s.albums.find(x => x.wid === w.d.id);
  if (!a) {
    a = { id: 'w' + Utilities.getUuid().replace(/-/g, '').slice(0, 10), name: favName_(w), wid: w.d.id, date: w.d.date || '', parent: 'bridal', createdAt: Date.now() };
    s.albums.push(a);
  }
  let folder = null;
  if (a.folder) { try { folder = DriveApp.getFolderById(a.folder); } catch (e) {} }
  if (!folder) { folder = favRoot_().createFolder(((w.d.date || '') + ' ' + String(w.d.bride || 'Bride')).trim().replace(/[\/\\]/g, '-')); a.folder = folder.getId(); }
  return { album: a, folder: folder };
}

function favFile_(by, ext) { return by + ' - ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HHmmss') + '-' + Math.floor(Math.random() * 1000) + '.' + ext; }

/** photo: {data:'<base64 jpeg>', thumb:'<base64 jpeg>', w, h}. Runs before doPost's lock (Oct 24 2026): the lock is held only
 *  to find or make the wedding's album, then again to list the photo, so several photos can go into Drive at once. */
function addFav_(who, id, photo) {
  const w = wedFor_(who, id);
  if (!w || !photo || !photo.data) return { ok: false, error: 'not_found' };
  const by = favBy_(who), lock = LockService.getScriptLock();
  let album, folder;
  try {
    lock.waitLock(30000);
    const s = mktRead_();
    if (s.photos.filter(p => p.wid === id).length >= FAV_MAX) return { ok: false, error: 'too_many', message: 'This wedding already has ' + FAV_MAX + ' favorites.' };
    const was = (s.albums.find(x => x.wid === id) || {}).folder || '';
    const fa = favAlbum_(s, w);
    if (fa.album.folder !== was) mktWrite_(s);   // keeps the album and its folder if they were just made
    album = fa.album.id; folder = fa.folder;
  } finally { lock.releaseLock(); }
  const name = favFile_(by, 'jpg');
  const full = folder.createFile(Utilities.newBlob(Utilities.base64Decode(photo.data), 'image/jpeg', name));
  const thumb = photo.thumb ? folder.createFile(Utilities.newBlob(Utilities.base64Decode(photo.thumb), 'image/jpeg', name.replace('.jpg', ' (small).jpg'))) : full;
  const p = { id: 'p' + Utilities.getUuid().replace(/-/g, '').slice(0, 14), album: album, wid: id, kind: 'photo', w: Number(photo.w) || 0, h: Number(photo.h) || 0, addedAt: Date.now(), by: clean_(by, 40), f: full.getId(), t: thumb.getId() };
  try {
    lock.waitLock(30000);
    const s = mktRead_();
    s.photos.unshift(p); mktWrite_(s);
  } finally { lock.releaseLock(); }
  return { ok: true, photo: favOut_(p) };
}

/** video: {name, type, size, thumb:'<base64 jpeg first frame>', w, h}. Opens a Drive resumable upload in the wedding's folder. */
function favVideoStart_(who, id, video) {
  const w = wedFor_(who, id);
  if (!w || !video || !(video.size > 0)) return { ok: false, error: 'not_found' };
  if (video.size > 1024 * 1048576) return { ok: false, error: 'too_big', message: 'That video is over 1 GB. Trim it on your phone first.' };
  const s = mktRead_();
  if (s.photos.filter(p => p.wid === id).length >= FAV_MAX) return { ok: false, error: 'too_many', message: 'This wedding already has ' + FAV_MAX + ' favorites.' };
  const by = favBy_(who), fa = favAlbum_(s, w);
  mktWrite_(s);   // keeps the album (and its folder) if it was just made
  const type = /^video\/[\w.+-]+$/.test(video.type || '') ? video.type : 'video/mp4';
  const ext = (String(video.name || '').match(/\.(\w{2,4})$/) || [, type === 'video/quicktime' ? 'mov' : 'mp4'])[1].toLowerCase();
  const name = favFile_(by, ext);
  const url = favUploadUrl_({ name: name, mimeType: type, parents: [fa.folder.getId()] }, type, video.size);
  if (!url) return { ok: false, error: 'server', message: 'Drive did not take the video. Try again.' };
  const thumb = video.thumb ? fa.folder.createFile(Utilities.newBlob(Utilities.base64Decode(video.thumb), 'image/jpeg', name.replace(/\.\w+$/, ' (cover).jpg'))).getId() : '';
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('fav:' + token, JSON.stringify({ url: url, size: video.size, type: type, wid: id, album: fa.album.id, by: clean_(by, 40), t: thumb, w: Number(video.w) || 0, h: Number(video.h) || 0, uid: who.role === 'office' ? 'office' : who.member.id }), 21600);
  return { ok: true, token: token, url: url };
}

/** Faster videos (Oct 26 2026): the Origin header lets the Weddings App page send the whole video straight to this Drive
 *  upload link (it only lets it add this one file). favVideoCheck then asks Drive how much arrived; the rest goes in pieces. */
function favUploadUrl_(meta, type, size) {
  const go = origin => {
    const h = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(size) };
    if (origin) h.Origin = 'https://prettyteam.taffetadesign.com';
    const r = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'post', contentType: 'application/json; charset=UTF-8', muteHttpExceptions: true, headers: h, payload: JSON.stringify(meta) });
    return r.getResponseCode() === 200 ? (r.getHeaders().Location || r.getHeaders().location || '') : '';
  };
  let url = '';
  try { url = go(true); } catch (e) {}
  return url || go(false);
}
function favVideoCheck_(who, d) {
  const key = 'fav:' + String(d.token || ''), raw = CacheService.getScriptCache().get(key);
  if (!raw) return { ok: false, error: 'expired', message: 'The upload timed out. Add the video again.' };
  const u = JSON.parse(raw);
  if (u.uid !== (who.role === 'office' ? 'office' : who.member.id)) return { ok: false, error: 'signin' };
  const r = UrlFetchApp.fetch(u.url, { method: 'put', muteHttpExceptions: true, headers: { 'Content-Range': 'bytes */' + u.size } });
  const code = r.getResponseCode();
  if (code === 308) { const m = String(r.getHeaders().Range || r.getHeaders().range || '').match(/-(\d+)$/); return { ok: true, next: m ? Number(m[1]) + 1 : 0 }; }
  if (code !== 200 && code !== 201) return { ok: false, error: 'server', message: 'Drive did not take the video. Try again.' };
  return favVideoSaved_(key, u, JSON.parse(r.getContentText()).id);
}

/** {token, offset, data:'<base64 piece>'}: every piece is a multiple of 256 KB except the last. */
function favVideoChunk_(who, d) {
  const key = 'fav:' + String(d.token || ''), raw = CacheService.getScriptCache().get(key);
  if (!raw) return { ok: false, error: 'expired', message: 'The upload timed out. Add the video again.' };
  const u = JSON.parse(raw);
  if (u.uid !== (who.role === 'office' ? 'office' : who.member.id)) return { ok: false, error: 'signin' };
  const bytes = Utilities.base64Decode(String(d.data || '')), start = Number(d.offset) || 0, end = start + bytes.length - 1;
  const r = UrlFetchApp.fetch(u.url, { method: 'put', contentType: u.type, payload: bytes, muteHttpExceptions: true, headers: { 'Content-Range': 'bytes ' + start + '-' + end + '/' + u.size } });
  const code = r.getResponseCode();
  if (code === 308) { const m = String(r.getHeaders().Range || r.getHeaders().range || '').match(/-(\d+)$/); return { ok: true, next: m ? Number(m[1]) + 1 : end + 1 }; }
  if (code !== 200 && code !== 201) return { ok: false, error: 'server', message: 'A piece of the video did not go through. Try again.' };
  return favVideoSaved_(key, u, JSON.parse(r.getContentText()).id);
}
function favVideoSaved_(key, u, fileId) {
  CacheService.getScriptCache().remove(key);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const s = mktRead_();
    const p = { id: 'v' + Utilities.getUuid().replace(/-/g, '').slice(0, 14), album: u.album, wid: u.wid, kind: 'video', w: u.w, h: u.h, addedAt: Date.now(), by: u.by, f: fileId, t: u.t || fileId };
    s.photos.unshift(p); mktWrite_(s);
    return { ok: true, done: true, photo: favOut_(p) };
  } finally { lock.releaseLock(); }
}

function favOut_(p) { return { id: p.id, kind: 'fav', video: p.kind === 'video', vf: p.kind === 'video' ? p.f : undefined, by: p.by, at: new Date(p.addedAt).toISOString() }; }   // vf lets a tapped video play

/** This wedding's favorites, for the Photos card in the app. */
function favList_(id) { try { return mktRead_().photos.filter(p => p.wid === id).map(favOut_); } catch (e) { return []; } }

/** Small pictures for the app (a video sends its cover). Full size only for photos. */
function favData_(id, ids, full) {
  const out = {}, want = {};
  (ids || []).forEach(x => { want[x] = 1; });
  mktRead_().photos.filter(p => p.wid === id && want[p.id]).forEach(p => {
    try { const b = DriveApp.getFileById(full && p.kind !== 'video' ? p.f : p.t).getBlob(); out[p.id] = 'data:' + (b.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(b.getBytes()); } catch (e) {}
  });
  return out;
}

/** The person who added it, or the office, can take it back out. */
function delFav_(who, id, favId) {
  const s = mktRead_(), p = s.photos.find(x => x.id === favId && x.wid === id);
  if (!p) return null;
  if (who.role !== 'office' && p.by !== favBy_(who)) return { ok: false, error: 'not_yours', message: 'Only the person who added it can remove it.' };
  [p.f, p.t].forEach(fid => { try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) {} });
  s.photos = s.photos.filter(x => x.id !== favId); mktWrite_(s);
  return { ok: true };
}
