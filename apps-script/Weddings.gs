/**
 * Taffeta Weddings Team App
 * The back office for prettyteam.taffetadesign.com/weddings/. No Claude account needed:
 *   - The office signs in with the office code (Read me tab, made by setup()).
 *   - Each artist opens her own private link (made in Team records).
 * Everything is saved in this Google Sheet, and calendar invites are sent
 * from the calendar of the Google account that deploys this script.
 *
 * One-time setup (from the Sheet: Extensions > Apps Script):
 *   1. Paste this file in place of the starter code and save.
 *   2. Pick "setup" in the toolbar and press Run. Allow access when Google asks.
 *   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *   4. Copy the Web app URL and send it to Claude in the project thread.
 * After changing this code later: Deploy > Manage deployments > Edit > New version.
 */
const TZ = 'America/New_York';
const SALON = 'Taffeta Salon & Spa, 219 Bellevue Ave, Hammonton, NJ 08037';

const TABS = {
  weddings: { name: 'Weddings', headers: ['Id', 'Wedding date', 'Bride', 'Artists', 'Updated', 'Data (do not edit)'] },
  team: { name: 'Team',
    headers: ['Id', 'Link key', 'Active', 'Name', 'Legal name', 'Cell', 'Email', 'Address', 'City', 'State', 'ZIP', 'Does',
              'Specialties', 'Instagram', 'Travel area', 'Availability', 'Square direct deposit', 'Emergency contact',
              'Emergency phone', 'Notes', 'Updated', 'Added'],
    keys: ['id', 'secret', 'active', 'preferredName', 'legalName', 'phone', 'email', 'address', 'city', 'state', 'zip', 'role',
           'skills', 'instagram', 'area', 'availability', 'square', 'emergencyName', 'emergencyPhone', 'notes', 'updatedAt', 'addedAt'] },
  payouts: { name: 'Payout requests', headers: ['Sent', 'Artist', 'Bride', 'Event date', 'Event type', 'Total'] }
};
const PROFILE_KEYS = TABS.team.keys.slice(3, 20);

/** Run once from the editor (▶ Run). Makes the tabs and the office code. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SHEET_ID', ss.getId());
  if (!props.getProperty('OFFICE_CODE')) props.setProperty('OFFICE_CODE', code_(8));
  ss.setSpreadsheetTimeZone(TZ);
  Object.values(TABS).forEach(t => {
    const sh = ss.getSheetByName(t.name) || ss.insertSheet(t.name);
    sh.getRange(1, 1, 1, t.headers.length).setValues([t.headers]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  const team = ss.getSheetByName(TABS.team.name);
  team.getRange('A:Z').setNumberFormat('@');        // keep ZIP codes and phone numbers as typed
  team.hideColumns(2);
  ss.getSheetByName(TABS.payouts.name).getRange('B:F').setNumberFormat('@');
  ss.getSheetByName(TABS.weddings.name).getRange('A:B').setNumberFormat('@');
  const readme = ss.getSheetByName('Read me') || ss.insertSheet('Read me', 0);
  readme.clear();
  readme.getRange(1, 1, 6, 1).setValues([
    ['Taffeta Weddings Team App'],
    ['Open the app: https://prettyteam.taffetadesign.com/weddings/'],
    ['Office code (for Alexandra and the bridal coordinator only): ' + props.getProperty('OFFICE_CODE')],
    ['Artists never need the office code. Each one gets her own private link from Team records in the app.'],
    ['To change the office code, run newOfficeCode from Extensions > Apps Script.'],
    ['Please leave the other tabs alone; the app keeps them up to date.']
  ]);
  readme.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  const extra = ss.getSheetByName('Sheet1');
  if (extra && extra.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(extra);
  CalendarApp.getDefaultCalendar();   // asks for calendar access now, not on the first invite
}

/** Run from the editor if the office code ever needs to change. */
function newOfficeCode() {
  PropertiesService.getScriptProperties().setProperty('OFFICE_CODE', code_(8));
  setup();
}

function doGet() { return json_({ ok: true, app: 'taffeta-weddings' }); }

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  const who = who_(d);
  if (!who) return json_({ ok: false, error: 'signin' });
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const office = who.role === 'office';
    switch (d.action) {
      case 'load': return json_(Object.assign({ ok: true }, load_(who)));
      case 'saveProfile': return json_(saveProfile_(office ? d.memberId : who.member.id, d.profile));
      case 'logPayout': return json_(logPayout_(who, d.request));
    }
    if (!office) return json_({ ok: false, error: 'office_only' });
    switch (d.action) {
      case 'saveWedding': return json_(saveWedding_(d.wedding));
      case 'deleteWedding': return json_(deleteWedding_(d.id));
      case 'addMember': return json_(addMember_(d.profile));
      case 'newLink': return json_(newLink_(d.memberId));
      case 'setActive': return json_(setActive_(d.memberId, !!d.active));
      case 'sendInvites': return json_(sendInvites_(d.weddingId, d.events || []));
      case 'checkInvites': return json_(checkInvites_(d.weddingId));
    }
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json_({ ok: false, error: 'server', message: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ---------- who is asking ---------- */
function who_(d) {
  const props = PropertiesService.getScriptProperties();
  if (d.code) return safeEq_(String(d.code).trim().toUpperCase(), props.getProperty('OFFICE_CODE')) ? { role: 'office' } : null;
  if (d.member && d.secret) {
    const m = members_().find(x => x.id === d.member);
    if (m && m.active !== 'No' && safeEq_(String(d.secret), m.secret)) return { role: 'artist', member: m };
  }
  return null;
}

/* ---------- reads ---------- */
function load_(who) {
  const weddings = weddings_();
  if (who.role === 'office') {
    return { role: 'office', weddings: weddings.map(w => w.d), team: members_().map(m => Object.assign({}, m)) };
  }
  const m = who.member, email = String(m.email || '').toLowerCase();
  const mine = weddings.map(w => w.d).filter(w => (w.artists || []).some(a =>
    a.uid === m.id || (email && String(a.email || '').toLowerCase() === email)));
  mine.forEach(w => { delete w.cal; });
  const me = Object.assign({}, m); delete me.secret;
  const payouts = rowsOf_(TABS.payouts.name).filter(r => r[1] === m.id)
    .map(r => ({ sentAt: iso_(r[0]), bride: r[2], date: r[3], type: r[4], total: r[5] }));
  return { role: 'artist', me: me, weddings: mine, payouts: payouts };
}

function weddings_() {
  return rowsOf_(TABS.weddings.name).map((r, i) => {
    let d = {};
    try { d = JSON.parse(r[5] || '{}'); } catch (_) {}
    d.id = r[0];
    return { row: i + 2, d: d };
  }).filter(w => w.d.id);
}

function members_() {
  const keys = TABS.team.keys;
  return rowsOf_(TABS.team.name).map((r, i) => {
    const m = { _row: i + 2 };
    keys.forEach((k, j) => { m[k] = r[j] instanceof Date ? iso_(r[j]) : String(r[j] == null ? '' : r[j]); });
    m.skills = m.skills ? m.skills.split(/,\s*/) : [];
    return m;
  }).filter(m => m.id);
}

/* ---------- weddings ---------- */
function saveWedding_(w) {
  if (!w || typeof w !== 'object') return { ok: false, error: 'bad_request' };
  const sh = sheet_(TABS.weddings.name);
  const list = weddings_();
  const found = w.id && list.find(x => x.d.id === w.id);
  const id = found ? w.id : (w.id || 'w' + code_(10).toLowerCase());
  w.id = id;
  if (found && found.d.cal && !w.cal) w.cal = found.d.cal;     // invites are tracked on the server
  w.updatedAt = new Date().toISOString();
  const row = [id, w.date || '', clean_(w.bride, 120), clean_((w.artistNames || []).join(', '), 300), new Date(), JSON.stringify(w)];
  if (found) sh.getRange(found.row, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  return { ok: true, id: id, updatedAt: w.updatedAt, cal: w.cal || null };
}

function deleteWedding_(id) {
  const w = weddings_().find(x => x.d.id === id);
  if (!w) return { ok: true };
  Object.values(w.d.cal || {}).forEach(v => { try { const ev = cal_().getEventById(v.eventId); if (ev) ev.deleteEvent(); } catch (_) {} });
  sheet_(TABS.weddings.name).deleteRow(w.row);
  return { ok: true };
}

/* ---------- team ---------- */
function addMember_(p) {
  p = p || {};
  if (!clean_(p.preferredName, 80) && !clean_(p.legalName, 80)) return { ok: false, error: 'name' };
  const m = { id: 'm' + code_(8).toLowerCase(), secret: code_(24), active: 'Yes', addedAt: new Date().toISOString() };
  PROFILE_KEYS.forEach(k => { m[k] = k === 'skills' ? list_(p.skills) : clean_(p[k], 300); });
  m.updatedAt = '';
  sheet_(TABS.team.name).appendRow(TABS.team.keys.map(k => m[k]));
  return { ok: true, member: m };
}

function saveProfile_(id, p) {
  const m = members_().find(x => x.id === id);
  if (!m || !p) return { ok: false, error: 'not_found' };
  PROFILE_KEYS.forEach(k => { if (k in p) m[k] = k === 'skills' ? list_(p[k]) : clean_(p[k], 500); });
  if (Array.isArray(m.skills)) m.skills = m.skills.join(', ');
  m.updatedAt = new Date().toISOString();
  sheet_(TABS.team.name).getRange(m._row, 1, 1, TABS.team.keys.length).setValues([TABS.team.keys.map(k => m[k])]);
  return { ok: true, updatedAt: m.updatedAt };
}

function newLink_(id) {
  const m = members_().find(x => x.id === id);
  if (!m) return { ok: false, error: 'not_found' };
  const secret = code_(24);
  sheet_(TABS.team.name).getRange(m._row, 2).setValue(secret);
  return { ok: true, secret: secret };
}

function setActive_(id, on) {
  const m = members_().find(x => x.id === id);
  if (!m) return { ok: false, error: 'not_found' };
  sheet_(TABS.team.name).getRange(m._row, 3).setValue(on ? 'Yes' : 'No');
  return { ok: true };
}

/* ---------- payouts (the Google Form is still the real request) ---------- */
function logPayout_(who, r) {
  if (who.role !== 'artist' || !r) return { ok: true };
  sheet_(TABS.payouts.name).appendRow([new Date(), who.member.id, clean_(r.bride, 120), clean_(r.date, 20), clean_(r.type, 60), clean_(r.total, 20)]);
  return { ok: true };
}

/* ---------- calendar invites ---------- */
function cal_() { return CalendarApp.getDefaultCalendar(); }

/** events: [{key, email, summary, date:'yyyy-MM-dd', startMin, endMin, location, description, reminders:[minutes]}] */
function sendInvites_(weddingId, events) {
  const w = weddings_().find(x => x.d.id === weddingId);
  if (!w) return { ok: false, error: 'not_found' };
  const cal = w.d.cal || {};
  const keep = {};
  let sent = 0;
  events.forEach(e => {
    const email = String(e.email || '').trim();
    if (!e.key || !email || !e.date) return;
    keep[e.key] = true;
    const start = when_(e.date, e.startMin), end = when_(e.date, Math.max(e.endMin, e.startMin + 15));
    const cur = cal[e.key];
    let ev = null;
    if (cur && cur.eventId) { try { ev = cal_().getEventById(cur.eventId); } catch (_) { ev = null; } }
    if (ev && cur.email.toLowerCase() !== email.toLowerCase()) { try { ev.deleteEvent(); } catch (_) {} ev = null; }
    if (ev) {
      ev.setTitle(e.summary); ev.setTime(start, end); ev.setLocation(e.location || ''); ev.setDescription(e.description || '');
    } else {
      ev = cal_().createEvent(e.summary, start, end,
        { location: e.location || '', description: e.description || '', guests: email, sendInvites: true });
      cal[e.key] = { eventId: ev.getId(), email: email, status: 'needsAction' };
    }
    try {
      ev.setGuestsCanSeeGuests(false); ev.setGuestsCanInviteOthers(false); ev.setGuestsCanModify(false);
      ev.setVisibility(CalendarApp.Visibility.PRIVATE);
      ev.removeAllReminders();
      (e.reminders || []).forEach(min => ev.addPopupReminder(min));
    } catch (_) {}
    sent++;
  });
  Object.keys(cal).forEach(k => {
    if (keep[k]) return;
    try { const ev = cal_().getEventById(cal[k].eventId); if (ev) ev.deleteEvent(); } catch (_) {}
    delete cal[k];
  });
  w.d.cal = cal;
  writeWedding_(w);
  return { ok: true, sent: sent, cal: cal };
}

function checkInvites_(weddingId) {
  const w = weddings_().find(x => x.d.id === weddingId);
  if (!w) return { ok: false, error: 'not_found' };
  const cal = w.d.cal || {};
  const map = { YES: 'accepted', NO: 'declined', MAYBE: 'tentative', INVITED: 'needsAction', OWNER: 'accepted' };
  Object.keys(cal).forEach(k => {
    try {
      const ev = cal_().getEventById(cal[k].eventId);
      const g = ev && ev.getGuestByEmail(cal[k].email);
      if (g) cal[k].status = map[String(g.getGuestStatus())] || cal[k].status;
    } catch (_) {}
  });
  w.d.cal = cal;
  writeWedding_(w);
  return { ok: true, cal: cal };
}

function writeWedding_(w) {
  sheet_(TABS.weddings.name).getRange(w.row, 6).setValue(JSON.stringify(w.d));
}

/* ---------- helpers ---------- */
function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function sheet_(name) { return ss_().getSheetByName(name); }
function rowsOf_(name) {
  const sh = sheet_(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}
function when_(date, min) {
  const h = Math.floor(min / 60), m = min % 60;
  return Utilities.parseDate(date + ' ' + ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2), TZ, 'yyyy-MM-dd HH:mm');
}
function iso_(v) { return v instanceof Date ? v.toISOString() : String(v || ''); }
function code_(n) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Math.random() + Date.now());
  let out = '';
  for (let i = 0; i < n; i++) out += abc[(bytes[i % bytes.length] + 256 + i * 7) % abc.length];
  return out;
}
function safeEq_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function list_(v) { return (Array.isArray(v) ? v : String(v || '').split(/,\s*/)).map(x => clean_(x, 60)).filter(Boolean).join(', '); }
function clean_(v, n) { v = String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim(); if (/^[=+\-@]/.test(v)) v = "'" + v; return v.slice(0, n); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
