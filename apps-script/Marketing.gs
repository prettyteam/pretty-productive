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
function mktPublic_(s) { return { ok: true, edits: s.edits, albums: s.albums, photos: s.photos.map(p => ({ id: p.id, album: p.album, w: p.w, h: p.h, addedAt: p.addedAt, by: p.by || '', video: p.kind === 'video' || undefined, vf: p.kind === 'video' ? p.f : undefined, wid: p.wid || undefined })), hidden: s.hidden, rev: s.rev || 0, sort: !!mktSortKey_() }; }

function mkt_(d) {
  if (mktHex_(String(d.code || '').replace(/\s+/g, '')) !== MKT_CODE_SHA) return { ok: false, error: 'signin' };
  if (d.op === 'thumbs') return mktThumbs_(mktRead_(), d);   // read-only, so it doesn't queue behind uploads (Oct 23 2026)
  if (d.op === 'sort') return mktSort_(d);                    // asks Claude first, takes the lock only to save the moves
  if (d.op === 'sortKey') {                                    // one time: the Claude key for auto-sort, kept in Script Properties
    const k = String(d.key || '').trim();
    if (!/^sk-ant-[\w-]{20,}$/.test(k)) return { ok: false, error: 'key' };
    PropertiesService.getScriptProperties().setProperty('MKT_CLAUDE_KEY', k);
    return { ok: true, sort: true };
  }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const s = mktRead_();
    switch (d.op) {
      case 'state': mktModelsSync_(s); return mktPublic_(s);   // new associate model photos first (AssociateModels.gs)
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
      case 'move': {   // {id, album}: Undo after auto-sort, or moving one by hand
        const p = s.photos.find(x => x.id === d.id), to = String(d.album || '');
        if (!p || !mktSortAlbums_(s).some(a => a.id === to) && !s.albums.some(a => a.id === to)) return { ok: false, error: 'bad_request' };
        p.album = to; p.sorted = 1;
        return mktPublic_(mktWrite_(s));
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

// {ids:[…]} -> {id: 'data:image/jpeg;base64,…'}; skips anything over 4 MB (a video with no small cover) so one big file can't stall the rest.
function mktThumbs_(s, d) {
  const out = {};
  (d.ids || []).slice(0, 40).forEach(id => { const p = s.photos.find(x => x.id === id); if (!p) return;
    try { const f = DriveApp.getFileById(d.full && p.kind !== 'video' ? p.f : p.t);
      // A video with no cover picture (iPhones don't always make one) gets Drive's own still instead (Oct 24 2026).
      const b = /^image\//.test(f.getMimeType()) && f.getSize() <= 4 * 1048576 ? f.getBlob() : d.full ? null : f.getThumbnail();
      if (b) out[id] = 'data:' + (b.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(b.getBytes()); } catch (e) {} });
  return { ok: true, photos: out };
}

// Auto-sort (Alexandra, Oct 24 2026): after an upload Claude looks at each new photo's small copy and moves it to the
// album it fits best, so a photo added to the wrong album lands where it belongs. The page shows what moved, with Undo.
// Wedding Day Favorites albums (album.parent 'bridal') are never sorted into or out of: those are per wedding.
// Same for each person's My Work album (album.model), which shows inside Employee Content.
function mktSortKey_() { return PropertiesService.getScriptProperties().getProperty('MKT_CLAUDE_KEY') || ''; }
function mktSortAlbums_(s) {
  return [
    { id: 'branding', name: 'Hi Pretty Branding Shoot', about: 'the Hi Pretty brand photo shoot: styled model portraits, beauty and lifestyle shots, Hi Pretty products' },
    { id: 'bridal', name: 'Taffeta Bridal', about: 'weddings: brides, bridesmaids and bridal parties, wedding day hair and makeup, veils, getting-ready moments' },
    { id: 'salon', name: 'Taffeta Salon & Spa', about: 'the salon and spa: everyday hair color, cuts and styling, facials and skin care, the salon space, retail products, the team at work' }
  ].concat(s.albums.filter(a => !a.parent && !a.model).map(a => ({ id: a.id, name: a.name, about: '' })));
}
function mktSort_(d) {
  const key = mktSortKey_();
  if (!key) return { ok: false, error: 'nokey' };
  let s = mktRead_();
  const albums = mktSortAlbums_(s), ok = {};
  albums.forEach(a => { ok[a.id] = 1; });
  const list = (d.ids || []).slice(0, 12).map(id => s.photos.find(x => x.id === id))
    .filter(p => p && p.kind !== 'video' && !p.sorted && ok[p.album]);
  const menu = albums.map(a => '- ' + a.id + ': ' + a.name + (a.about ? ' (' + a.about + ')' : '')).join('\n');
  const reqs = [], todo = [];
  list.forEach(p => {
    let b;
    try { const f = DriveApp.getFileById(p.t); if (f.getSize() > 4 * 1048576) return; b = f.getBlob(); } catch (e) { return; }
    todo.push(p);
    reqs.push({
      url: 'https://api.anthropic.com/v1/messages', method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2026-10-21', 'anthropic-beta': 'server-side-fallback-2026-07-01' },
      payload: JSON.stringify({
        model: 'claude-opus-5-5', max_tokens: 1024, fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: {
          type: 'object', properties: { album: { type: 'string', enum: albums.map(a => a.id) }, sure: { type: 'boolean' } },
          required: ['album', 'sure'], additionalProperties: false } } },
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: b.getContentType() || 'image/jpeg', data: Utilities.base64Encode(b.getBytes()) } },
          { type: 'text', text: 'This photo is for Taffeta, a salon, spa and bridal hair and makeup business. Which album does it belong in?\n' + menu +
            '\n\nIt was added to "' + p.album + '". Set sure to true only if it clearly belongs in the album you pick.' }
        ] }]
      })
    });
  });
  const picks = {};
  if (reqs.length) UrlFetchApp.fetchAll(reqs).forEach((r, i) => {
    try {
      const j = JSON.parse(r.getContentText());
      if (r.getResponseCode() !== 200 || j.stop_reason === 'refusal') return;
      const t = (j.content || []).find(c => c.type === 'text');
      const a = t && JSON.parse(t.text);
      if (a && ok[a.album]) picks[todo[i].id] = a;
    } catch (e) {}
  });
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    s = mktRead_();
    const moves = [];
    todo.forEach(q => {
      const p = s.photos.find(x => x.id === q.id), a = picks[q.id];
      if (!p || !a || p.album !== q.album) return;   // someone moved or deleted it meanwhile
      p.sorted = 1;
      if (a.sure && a.album !== p.album) { moves.push({ id: p.id, from: p.album, to: a.album }); p.album = a.album; }
    });
    if (Object.keys(picks).length) mktWrite_(s);
    return Object.assign(mktPublic_(s), { moves: moves });
  } finally { lock.releaseLock(); }
}
