/**
 * Taffeta Guest Requests & Consultations
 * Receives the Concierge and Consultation forms from the Taffeta guest pages,
 * adds a row to the right tab, saves photos to Drive, and alerts the front desk.
 * Also feeds the private Front Desk page (prettyteam.taffetadesign.com/desk/)
 * and the team app's time clock (see the Team Hub section at the bottom).
 */
const FRONT_DESK_EMAIL = 'salon@taffetadesign.com';
const NTFY_TOPIC = 'taffeta-desk-b503c2d35d24';      // phone alerts via the free ntfy app
const PHOTO_FOLDER_NAME = 'Consultation Photos';      // created next to this Sheet
const DESK_KEY = '__DESK_KEY__';                      // private key for the Front Desk page
const SHEET_ID = '1ewP3hHHh9yL1e11b_1EykFqhyebJqNxkkSnFqktasV0';   // Taffeta Guest Requests & Consultations
function ss_() { return SpreadsheetApp.openById(SHEET_ID); }

const TABS = {
  concierge: { name: 'Concierge Requests',
    headers: ['Received', 'Name', 'Sips', 'Comforts', 'Before you go', 'Anything else', 'Status', 'Handled at'],
    keys:    ['at', 'name', 'sips', 'comforts', 'before', 'note', 'status', 'handledAt'],
    statuses: ['New', 'On it', 'Done'] },
  consult: { name: 'Consultations',
    headers: ['Received', 'First name', 'Last name', 'Phone', 'Email', 'Hair', 'Skin & Spa', 'Their story',
              'Same budget every visit', 'Budget per visit', 'Reach by', 'Photo: today', 'Photo: inspiration',
              'Pricing understood', 'Status', 'Artist'],
    keys:    ['at', 'first', 'last', 'phone', 'email', 'hair', 'skin', 'story', 'sameBudget', 'budget', 'reach',
              'photoNow', 'photoGoal', 'agree', 'status', 'artist'],
    statuses: ['New', 'Contacted', 'Booked'] },
  profile: { name: 'Profile Updates',
    headers: ['Received', 'First name', 'Last name', 'Phone', 'Email', 'Home address', 'Birthday (month & day)',
              'Allergies or sensitivities', 'Good to know', 'What changed', 'Texts OK', 'Status', 'Updated by'],
    keys:    ['at', 'first', 'last', 'phone', 'email', 'address', 'birthday',
              'allergies', 'notes', 'changes', 'texts', 'status', 'by'],
    statuses: ['New', 'Updated'] }
};

/** Run once from the editor (▶ Run) to set up both tabs. */
function setup() {
  const ss = ss_();
  ss.setSpreadsheetTimeZone('America/New_York');
  const first = ss.getSheets()[0];
  if (first.getName() !== TABS.concierge.name && !ss.getSheetByName(TABS.concierge.name)) first.setName(TABS.concierge.name);
  Object.values(TABS).forEach(t => {
    const sh = tab_(t);
    sh.getRange(1, 1, 1, t.headers.length).setValues([t.headers]).setFontWeight('bold').setBackground('#423327').setFontColor('#f2f1ec');
    sh.setFrozenRows(1);
    sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat('ddd mmm d, h:mm am/pm');
    const h = t.keys.indexOf('handledAt');
    if (h >= 0) sh.getRange(2, h + 1, sh.getMaxRows() - 1, 1).setNumberFormat('h:mm am/pm');
  });
  const extra = ss.getSheetByName('Untitled');
  if (extra && ss.getSheets().length > 2 && extra.getLastRow() === 0) ss.deleteSheet(extra);
  photoFolder_();
}

/** The Front Desk page reads today's requests and recent consultations here. */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.staff) return staffGet_(p);
  if (p.admin) return adminGet_(p);
  if (p.decide) return decide_(p);
  if (p.key !== DESK_KEY) return json_({ ok: false, error: 'key' });
  return json_({ ok: true, now: Date.now(), concierge: rows_(TABS.concierge, 2), consult: rows_(TABS.consult, 60), profiles: rows_(TABS.profile, 60) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (['clock', 'timeoff', 'cover', 'take', 'profile', 'sign'].indexOf(d.type) >= 0) return teamPost_(d);
    if (d.website) return json_({ ok: true });                       // spam trap
    const now = new Date();
    if (d.type === 'status') return setStatus_(d);
    if (d.type === 'concierge') {
      const name = clean_(d.name, 80);
      tab_(TABS.concierge).appendRow([now, name, list_(d.sips), list_(d.comforts), list_(d.before), clean_(d.note, 500), 'New', '']);
      const items = [].concat(d.sips || [], d.comforts || [], d.before || []).join(', ') || '(see note)';
      const body = name + ' would love: ' + items + (d.note ? '\nNote: ' + clean_(d.note, 500) : '');
      alert_('Concierge: ' + name, body, 'bellhop_bell');
    } else if (d.type === 'consult') {
      const who = clean_(d.first, 60) + ' ' + clean_(d.last, 60);
      const p1 = savePhoto_(d.photoNow, who + ' – today');
      const p2 = savePhoto_(d.photoGoal, who + ' – inspiration');
      tab_(TABS.consult).appendRow([now, clean_(d.first, 60), clean_(d.last, 60), clean_(d.phone, 30), clean_(d.email, 120),
        list_(d.hair), list_(d.skin), clean_(d.story, 3000), d.sameBudget ? 'Yes' : '', clean_(d.budget, 20),
        clean_(d.reach, 10), p1, p2, d.agree ? 'Yes' : 'No', 'New', '']);
      alert_('New consultation: ' + who,
        who + ' · ' + [].concat(d.hair || [], d.skin || []).join(', ') + '\nReach by: ' + clean_(d.reach, 10) + ' · ' + clean_(d.phone, 30),
        'sparkles');
    } else if (d.type === 'guestprofile') {
      const who = clean_(d.first, 60) + ' ' + clean_(d.last, 60);
      tab_(TABS.profile).appendRow([now, clean_(d.first, 60), clean_(d.last, 60), clean_(d.phone, 30), clean_(d.email, 120),
        clean_(d.address, 200), clean_(d.birthday, 20), clean_(d.allergies, 500), clean_(d.notes, 1000),
        clean_(d.changes, 1000), d.texts ? 'Yes' : 'No', 'New', '']);
      alert_('Profile update: ' + who, who + ' sent new details. Update her file in Paired Plus.', 'memo');
    }
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}

/** A tap on the Front Desk page (On it / Done / Contacted / Booked). */
function setStatus_(d) {
  if (d.key !== DESK_KEY) return json_({ ok: false, error: 'key' });
  const t = TABS[d.tab];
  if (!t || t.statuses.indexOf(d.status) < 0) return json_({ ok: false });
  const sh = tab_(t), row = Number(d.row);
  if (!(row >= 2 && row <= sh.getLastRow())) return json_({ ok: false });
  const at = sh.getRange(row, 1).getValue();
  if (!(at instanceof Date) || Math.abs(at.getTime() - Number(d.at)) > 1500) return json_({ ok: false });   // rows were moved
  sh.getRange(row, t.keys.indexOf('status') + 1).setValue(d.status);
  if (d.tab === 'concierge') sh.getRange(row, t.keys.indexOf('handledAt') + 1).setValue(d.status === 'Done' ? new Date() : '');
  return json_({ ok: true });
}

function rows_(t, days) {
  const sh = tab_(t), n = sh.getLastRow();
  if (n < 2) return [];
  const vals = sh.getRange(2, 1, n - 1, t.headers.length).getValues();
  const cut = Date.now() - days * 864e5, out = [];
  vals.forEach((r, i) => {
    const at = r[0] instanceof Date ? r[0].getTime() : NaN;
    if (!(at >= cut)) return;
    const o = { row: i + 2 };
    t.keys.forEach((k, j) => { o[k] = r[j] instanceof Date ? r[j].getTime() : r[j]; });
    out.push(o);
  });
  return out.reverse().slice(0, 300);
}

function alert_(title, body, tag) {
  try { MailApp.sendEmail({ to: FRONT_DESK_EMAIL, subject: title, body: body + '\n\nSheet: ' + ss_().getUrl() }); } catch (err) {}
  // Phone alerts come from the email (Gmail app on the salon phone). Google's servers can't reach ntfy.sh.
}

function tab_(t) {
  const ss = ss_();
  let sh = ss.getSheetByName(t.name);
  if (!sh) sh = ss.insertSheet(t.name);
  if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() !== 'Received') {
    sh.getRange(1, 1, 1, t.headers.length).setValues([t.headers]).setFontWeight('bold').setBackground('#423327').setFontColor('#f2f1ec');
    sh.setFrozenRows(1);
    sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat('ddd mmm d, h:mm am/pm');
    const h = t.keys.indexOf('handledAt');
    if (h >= 0) sh.getRange(2, h + 1, sh.getMaxRows() - 1, 1).setNumberFormat('h:mm am/pm');
  }
  return sh;
}

function photoFolder_() {
  const parent = DriveApp.getFileById(ss_().getId()).getParents().next();
  const it = parent.getFoldersByName(PHOTO_FOLDER_NAME);
  return it.hasNext() ? it.next() : parent.createFolder(PHOTO_FOLDER_NAME);
}

function savePhoto_(dataUrl, name) {
  if (!dataUrl || String(dataUrl).indexOf('data:image/') !== 0) return '';
  const m = String(dataUrl).match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!m) return '';
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name + '.jpg');
  return photoFolder_().createFile(blob).getUrl();
}

function list_(v) { return Array.isArray(v) ? v.map(x => clean_(x, 60)).join(', ') : clean_(v, 200); }
function clean_(v, n) { v = String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim(); if (/^[=+\-@]/.test(v)) v = "'" + v; return v.slice(0, n); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }


/**
 * Taffeta Team Hub: time clock, shift coverage, time off and announcements
 * for the employee app at prettyteam.taffetadesign.com.
 * Everything is written to the "Taffeta Team Hub" Google Sheet.
 */
const TEAM_SHEET_ID = '__TEAM_SHEET_ID__';
const TEAM_SECRET = '__TEAM_SECRET__';      // signs each person's private app link (never shown to staff)
const ADMIN_KEY = '__ADMIN_KEY__';          // lets The Pretty Report read hours
const OWNER_EMAIL = 'info@taffetadesign.com';
const APPROVERS = [{ name: 'Rick', email: 'rick.gillespie12@gmail.com' }, { name: 'Carolyn', email: 'carolyncrescenzo@comcast.net' }];
const TZ = 'America/New_York';
const MAX_SHIFT_HOURS = 14;                 // an open punch older than this is flagged as a missed clock-out

const TT = {
  team:  { name: 'Team', headers: ['Name', 'App ID', 'Group', 'Clock in/out', 'Active'] },
  clock: { name: 'Time Clock', headers: ['Date', 'Name', 'App ID', 'Clock in', 'Clock out', 'Hours', 'Note'] },
  off:   { name: 'Time Off', headers: ['Requested', 'Name', 'App ID', 'First day', 'Last day', 'Note', 'Status', 'Decided by'] },
  cover: { name: 'Shift Coverage', headers: ['Posted', 'Name', 'App ID', 'Group', 'Shift date', 'Shift time', 'Note', 'Status', 'Covered by', 'Covered at'] },
  ann:   { name: 'Announcements', headers: ['Date', 'Message', 'From'] },
  shift: { name: 'Shifts', headers: ['Date', 'Name', 'App ID', 'Start', 'End'] },
  info:  { name: 'Team Info', headers: ['Name', 'App ID', 'Emergency contact name', 'Emergency contact phone', 'Relationship', 'Home address', 'Email', 'Venmo name', 'Instagram', 'Updated'] },
  sigs:  { name: 'Handbook Signatures', headers: ['Signed', 'Name', 'App ID', 'Typed signature', 'Document'] }
};


/** The team list the setup fills in. After that, edit the Team tab directly (Group: stylist, esthetician or associate). */
const ROSTER = [
  ['Alexandra', 'alexandra', 'stylist', 'No'], ['Adriana', 'adriana', 'associate', 'Yes'], ['Alyssa', 'alyssa', 'associate', 'Yes'],
  ['Amanda', 'amanda', 'associate', 'Yes'], ['Angelina H', 'angelina-h', 'esthetician', 'No'], ['Ashley B', 'ashley-b', 'associate', 'Yes'],
  ['Carolyn', 'carolyn', 'esthetician', 'Yes'], ['Dominique', 'dominique', 'stylist', 'No'], ['Emily B', 'emily-b', 'stylist', 'No'],
  ['Jen M', 'jen-m', 'stylist', 'No'], ['Jennifer C', 'jennifer-c', 'stylist', 'No'], ['Joanna', 'joanna', 'stylist', 'No'],
  ['Kat', 'kat', 'associate', 'Yes'], ['Kelly', 'kelly', 'esthetician', 'No'], ['Lexi', 'lexi', 'stylist', 'No'],
  ['Mia', 'mia', 'stylist', 'No'], ['Neva L', 'neva-l', 'stylist', 'No'], ['Rose', 'rose', 'associate', 'Yes'], ['Sara', 'sara', 'stylist', 'No']
];

function tss_() { return SpreadsheetApp.openById(TEAM_SHEET_ID); }
function ttab_(t) {
  const ss = tss_();
  let sh = ss.getSheetByName(t.name);
  if (!sh) sh = ss.insertSheet(t.name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, t.headers.length).setValues([t.headers]).setFontWeight('bold').setBackground('#121212').setFontColor('#f8f6f0');
    sh.setFrozenRows(1);
  }
  return sh;
}
function tvals_(t) {
  const sh = ttab_(t), n = sh.getLastRow();
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, t.headers.length).getValues();
}

/** Run once from the editor: creates the Team Hub tabs and fills in the team list. */
function setupTeam() {
  const ss = tss_();
  ss.setSpreadsheetTimeZone(TZ);
  Object.values(TT).forEach(ttab_);
  const first = ss.getSheets()[0];
  if (first.getName() !== TT.team.name && first.getLastRow() <= 1 && ss.getSheets().length > Object.keys(TT).length) ss.deleteSheet(first);
  const team = ttab_(TT.team);
  if (team.getLastRow() < 2) team.getRange(2, 1, ROSTER.length, 5).setValues(ROSTER.map(r => r.concat(['Yes'])));
  const c = ttab_(TT.clock);
  c.getRange('A2:A').setNumberFormat('ddd mmm d');
  c.getRange('D2:E').setNumberFormat('h:mm am/pm');
  c.getRange('F2:F').setNumberFormat('0.00');
}

function sign_(slug) {
  const raw = Utilities.computeHmacSha256Signature(String(slug), TEAM_SECRET);
  return Utilities.base64EncodeWebSafe(raw).replace(/=+$/, '').slice(0, 22);
}
function member_(slug, t) {
  if (!slug || !t || t !== sign_(slug)) return null;
  const r = tvals_(TT.team).find(r => String(r[1]) === String(slug) && String(r[4]).toLowerCase() !== 'no');
  return r ? { name: String(r[0]), slug: String(r[1]), group: String(r[2]), clock: String(r[3]).toLowerCase() === 'yes' } : null;
}

const day_ = d => Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
const hhmm_ = d => Utilities.formatDate(d, TZ, 'h:mm a');
function weekStart_(d) {                 // Monday 12:00 AM, salon time
  const ymd = day_(d).split('-').map(Number);
  const local = new Date(ymd[0], ymd[1] - 1, ymd[2]);
  const back = (local.getDay() + 6) % 7;
  return day_(new Date(local.getTime() - back * 864e5));
}

/** Everything one person's Home / Time off screens need. */
function staffGet_(p) {
  const me = member_(p.staff, p.t);
  if (!me) return json_({ ok: false, error: 'link' });
  const now = new Date(), today = day_(now), wk = weekStart_(now);
  let open = null, todayMin = 0, weekMin = 0;
  tvals_(TT.clock).forEach(r => {
    if (String(r[2]) !== me.slug || !(r[3] instanceof Date)) return;
    const end = r[4] instanceof Date ? r[4] : null;
    if (!end) { if ((now - r[3]) / 36e5 < MAX_SHIFT_HOURS) open = r[3]; return; }
    const m = (end - r[3]) / 6e4, d = day_(r[3]);
    if (d === today) todayMin += m;
    if (d >= wk) weekMin += m;
  });
  if (open) { const m = (now - open) / 6e4; todayMin += m; weekMin += m; }
  const shifts = tvals_(TT.shift).filter(r => String(r[2]) === me.slug && r[0] instanceof Date && day_(r[0]) >= today)
    .sort((a, b) => a[0] - b[0]).slice(0, 5).map(r => ({ date: day_(r[0]), start: String(r[3]), end: String(r[4]) }));
  const ann = tvals_(TT.ann).filter(r => r[1]).slice(-5).reverse()
    .map(r => ({ date: r[0] instanceof Date ? day_(r[0]) : '', text: String(r[1]), from: String(r[2] || 'Alexandra') }));
  const cov = tvals_(TT.cover).map((r, i) => ({ row: i + 2, name: String(r[1]), slug: String(r[2]), group: String(r[3]),
    date: String(r[4] instanceof Date ? day_(r[4]) : r[4]), time: String(r[5]), note: String(r[6]), status: String(r[7]), by: String(r[8]) }))
    .filter(c => c.date >= today);
  const openShifts = cov.filter(c => c.status === 'Open' && c.slug !== me.slug && c.group === me.group);
  const myCover = cov.filter(c => c.slug === me.slug || c.by === me.name).slice(-6);
  const myOff = tvals_(TT.off).filter(r => String(r[2]) === me.slug).slice(-6).reverse()
    .map(r => ({ from: r[3] instanceof Date ? day_(r[3]) : String(r[3]), to: r[4] instanceof Date ? day_(r[4]) : String(r[4]), status: String(r[6] || 'Waiting') }));
  return json_({ ok: true, now: now.getTime(), me: { name: me.name, group: me.group, clock: me.clock },
    clock: { in: !!open, since: open ? open.getTime() : null, sinceLabel: open ? hhmm_(open) : null, todayMin: Math.round(todayMin), weekMin: Math.round(weekMin) },
    shifts, ann, openShifts, myCover, myOff, info: myInfo_(me.slug), signed: mySigs_(me.slug) });
}

/** Private: only the person's own row is ever returned. */
function myInfo_(slug) {
  const r = tvals_(TT.info).find(r => String(r[1]) === slug);
  return r ? { ecName: String(r[2]), ecPhone: String(r[3]), ecRel: String(r[4]), address: String(r[5]), email: String(r[6]), venmo: String(r[7]), instagram: String(r[8]) } : null;
}
function mySigs_(slug) {
  const o = {};
  tvals_(TT.sigs).forEach(r => { if (String(r[2]) === slug) o[String(r[4])] = { name: String(r[3]), at: r[0] instanceof Date ? day_(r[0]) : String(r[0]) }; });
  return o;
}

function teamPost_(d) {
  const me = member_(d.slug, d.t);
  if (!me) return json_({ ok: false, error: 'link' });
  const now = new Date();
  if (d.type === 'clock') {
    if (!me.clock) return json_({ ok: false, error: 'noclock' });
    const sh = ttab_(TT.clock), vals = tvals_(TT.clock);
    let openRow = -1;
    vals.forEach((r, i) => { if (String(r[2]) === me.slug && r[3] instanceof Date && !(r[4] instanceof Date) && (now - r[3]) / 36e5 < MAX_SHIFT_HOURS) openRow = i + 2; });
    if (d.action === 'in') {
      if (openRow > 0) return json_({ ok: true, already: true });
      sh.appendRow([now, me.name, me.slug, now, '', '', '']);
    } else {
      if (openRow < 0) return json_({ ok: false, error: 'notin' });
      const start = sh.getRange(openRow, 4).getValue();
      sh.getRange(openRow, 5, 1, 2).setValues([[now, Math.round((now - start) / 36e3) / 100]]);
    }
    return json_({ ok: true });
  }
  if (d.type === 'timeoff') {
    const from = clean_(d.from, 10), to = clean_(d.to || d.from, 10), note = clean_(d.note, 300);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return json_({ ok: false, error: 'date' });
    const sh = ttab_(TT.off);
    sh.appendRow([now, me.name, me.slug, from, to, note, 'Waiting', '']);
    const row = sh.getLastRow(), url = ScriptApp.getService().getUrl();
    const link = (status, who) => url + '?decide=' + row + '&s=' + status + '&by=' + encodeURIComponent(who) + '&k=' + sign_('off:' + row + ':' + status + ':' + who);
    APPROVERS.forEach(a => mail_(a.email, 'Time off request: ' + me.name,
      me.name + ' would like ' + (from === to ? from : from + ' to ' + to) + ' off.' + (note ? '\nNote: ' + note : '') +
      '\n\nApprove: ' + link('Approved', a.name) + '\n\nDecline: ' + link('Declined', a.name) +
      '\n\n' + me.name + ' sees the answer in her app right away.'));
    return json_({ ok: true });
  }
  if (d.type === 'cover') {
    const date = clean_(d.date, 10), time = clean_(d.time, 40), note = clean_(d.note, 300), by = clean_(d.by, 60);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json_({ ok: false, error: 'date' });
    if (by) {
      ttab_(TT.cover).appendRow([now, me.name, me.slug, me.group, date, time, note, 'Covered', by, now]);
      mail_(OWNER_EMAIL, 'Shift covered: ' + me.name + ' → ' + by, by + ' is covering ' + me.name + "'s shift on " + date + (time ? ' (' + time + ')' : '') + '.' + (note ? '\nNote: ' + note : ''));
    } else {
      ttab_(TT.cover).appendRow([now, me.name, me.slug, me.group, date, time, note, 'Open', '', '']);
    }
    return json_({ ok: true });
  }
  if (d.type === 'take') {
    const sh = ttab_(TT.cover), row = Number(d.row);
    if (!(row >= 2 && row <= sh.getLastRow())) return json_({ ok: false });
    const r = sh.getRange(row, 1, 1, 10).getValues()[0];
    if (r[7] !== 'Open') return json_({ ok: false, error: 'taken' });
    if (String(r[3]) !== me.group || String(r[2]) === me.slug) return json_({ ok: false });
    sh.getRange(row, 8, 1, 3).setValues([['Covered', me.name, now]]);
    const date = r[4] instanceof Date ? day_(r[4]) : String(r[4]);
    mail_(OWNER_EMAIL, 'Shift covered: ' + r[1] + ' → ' + me.name, me.name + ' picked up ' + r[1] + "'s shift on " + date + (r[5] ? ' (' + r[5] + ')' : '') + '.');
    return json_({ ok: true });
  }
  if (d.type === 'profile') {
    const row = [me.name, me.slug, clean_(d.ecName, 80), clean_(d.ecPhone, 30), clean_(d.ecRel, 40), clean_(d.address, 200), clean_(d.email, 120), clean_(d.venmo, 60), clean_(d.instagram, 60), now];
    const sh = ttab_(TT.info), i = tvals_(TT.info).findIndex(r => String(r[1]) === me.slug);
    if (i >= 0) sh.getRange(i + 2, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    sh.getRange('J2:J').setNumberFormat('ddd mmm d, h:mm am/pm');
    return json_({ ok: true });
  }
  if (d.type === 'sign') {
    const doc = clean_(d.doc, 80), typed = clean_(d.name, 80);
    if (!doc || typed.length < 3) return json_({ ok: false, error: 'name' });
    if (mySigs_(me.slug)[doc]) return json_({ ok: true, already: true });
    ttab_(TT.sigs).appendRow([now, me.name, me.slug, typed, doc]);
    mail_(OWNER_EMAIL, 'Handbook signed: ' + me.name, me.name + ' signed "' + doc + '" as "' + typed + '" on ' + day_(now) + '.');
    return json_({ ok: true });
  }
  return json_({ ok: false });
}

/** The Pretty Report's Payroll tab: hours per person per day for one Monday–Sunday week. */
function adminGet_(p) {
  if (p.admin !== ADMIN_KEY) return json_({ ok: false, error: 'key' });
  const now = new Date();
  const wk = /^\d{4}-\d{2}-\d{2}$/.test(p.week || '') ? p.week : weekStart_(now);
  const ymd = wk.split('-').map(Number), endDay = day_(new Date(new Date(ymd[0], ymd[1] - 1, ymd[2]).getTime() + 6 * 864e5));
  const people = {};
  tvals_(TT.team).filter(r => String(r[3]).toLowerCase() === 'yes').forEach(r => { people[String(r[1])] = { name: String(r[0]), days: {}, min: 0, flags: [] }; });
  tvals_(TT.clock).forEach(r => {
    if (!(r[3] instanceof Date)) return;
    const d = day_(r[3]); if (d < wk || d > endDay) return;
    const who = people[String(r[2])] || (people[String(r[2])] = { name: String(r[1]), days: {}, min: 0, flags: [] });
    if (!(r[4] instanceof Date)) { if ((now - r[3]) / 36e5 >= MAX_SHIFT_HOURS) who.flags.push('Missed clock-out ' + d); else who.flags.push('On the clock now'); return; }
    const m = (r[4] - r[3]) / 6e4;
    who.days[d] = (who.days[d] || 0) + m; who.min += m;
  });
  Object.values(people).forEach(x => { x.min = Math.round(x.min); Object.keys(x.days).forEach(k => x.days[k] = Math.round(x.days[k])); });
  const cover = tvals_(TT.cover).filter(r => { const d = r[4] instanceof Date ? day_(r[4]) : String(r[4]); return d >= wk && d <= endDay; })
    .map(r => ({ name: String(r[1]), date: r[4] instanceof Date ? day_(r[4]) : String(r[4]), time: String(r[5]), status: String(r[7]), by: String(r[8]) }));
  const pendingOff = tvals_(TT.off).filter(r => !r[6] || r[6] === 'Waiting').map(r => ({ name: String(r[1]),
    from: r[3] instanceof Date ? day_(r[3]) : String(r[3]), to: r[4] instanceof Date ? day_(r[4]) : String(r[4]) }));
  return json_({ ok: true, week: wk, weekEnd: endDay, people: Object.values(people), cover, pendingOff, sheet: tss_().getUrl() });
}

/** One tap from the approval email: Approve or Decline a time-off request. */
function decide_(p) {
  const row = Number(p.decide), status = p.s, who = String(p.by || '');
  const page = msg => HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<div style="font-family:Georgia,serif;max-width:420px;margin:60px auto;padding:0 20px;text-align:center;color:#121212">' +
    '<p style="letter-spacing:.16em;font-size:12px;text-transform:uppercase;color:#5f5b55">Taffeta time off</p><h2 style="font-weight:400">' + msg + '</h2></div>').setTitle('Taffeta time off');
  if (['Approved', 'Declined'].indexOf(status) < 0 || p.k !== sign_('off:' + row + ':' + status + ':' + who)) return page('This link isn’t valid.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = ttab_(TT.off);
    if (!(row >= 2 && row <= sh.getLastRow())) return page('That request wasn’t found.');
    const r = sh.getRange(row, 1, 1, 8).getValues()[0];
    if (r[6] && r[6] !== 'Waiting') return page('Already ' + String(r[6]).toLowerCase() + ' by ' + (r[7] || 'someone') + '.');
    sh.getRange(row, 7, 1, 2).setValues([[status, who]]);
    mail_(APPROVERS.filter(a => a.name !== who).map(a => a.email).concat([OWNER_EMAIL]).join(','), 'Time off ' + status.toLowerCase() + ': ' + r[1],
      who + ' ' + status.toLowerCase() + ' ' + r[1] + "'s time off request.");
    return page(status + '. ' + firstName_(r[1]) + ' will see it in her app.');
  } finally { lock.releaseLock(); }
}
const firstName_ = n => String(n || '').split(' ')[0];

function mail_(to, subject, body) { try { MailApp.sendEmail({ to: to, subject: subject, body: body }); } catch (err) {} }
