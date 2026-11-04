/**
 * Job offers (date holds): the office offers an upcoming wedding to chosen artists, with ranges only
 * (headcount, travel minimum, payout), and each artist answers Yes / No on her private link.
 * The office still texts each artist herself; emails go out too (JobMail.gs).
 * Offers live on the "Job offers" tab of this Sheet, one row per artist.
 */
const JOBS_TAB = 'Job offers';
const JOBS_HEADERS = ['Id', 'Wedding id', 'Bride', 'Date', 'Location', 'Artist id', 'Artist', 'Role', 'Headcount', 'Travel minimum',
                      'Payout', 'Note', 'Status', 'Sent at', 'Answered at', 'Reminded at', 'Asked by', 'How', 'Opened at'];

function jobsSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(JOBS_TAB);
  if (!sh) {
    sh = ss.insertSheet(JOBS_TAB);
    sh.getRange(1, 1, 1, JOBS_HEADERS.length).setValues([JOBS_HEADERS]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:S').setNumberFormat('@');
  }
  /* tabs made before "Reminded at" / "Asked by, How, Opened at" (Nov 4 2026) get the new headings */
  const have = sh.getRange(1, 1, 1, JOBS_HEADERS.length).getValues()[0];
  JOBS_HEADERS.forEach((h, i) => { if (have[i] !== h) sh.getRange(1, i + 1).setValue(h).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff').offset(1, 0, Math.max(sh.getMaxRows() - 1, 1)).setNumberFormat('@'); });
  return sh;
}

function jobRows_() {
  const sh = jobsSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, JOBS_HEADERS.length).getValues().map((r, i) => ({
    row: i + 2, id: String(r[0]), weddingId: String(r[1]), bride: String(r[2]), date: r[3] instanceof Date ? Utilities.formatDate(r[3], TZ, 'yyyy-MM-dd') : String(r[3]), location: String(r[4]),
    artistId: String(r[5]), artist: String(r[6]), role: String(r[7]), headcount: String(r[8]), travel: String(r[9]),
    payout: String(r[10]), note: String(r[11]), status: String(r[12]) || 'Waiting', sentAt: String(r[13]), answeredAt: String(r[14]), remindedAt: String(r[15]),
    askedBy: String(r[16] || ''), how: String(r[17] || '') || 'App', openedAt: String(r[18] || '')
  })).filter(j => j.id);
}

const jobPublic_ = j => { const o = Object.assign({}, j); delete o.row; delete o.remindedAt; return o; };   // askedBy, how, openedAt go to the office's "Who we asked"

/** Office: every offer for weddings from 30 days ago on. */
function jobs_() {
  const since = Utilities.formatDate(new Date(Date.now() - 30 * 864e5), TZ, 'yyyy-MM-dd');
  const ct = calTimes_();
  return { ok: true, jobs: jobRows_().filter(j => !j.date || j.date >= since).map(j => Object.assign(jobPublic_(j), { calTime: ct[j.weddingId] || '' })), top: jobTop_() };
}

/** Office: one offer row per chosen artist. */
function offerJob_(o) {
  o = o || {};
  const w = weddings_().find(x => x.d.id === o.weddingId);
  if (!w) return { ok: false, error: 'bad_request', message: 'Pick a wedding.' };
  const ids = Array.isArray(o.memberIds) ? o.memberIds.map(String) : [];
  const team = members_().filter(m => ids.indexOf(m.id) >= 0);
  if (!team.length) return { ok: false, error: 'bad_request', message: 'Pick at least one artist.' };
  const role = o.role === 'mu' ? 'Makeup' : o.role === 'both' ? 'Hair & makeup' : 'Hair';
  const sh = jobsSheet_(), now = new Date().toISOString();
  team.forEach(m => sh.appendRow(['j' + code_(10).toLowerCase(), w.d.id, clean_(w.d.bride, 120), w.d.date || '',
    clean_([w.d.location, w.d.room].filter(Boolean).join(', '), 200), m.id, clean_(m.preferredName || m.legalName, 120), role,
    clean_(o.headcount, 60), clean_(o.travel, 60), clean_(o.payout, 60), clean_(o.note, 500), 'Waiting', now, '', '', clean_(o.askedBy, 40), 'App', '']));
  pushJobOffer_(team.map(m => m.id), w.d.date, role);
  mailJobOffer_(team, w, role, o);
  return jobs_();
}

/** Artist: her own offers, upcoming only. */
function myJobs_(member) {
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  /* the first time her waiting offer reaches her phone, note it, so the office sees "Opened, no answer" vs "Not opened yet" (Nov 4 2026) */
  const sh = jobsSheet_(), now = new Date().toISOString();
  jobRows_().filter(j => j.artistId === member.id && j.how !== 'Text' && j.status === 'Waiting' && !j.openedAt && (!j.date || j.date >= today))
    .forEach(j => sh.getRange(j.row, 19).setValue(now));
  const ct = calTimes_();
  return { ok: true, jobs: jobRows_().filter(j => j.artistId === member.id && j.how !== 'Text' && (!j.date || j.date >= today)).map(j => {
    const o = jobPublic_(j); delete o.artistId; o.calTime = ct[j.weddingId] || ''; return o;
  }) };
}

/** Artist: Yes or No on one of her own offers. */
function answerJob_(member, id, yes) {
  const j = jobRows_().find(x => x.id === String(id || '') && x.artistId === member.id);
  if (!j) return { ok: false, error: 'not_found' };
  jobsSheet_().getRange(j.row, 13, 1, 3).setValues([[yes ? 'Yes' : 'No', j.sentAt, new Date().toISOString()]]);
  pushOffice_(first_(j.artist) + ' said ' + (yes ? 'Yes' : 'No'), shortDate_(j.date) + ' · ' + first_(j.bride), 'jobs');
  if (yes) addToWedding_(j, member);
  mailJobAnswer_(j, yes);
  return myJobs_(member);
}

/* ---------- "Who we asked" on each bride's page (Alexandra and Dom, Nov 4 2026) ----------
   Offers sent from the Jobs tab land here by themselves. An ask made outside the app (a text or call) is logged by hand,
   with no email, alert or reminder to the artist, and the office marks her answer. */
function logAsk_(o) {
  o = o || {};
  const w = weddings_().find(x => x.d.id === o.weddingId);
  if (!w) return { ok: false, error: 'bad_request', message: 'Open a saved wedding first.' };
  const m = members_().find(x => x.id === String(o.memberId || ''));
  if (!m) return { ok: false, error: 'bad_request', message: 'Pick who you asked.' };
  const role = o.role === 'mu' ? 'Makeup' : o.role === 'both' ? 'Hair & makeup' : 'Hair';
  const status = o.status === 'Yes' || o.status === 'No' ? o.status : 'Waiting', now = new Date().toISOString();
  jobsSheet_().appendRow(['j' + code_(10).toLowerCase(), w.d.id, clean_(w.d.bride, 120), w.d.date || '',
    clean_([w.d.location, w.d.room].filter(Boolean).join(', '), 200), m.id, clean_(m.preferredName || m.legalName, 120), role,
    '', '', '', '', status, now, status === 'Waiting' ? '' : now, '', clean_(o.askedBy, 40), 'Text', '']);
  if (status === 'Yes') addToWedding_({ weddingId: w.d.id, role: role, artist: m.preferredName || m.legalName }, m);
  return jobs_();
}

/** Office: mark the answer she gave by text (Yes / No / Waiting), or take off an ask logged by mistake. */
function setAsk_(id, status) {
  const j = jobRows_().find(x => x.id === String(id || ''));
  if (!j) return { ok: false, error: 'not_found' };
  const sh = jobsSheet_();
  if (status === 'Remove') { if (j.how === 'Text') sh.deleteRow(j.row); return jobs_(); }
  if (['Yes', 'No', 'Waiting'].indexOf(status) < 0) return { ok: false, error: 'bad_request' };
  sh.getRange(j.row, 13, 1, 3).setValues([[status, j.sentAt, status === 'Waiting' ? '' : new Date().toISOString()]]);
  if (status === 'Yes') { const m = members_().find(x => x.id === j.artistId); if (m) addToWedding_(j, m); }
  return jobs_();
}

/** A Yes puts her on the wedding's Team on site (filling an empty Hair or Makeup slot first), so the office
 *  Calendar tab and her own My weddings show her without anyone retyping it. */
function addToWedding_(j, member) {
  const w = weddings_().find(x => x.d.id === j.weddingId);
  if (!w) return false;
  const d = w.d, list = d.artists = Array.isArray(d.artists) ? d.artists : [];
  const roles = j.role === 'Hair & makeup' ? ['hair', 'mu'] : [j.role === 'Makeup' ? 'mu' : 'hair'];
  let changed = false;
  roles.forEach(role => {
    if (list.some(a => a.uid === member.id && a.role === role)) return;
    let a = list.find(x => x.role === role && !x.uid && !String(x.name || '').trim());
    if (!a) { a = { id: Math.random().toString(36).slice(2, 10), role: role }; list.push(a); }
    a.uid = member.id;
    a.name = member.preferredName || member.legalName || j.artist;
    if (member.email) a.email = member.email;
    if (member.phone && !a.phone) a.phone = member.phone;
    changed = true;
  });
  if (!changed) return false;
  d.artistNames = list.map(a => String(a.name || '').trim()).filter(Boolean);
  saveWedding_(d);
  return true;
}

/** One-off, run from the editor: put every artist who already said Yes on her wedding. */
function addYesArtistsToWeddings() {
  const team = members_();
  let n = 0;
  jobRows_().filter(j => j.status === 'Yes').forEach(j => {
    const m = team.find(x => x.id === j.artistId);
    if (m && addToWedding_(j, m)) n++;
  });
  Logger.log('Added ' + n + ' artist(s) to weddings.');
}

/** Go-to artists pinned to the top of the Jobs list, in order. Kept in the script property JOB_TOP (member ids). */
const JOB_TOP_SEED = ['kateryna galiamova', 'alexis ramos', 'jessica george', 'ashley sees', 'rebekah ortiz', 'carolyn crescenzo',
                      'lauren soupik', 'stephanie chicchino', 'gabrielle grasso', 'eugene locastro', 'emily ogle'];
function jobTop_() {
  const props = PropertiesService.getScriptProperties(), raw = props.getProperty('JOB_TOP');
  if (raw) { try { return JSON.parse(raw); } catch (_) {} }
  const team = members_(), nm = m => String(m.legalName || m.preferredName || '').toLowerCase();
  const ids = JOB_TOP_SEED.map(f => (team.find(m => nm(m).indexOf(f) === 0) || {}).id).filter(Boolean);
  props.setProperty('JOB_TOP', JSON.stringify(ids));
  return ids;
}
function setJobTop_(ids) {
  const valid = new Set(members_().map(m => m.id));
  const clean = (Array.isArray(ids) ? ids : []).map(String).filter((id, i, a) => valid.has(id) && a.indexOf(id) === i);
  PropertiesService.getScriptProperties().setProperty('JOB_TOP', JSON.stringify(clean));
  return { ok: true, top: clean };
}
