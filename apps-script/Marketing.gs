/**
 * Taffeta Marketing Proofs on prettyteam.taffetadesign.com/mkt (Alexandra, Oct 17 2026).
 * Approvals, caption edits, albums and the photos the team adds from their phones live here, in info@'s Drive,
 * so the proofs page works anywhere without signing in to Claude. Every call needs the marketing passcode
 * (only its SHA-256 is kept here). Hooked into doPost with: if (d.action === 'mkt') return json_(mkt_(d));
 */
const MKT_CODE_SHA = '2b8630dbf5d56e63b0c846ff886289dfccf5049b29a395c76cd0287cc101859a';

function mktHex_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s || ''), Utilities.Charset.UTF_8).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join(''); }

function mktFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('MKT_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('Taffeta Marketing Proofs (team photos)');
  props.setProperty('MKT_FOLDER', f.getId());
  return f;
}

function mktStateFile_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('MKT_STATE');
  if (id) { try { return DriveApp.getFileById(id); } catch (e) {} }
  const f = mktFolder_().createFile('marketing-state.json', JSON.stringify({ edits: { text: {}, ok: {} }, albums: [], photos: [], hidden: [], rev: 0 }), 'application/json');
  props.setProperty('MKT_STATE', f.getId());
  return f;
}
function mktRead_() { const s = JSON.parse(mktStateFile_().getBlob().getDataAsString() || '{}'); s.edits = s.edits || { text: {}, ok: {} }; s.edits.text = s.edits.text || {}; s.edits.ok = s.edits.ok || {}; s.albums = s.albums || []; s.photos = s.photos || []; s.hidden = s.hidden || []; return s; }
function mktWrite_(s) { s.rev = (s.rev || 0) + 1; s.updatedAt = new Date().toISOString(); mktStateFile_().setContent(JSON.stringify(s)); return s; }
function mktPublic_(s) { return { ok: true, edits: s.edits, albums: s.albums, photos: s.photos.map(p => ({ id: p.id, album: p.album, w: p.w, h: p.h, addedAt: p.addedAt, by: p.by || '' })), hidden: s.hidden, rev: s.rev || 0 }; }

function mkt_(d) {
  if (mktHex_(String(d.code || '').replace(/\s+/g, '')) !== MKT_CODE_SHA) return { ok: false, error: 'signin' };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const s = mktRead_();
    switch (d.op) {
      case 'state': return mktPublic_(s);
      case 'save': {   // only what changed: {text:{id:'…'}, ok:{id:true|false}}, so two people saving don't undo each other
        Object.keys(d.text || {}).forEach(k => { s.edits.text[String(k).slice(0, 80)] = String(d.text[k] == null ? '' : d.text[k]).slice(0, 5000); });
        Object.keys(d.ok || {}).forEach(k => { if (d.ok[k]) s.edits.ok[String(k).slice(0, 80)] = true; else delete s.edits.ok[k]; });
        return mktPublic_(mktWrite_(s));
      }
      case 'seed': {   // one time: the approvals and edits carried over from the Claude version
        if ((s.rev || 0) > 0 && !d.force) return { ok: false, error: 'already' };
        s.edits = { text: (d.edits && d.edits.text) || {}, ok: (d.edits && d.edits.ok) || {} };
        return mktPublic_(mktWrite_(s));
      }
      case 'album': {
        const name = String(d.name || '').trim().slice(0, 60);
        if (!name) return { ok: false, error: 'name' };
        const a = { id: 'a' + Utilities.getUuid().replace(/-/g, '').slice(0, 10), name: name, createdAt: Date.now() };
        s.albums.push(a); mktWrite_(s);
        return Object.assign(mktPublic_(s), { id: a.id });
      }
      case 'addPhoto': {   // {album, data:<base64 jpeg>, thumb:<base64 jpeg>, w, h, type}
        if (!d.data || !d.album) return { ok: false, error: 'bad_request' };
        if (s.photos.length >= 3000) return { ok: false, error: 'too_many' };
        const folder = mktFolder_(), id = 'p' + Utilities.getUuid().replace(/-/g, '').slice(0, 14);
        const type = /^image\/(jpeg|png|webp|gif)$/.test(d.type || '') ? d.type : 'image/jpeg';
        const ext = type.split('/')[1].replace('jpeg', 'jpg');
        const full = folder.createFile(Utilities.newBlob(Utilities.base64Decode(d.data), type, id + '.' + ext));
        const thumb = d.thumb ? folder.createFile(Utilities.newBlob(Utilities.base64Decode(d.thumb), 'image/jpeg', id + ' (small).jpg')) : full;
        const p = { id: id, album: String(d.album).slice(0, 40), w: Number(d.w) || 0, h: Number(d.h) || 0, addedAt: Date.now(), by: String(d.by || '').slice(0, 40), f: full.getId(), t: thumb.getId() };
        s.photos.unshift(p); mktWrite_(s);
        return { ok: true, photo: { id: p.id, album: p.album, w: p.w, h: p.h, addedAt: p.addedAt } };
      }
      case 'thumbs': {   // {ids:[…]} -> {id: 'data:image/jpeg;base64,…'}
        const out = {};
        (d.ids || []).slice(0, 40).forEach(id => { const p = s.photos.find(x => x.id === id); if (!p) return;
          try { const b = DriveApp.getFileById(d.full ? p.f : p.t).getBlob(); out[id] = 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes()); } catch (e) {} });
        return { ok: true, photos: out };
      }
      case 'delPhoto': {   // Drive photos go to Drive's trash (kept 30 days); carried-over photos are just hidden
        const p = s.photos.find(x => x.id === d.id);
        if (p) { [p.f, p.t].forEach(fid => { try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) {} }); s.photos = s.photos.filter(x => x.id !== d.id); }
        else if (d.id && s.hidden.indexOf(d.id) < 0) s.hidden.push(String(d.id).slice(0, 60));
        return mktPublic_(mktWrite_(s));
      }
    }
    return { ok: false, error: 'bad_request' };
  } finally { lock.releaseLock(); }
}
