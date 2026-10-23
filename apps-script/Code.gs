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
              'Allergies or sensitivities', 'Good to know', 'What changed', 'Texts OK', 'Status', 'Updated by', 'Updated at'],
    keys:    ['at', 'first', 'last', 'phone', 'email', 'address', 'birthday',
              'allergies', 'notes', 'changes', 'texts', 'status', 'by', 'updatedAt'],
    statuses: ['New', 'Updated'] },
  todo: { name: 'To Do',
    headers: ['Received', 'Task', 'Guest', 'Detail', 'List', 'Status', 'Done at', 'Address'],
    keys:    ['at', 'task', 'guest', 'detail', 'group', 'status', 'doneAt', 'address'],
    statuses: ['Open', 'Done'] },
  regimen: { name: 'Home Care PDFs',
    headers: ['Received', 'Artist', 'Guest', 'Kind', 'Products', 'Regimen (app data)', 'Status', 'Sent at'],
    keys:    ['at', 'artist', 'guest', 'kind', 'summary', 'data', 'status', 'sentAt'],
    statuses: ['New', 'Sent'] }
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
  if (p.rxall) return json_({ ok: true, rxall: rxDeskList_(0) });          // every saved RX card, for the desk's filing
  if (p.rgall) return json_({ ok: true, rgall: rows_(TABS.regimen, 3650).reverse().slice(0, 1500) });   // every saved home care card, searchable (Oct 20 2026)
  if (p.rxcard) return json_(rxDeskCard_(p.rxcard));
  return json_({ ok: true, now: Date.now(), concierge: rows_(TABS.concierge, 2), consult: rows_(TABS.consult, 60), profiles: rows_(TABS.profile, 60), todo: todoRows_(), regimen: rows_(TABS.regimen, 14), rx: rxDeskList_(21), seen: deskSeen_() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (['clock', 'timeoff', 'cover', 'take', 'profile', 'sign', 'stock', 'model', 'mphoto', 'regimen', 'rgmine'].indexOf(d.type) >= 0) return teamPost_(d);
    if (['rxpin', 'rxlogin', 'rxsync'].indexOf(d.type) >= 0) return rxPost_(d);
    if (d.type === 'rxdesk') return rxDeskSet_(d);
    if (d.type === 'deskseen') return deskSeenSet_(d);
    if (d.type === 'rxopen') return rxOpened_(d);
    if (d.website) return json_({ ok: true });                       // spam trap
    const now = new Date();
    if (d.type === 'status') return setStatus_(d);
    if (d.type === 'push') return deskSavePush_(d);
    if (d.type === 'todoAddr') return todoAddr_(d);
    if (d.type === 'concierge') {
      const name = clean_(d.name, 80);
      tab_(TABS.concierge).appendRow([now, name, list_(d.sips), list_(d.comforts), list_(d.before), clean_(d.note, 500), 'New', '']);
      const items = [].concat(d.sips || [], d.comforts || [], d.before || []).join(', ') || '(see note)';
      const body = name + ' would love: ' + items + (d.note ? '\nNote: ' + clean_(d.note, 500) : '');
      alert_('Concierge: ' + name, body, 'bellhop_bell');
      deskPush_('New request', deskFirst_(name) + ' · ' + items.slice(0, 100));
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
      deskPush_('New consultation', deskFirst_(d.first) + ' · ' + [].concat(d.hair || [], d.skin || []).join(', ').slice(0, 100));
    } else if (d.type === 'guestprofile') {
      const who = clean_(d.first, 60) + ' ' + clean_(d.last, 60);
      const psh = tab_(TABS.profile);
      const bd = clean_(d.birthday, 20);
      psh.appendRow([now, clean_(d.first, 60), clean_(d.last, 60), clean_(d.phone, 30), clean_(d.email, 120),
        clean_(d.address, 200), bd, clean_(d.allergies, 500), clean_(d.notes, 1000),
        clean_(d.changes, 1000), d.texts ? 'Yes' : 'No', 'New', '']);
      // appendRow turns "March 5" into a date, so rewrite the birthday as plain text in the row it just added
      psh.getRange(psh.getLastRow(), 7).setNumberFormat('@').setValue(bd);
      alert_('Profile update: ' + who, who + ' sent new details. Update her file in Paired Plus.', 'memo');
      deskPush_('Profile update', deskFirst_(d.first) + ' sent new details for Paired Plus.');
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
  if (d.tab === 'todo') sh.getRange(row, t.keys.indexOf('doneAt') + 1).setValue(d.status === 'Done' ? new Date() : '');
  if (d.tab === 'regimen') sh.getRange(row, t.keys.indexOf('sentAt') + 1).setValue(d.status === 'Sent' ? new Date() : '');
  if (d.tab === 'profile') {   // the Front Desk page hides Updated profiles 2 days after this time
    const c = t.keys.indexOf('updatedAt') + 1;
    if (sh.getRange(1, c).getValue() !== 'Updated at') sh.getRange(1, c).setValue('Updated at').setFontWeight('bold');
    sh.getRange(row, c).setValue(d.status === 'Updated' ? new Date() : '');
  }
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

/** Front desk typed a mailing address on a thank-you card to-do: save it, mark the task done.
    Adriana's Thank-you cards tab picks it up (cardAddr_). */
function todoAddr_(d) {
  if (d.key !== DESK_KEY) return json_({ ok: false, error: 'key' });
  const t = TABS.todo, sh = tab_(t), row = Number(d.row), addr = clean_(d.address, 300);
  if (!addr || !(row >= 2 && row <= sh.getLastRow())) return json_({ ok: false });
  const at = sh.getRange(row, 1).getValue();
  if (!(at instanceof Date) || Math.abs(at.getTime() - Number(d.at)) > 1500) return json_({ ok: false });
  const col = k => t.keys.indexOf(k) + 1;
  if (sh.getRange(1, col('address')).getValue() !== 'Address') sh.getRange(1, col('address')).setValue('Address').setFontWeight('bold');
  sh.getRange(row, col('address')).setValue(addr);
  sh.getRange(row, col('status')).setValue('Done');
  sh.getRange(row, col('doneAt')).setValue(new Date());
  return json_({ ok: true });
}

/** Addresses the front desk added for thank-you cards: [{guest, address}]. Only sent to CARD_WRITERS. */
const CARD_WRITERS = ['adriana'];
function cardAddr_() {
  const t = TABS.todo, sh = tab_(t), n = sh.getLastRow();
  if (n < 2) return [];
  const gi = t.keys.indexOf('guest'), li = t.keys.indexOf('group'), ai = t.keys.indexOf('address');
  return sh.getRange(2, 1, n - 1, t.headers.length).getValues()
    .filter(r => r[ai] && /thank-you/i.test(String(r[li])))
    .map(r => ({ guest: String(r[gi]), address: String(r[ai]) }));
}

/** The Front Desk To Do tab: every open task, plus tasks finished in the last 3 days. Rows are added by Claude's monthly runs. */
function todoRows_() {
  const t = TABS.todo, sh = tab_(t), n = sh.getLastRow();
  if (n < 2) return [];
  const vals = sh.getRange(2, 1, n - 1, t.headers.length).getValues(), cut = Date.now() - 3 * 864e5, out = [];
  vals.forEach((r, i) => {
    if (!(r[0] instanceof Date) || !r[1]) return;
    const o = { row: i + 2 };
    t.keys.forEach((k, j) => { o[k] = r[j] instanceof Date ? r[j].getTime() : r[j]; });
    if (o.status === 'Done' && !(o.doneAt >= cut)) return;
    out.push(o);
  });
  return out.slice(0, 300);
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
  team:  { name: 'Team', headers: ['Name', 'App ID', 'Group', 'Clock in/out', 'Active', 'Taffeta start date'] },
  clock: { name: 'Time Clock', headers: ['Date', 'Name', 'App ID', 'Clock in', 'Clock out', 'Hours', 'Note'] },
  off:   { name: 'Time Off', headers: ['Requested', 'Name', 'App ID', 'First day', 'Last day', 'Note', 'Status', 'Decided by'] },
  cover: { name: 'Shift Coverage', headers: ['Posted', 'Name', 'App ID', 'Group', 'Shift date', 'Shift time', 'Note', 'Status', 'Covered by', 'Covered at'] },
  ann:   { name: 'Announcements', headers: ['Date', 'Message', 'From'] },
  shift: { name: 'Shifts', headers: ['Date', 'Name', 'App ID', 'Start', 'End'] },
  info:  { name: 'Team Info', headers: ['Name', 'App ID', 'Emergency contact name', 'Emergency contact phone', 'Relationship', 'Home address', 'Email', 'Venmo name', 'Instagram', 'Updated'] },
  sigs:  { name: 'Handbook Signatures', headers: ['Signed', 'Name', 'App ID', 'Typed signature', 'Document'] },
  stock: { name: 'Stock Counts', headers: ['Updated', 'Name', 'App ID', 'Item ID', 'Item', 'On hand'] },
  models: { name: 'Model Log', headers: ['Logged', 'Name', 'App ID', 'Skill ID', 'Skill', 'Model date'] },
  mphoto: { name: 'Model Photos', headers: ['Logged', 'Name', 'App ID', 'Skill ID', 'Skill', 'Model date', 'Note', 'Before', 'After', 'Before (small)', 'After (small)'] },
  rxme:  { name: 'RX Artists', headers: ['Updated', 'Name', 'App ID', 'iPad PIN (scrambled)', 'Starred products', 'Wrong tries', 'Locked until'] },
  rxcard: { name: 'RX Saved Cards', headers: ['Saved', 'Name', 'App ID', 'Card ID', 'Guest', 'Card', 'Desk', 'Desk at', 'Opened at'] }
};
const STOCK_EDITORS = ['alexandra', 'rose', 'carolyn'];   // who can change stock counts in the app (everyone else only sees them)


/** The team list the setup fills in. After that, edit the Team tab directly (Group: stylist, esthetician or associate). */
const ROSTER = [
  ['Alexandra', 'alexandra', 'stylist', 'No'], ['Adriana', 'adriana', 'associate', 'Yes'], ['Alyssa', 'alyssa', 'associate', 'Yes'],
  ['Amanda', 'amanda', 'associate', 'Yes'], ['Angelina H', 'angelina-h', 'esthetician', 'No'], ['Ashley B', 'ashley-b', 'associate', 'Yes'],
  ['Carolyn', 'carolyn', 'esthetician', 'Yes'], ['Dominique', 'dominique', 'stylist', 'No'], ['Emily B', 'emily-b', 'stylist', 'No'],
  ['Jen M', 'jen-m', 'stylist', 'No'], ['Jennifer C', 'jennifer-c', 'stylist', 'No'], ['Joanna', 'joanna', 'stylist', 'No'],
  ['Kat', 'kat', 'associate', 'Yes'], ['Kelly', 'kelly', 'esthetician', 'No'], ['Lexi', 'lexi', 'stylist', 'No'],
  ['Mia', 'mia', 'stylist', 'No'], ['Neva L', 'neva-l', 'stylist', 'No'], ['Rose', 'rose', 'associate', 'Yes'], ['Sara', 'sara', 'stylist', 'No'], ['Isabella', 'isabella', 'stylist', 'No']
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
  const vals = tvals_(TT.team), i = vals.findIndex(r => String(r[1]) === String(slug));
  if (i < 0) {
    // A signed link for someone not on the Team tab yet (a new hire): add her so her app works on day one.
    const name = String(slug).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    ttab_(TT.team).appendRow([name, String(slug), 'stylist', 'No', 'Yes', '']);
    return { name, slug: String(slug), group: 'stylist', clock: false, row: vals.length + 2, start: '' };
  }
  const r = vals[i];
  if (String(r[4]).toLowerCase() === 'no') return null;
  return { name: String(r[0]), slug: String(r[1]), group: String(r[2]), clock: String(r[3]).toLowerCase() === 'yes', row: i + 2,
    start: r[5] instanceof Date ? day_(r[5]) : String(r[5] || '') };
}
/** Adds the "Taffeta start date" heading to a Team tab made before that column existed. */
function startHeader_() {
  const sh = ttab_(TT.team), c = sh.getRange(1, 6);
  if (!c.getValue()) c.setValue(TT.team.headers[5]).setFontWeight('bold').setBackground('#121212').setFontColor('#f8f6f0');
  return sh;
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
  return json_({ ok: true, now: now.getTime(), me: { name: me.name, group: me.group, clock: me.clock, start: me.start },
    clock: { in: !!open, since: open ? open.getTime() : null, sinceLabel: open ? hhmm_(open) : null, todayMin: Math.round(todayMin), weekMin: Math.round(weekMin) },
    shifts, ann, openShifts, myCover, myOff, info: myInfo_(me.slug), signed: mySigs_(me.slug), stock: stock_(), stockEdit: STOCK_EDITORS.indexOf(me.slug) >= 0, models: myModels_(me.slug), mphotos: myMPhotos_(me.slug),
    cardAddr: CARD_WRITERS.indexOf(me.slug) >= 0 ? cardAddr_() : null,
    mphoto: true,       // tells the team app this version takes model photos (type 'mphoto')
    regimen: true,      // tells the team app this version takes Home care PDFs (type 'regimen')
    rx: { pin: !!rxMe_(me.slug).pin } });   // tells the team app this version syncs stars and RX cards, and whether her iPad PIN is set
}

/** Private: only the person's own row is ever returned. */
function myInfo_(slug) {
  const r = tvals_(TT.info).find(r => String(r[1]) === slug);
  return r ? { ecName: String(r[2]), ecPhone: String(r[3]), ecRel: String(r[4]), address: String(r[5]), email: String(r[6]), venmo: String(r[7]), instagram: String(r[8]) } : null;
}
/** Latest on-hand count per item, typed in the app by Alexandra or Rose: {itemId: {n, by, at}}. */
function stock_() {
  const o = {};
  tvals_(TT.stock).forEach(r => { if (r[3] !== '') o[String(r[3])] = { n: Number(r[5]), by: String(r[1]), at: r[0] instanceof Date ? day_(r[0]) : '' }; });
  return o;
}
/** Associate program models the person checked off in the app: [{id, date}], oldest first. */
function myModels_(slug) {
  return tvals_(TT.models).filter(r => String(r[2]) === slug && r[3] !== '')
    .map(r => ({ id: String(r[3]), date: r[5] instanceof Date ? day_(r[5]) : String(r[5]) }));
}
/**
 * Associate model photos (Alexandra, Oct 22 2026): each associate adds a before and an after of her model
 * from the Associate Program page. Photos go to Drive (Associate Model Photos / <name>), with a row on the
 * Model Photos tab. The Pretty Report's Model Photos page shows them all in one album, grouped by name.
 */
const MPHOTO_FOLDER = 'Associate Model Photos';
function mphotoFolder_(sub) {
  const parent = DriveApp.getFileById(TEAM_SHEET_ID).getParents().next();
  const it = parent.getFoldersByName(MPHOTO_FOLDER), root = it.hasNext() ? it.next() : parent.createFolder(MPHOTO_FOLDER);
  if (!sub) return root;
  const s = root.getFoldersByName(sub);
  return s.hasNext() ? s.next() : root.createFolder(sub);
}
function mphotoFile_(dataUrl, folder, name) {
  const m = String(dataUrl || '').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return '';
  return folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name + '.jpg')).getId();
}
function mphotoSave_(me, d) {
  const id = clean_(d.id, 40), date = String(d.date || '');
  if (!/^[a-z0-9-]{2,40}$/.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json_({ ok: false, error: 'model' });
  if (!d.before && !d.after) return json_({ ok: false, error: 'photo' });
  const skill = clean_(d.skill, 80), base = date + ' ' + skill;
  const mine = mphotoFolder_(me.name), small = mphotoFolder_('.small');
  const b = mphotoFile_(d.before, mine, base + ' - before'), a = mphotoFile_(d.after, mine, base + ' - after');
  const bt = b ? mphotoFile_(d.beforeT, small, me.slug + ' ' + base + ' - before') : '', at = a ? mphotoFile_(d.afterT, small, me.slug + ' ' + base + ' - after') : '';
  if (!b && !a) return json_({ ok: false, error: 'photo' });
  ttab_(TT.mphoto).appendRow([new Date(), me.name, me.slug, id, skill, date, clean_(d.note, 300), b, a, bt, at]);
  return json_({ ok: true });
}
/** Her own list only (no pictures), for the Associate Program page. */
function myMPhotos_(slug) {
  return tvals_(TT.mphoto).filter(r => String(r[2]) === slug)
    .map(r => ({ id: String(r[3]), skill: String(r[4]), date: r[5] instanceof Date ? day_(r[5]) : String(r[5]), before: !!r[7], after: !!r[8] }));
}
function mphotoData_(fid) {
  if (!fid) return '';
  try { const b = DriveApp.getFileById(String(fid)).getBlob(); return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes()); } catch (e) { return ''; }
}
/** The Pretty Report album: newest first, small pictures inline, the full size one opens with mpfull. */
function mphotoAlbum_() {
  const rows = tvals_(TT.mphoto).map((r, i) => ({ row: i + 2, name: String(r[1]), slug: String(r[2]), skill: String(r[4]),
    date: r[5] instanceof Date ? day_(r[5]) : String(r[5]), note: String(r[6] || ''), before: String(r[7] || ''), after: String(r[8] || ''),
    beforeT: String(r[9] || ''), afterT: String(r[10] || '') })).reverse().slice(0, 240);
  rows.forEach(x => { x.beforeT = mphotoData_(x.beforeT || x.before); x.afterT = mphotoData_(x.afterT || x.after); });
  return { ok: true, photos: rows, folder: mphotoFolder_().getUrl() };
}
function mphotoFull_(fid) {
  const ok = tvals_(TT.mphoto).some(r => String(r[7]) === String(fid) || String(r[8]) === String(fid));
  return ok ? { ok: true, src: mphotoData_(fid) } : { ok: false };
}
function mySigs_(slug) {
  const o = {};
  tvals_(TT.sigs).forEach(r => { if (String(r[2]) === slug) o[String(r[4])] = { name: String(r[3]), at: r[0] instanceof Date ? day_(r[0]) : String(r[0]) }; });
  return o;
}

/* ---- RX cards and starred products follow each artist (Alexandra, Oct 2026) ----
   She sets an iPad PIN once from her own app. On the salon iPad she taps her name and types it; the iPad gets a
   key for her that works until midnight. Her stars and saved RX cards live here, so her phone and the iPad match. */
const RX_TRIES = 5, RX_LOCK_MIN = 15, RX_MAX_CARDS = 300;
function rxMe_(slug) {
  const vals = tvals_(TT.rxme), i = vals.findIndex(r => String(r[2]) === String(slug)), r = i >= 0 ? vals[i] : null;
  let favs = [];
  try { favs = r ? JSON.parse(String(r[4]) || '[]') : []; } catch (e) { favs = []; }
  return { row: i >= 0 ? i + 2 : 0, pin: r ? String(r[3]) : '', favs: favs, tries: r ? Number(r[5]) || 0 : 0,
    until: r && r[6] instanceof Date ? r[6].getTime() : 0 };
}
function rxMeSet_(slug, name, o) {
  const sh = ttab_(TT.rxme), cur = rxMe_(slug), v = Object.assign({ pin: cur.pin, favs: cur.favs, tries: cur.tries, until: cur.until }, o);
  const row = [new Date(), name, String(slug), v.pin, JSON.stringify(v.favs), v.tries || '', v.until ? new Date(v.until) : ''];
  if (cur.row) sh.getRange(cur.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
}
const rxPinHash_ = (slug, pin) => sign_('pin:' + slug + ':' + pin);
const rxTok_ = slug => sign_('rx:' + slug + ':' + day_(new Date()));   // the iPad's key for her, good until midnight
/* ---- RX cards on the Front Desk (Alexandra, Oct 17 2026): the artist taps Save & Send To Desk, the guest scans the
   QR at the station, and if she doesn't open it the desk texts her the link. Every saved card is filed for the desk. */
/* "Opened" on the Front Desk cards, shared by every desk device (Alexandra, Oct 20 2026): card key -> first time tapped */
function deskSeen_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('DESK_SEEN') || '{}'); } catch (e) { return {}; } }
function deskSeenSet_(d) {
  if (d.key !== DESK_KEY) return json_({ ok: false, error: 'key' });
  const k = String(d.k || '').slice(0, 80); if (!/^desk-seen:[\w]+:\d+:\d+$/.test(k)) return json_({ ok: false });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const m = deskSeen_(); if (!m[k]) m[k] = Date.now();
    const keys = Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, 600), out = {}; keys.forEach(x => out[x] = m[x]);
    PropertiesService.getScriptProperties().setProperty('DESK_SEEN', JSON.stringify(out));
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}
function rxDeskHead_(sh) {
  if (sh.getRange(1, 7).getValue() !== 'Desk') sh.getRange(1, 7, 1, 3).setValues([['Desk', 'Desk at', 'Opened at']]).setFontWeight('bold').setBackground('#121212').setFontColor('#f8f6f0');
}
function rxDeskList_(days) {
  const cut = days ? Date.now() - days * 864e5 : 0, out = [], ms = v => v instanceof Date ? v.getTime() : (Number(v) || 0);
  tvals_(TT.rxcard).forEach((r, i) => {
    const at = ms(r[0]); if (!r[3] || at < cut) return;
    const desk = String(r[6] || ''); if (days && !desk) return;   // the to-send list only shows cards sent to the desk
    let c = {}; try { c = JSON.parse(String(r[5])); } catch (e) {}
    const m = c.draft && c.draft.m || {};
    out.push({ row: i + 2, id: String(r[3]), at: at, artist: String(r[1]), guest: String(r[4] || c.guest || ''), kind: c.kind === 'skin' ? 'Skin' : 'Hair',
      day: c.date || '', budget: c.budget || null, totals: c.totals || [], next: m.when || '', desk: desk, deskAt: ms(r[7]), openedAt: ms(r[8]) });
  });
  return out.reverse().slice(0, days ? 100 : 1500);
}
function rxDeskCard_(row) {
  const sh = ttab_(TT.rxcard), n = Number(row);
  if (!(n >= 2 && n <= sh.getLastRow())) return { ok: false };
  try { const c = JSON.parse(String(sh.getRange(n, 6).getValue())); return { ok: true, link: c.link || '' }; } catch (e) { return { ok: false }; }
}
function rxDeskSet_(d) {
  if (d.key !== DESK_KEY) return json_({ ok: false, error: 'key' });
  const sh = ttab_(TT.rxcard), n = Number(d.row);
  if (!(n >= 2 && n <= sh.getLastRow()) || String(sh.getRange(n, 4).getValue()) !== String(d.id || '')) return json_({ ok: false });
  if (['New', 'Sent'].indexOf(d.status) < 0) return json_({ ok: false });
  rxDeskHead_(sh); sh.getRange(n, 7, 1, 2).setValues([[d.status, new Date()]]);
  return json_({ ok: true });
}
/** The guest's card page says it was opened (she scanned the QR or tapped the text), so the desk doesn't need to send it. */
function rxOpened_(d) {
  const slug = String(d.s || ''), id = String(d.i || '');
  if (!slug || !id) return json_({ ok: false });
  const sh = ttab_(TT.rxcard), vals = tvals_(TT.rxcard);
  const i = vals.findIndex(r => String(r[2]) === slug && String(r[3]) === id);
  if (i < 0) return json_({ ok: false });
  rxDeskHead_(sh);
  if (!vals[i][8]) sh.getRange(i + 2, 9).setValue(new Date());
  if (String(vals[i][6] || '') === 'New') sh.getRange(i + 2, 7, 1, 2).setValues([['Opened', new Date()]]);
  return json_({ ok: true });
}

function rxCards_(slug) {
  return tvals_(TT.rxcard).filter(r => String(r[2]) === slug && r[3] !== '').reverse()
    .map(r => { try { return JSON.parse(String(r[5])); } catch (e) { return null; } }).filter(Boolean).slice(0, RX_MAX_CARDS);
}
function rxPost_(d) {
  const slug = String(d.slug || '');
  if (d.type === 'rxlogin') {
    const r = tvals_(TT.team).find(x => String(x[1]) === slug);
    if (!r || String(r[4]).toLowerCase() === 'no') return json_({ ok: false, error: 'who' });
    const m = rxMe_(slug), now = Date.now();
    if (!m.pin) return json_({ ok: false, error: 'nopin' });
    if (m.until > now) return json_({ ok: false, error: 'locked', mins: Math.ceil((m.until - now) / 6e4) });
    if (!/^\d{4,8}$/.test(String(d.pin || '')) || rxPinHash_(slug, String(d.pin)) !== m.pin) {
      const tries = m.tries + 1, lock = tries >= RX_TRIES;
      rxMeSet_(slug, String(r[0]), { tries: lock ? 0 : tries, until: lock ? now + RX_LOCK_MIN * 6e4 : 0 });
      return json_({ ok: false, error: lock ? 'locked' : 'pin', mins: lock ? RX_LOCK_MIN : 0 });
    }
    if (m.tries || m.until) rxMeSet_(slug, String(r[0]), { tries: 0, until: 0 });
    return json_({ ok: true, tk: rxTok_(slug), name: String(r[0]), group: String(r[2]), favs: m.favs, cards: rxCards_(slug) });
  }
  // rxpin needs her own app's link; rxsync takes her app's link or the iPad key from rxlogin
  let me = member_(slug, d.t);
  if (!me && d.type === 'rxsync' && d.tk && d.tk === rxTok_(slug)) {
    const r = tvals_(TT.team).find(x => String(x[1]) === slug);
    if (r && String(r[4]).toLowerCase() !== 'no') me = { name: String(r[0]), slug: slug };
  }
  if (!me) return json_({ ok: false, error: 'link' });
  if (d.type === 'rxpin') {
    const pin = String(d.pin || '');
    if (!/^\d{4,8}$/.test(pin)) return json_({ ok: false, error: 'pin' });
    rxMeSet_(me.slug, me.name, { pin: rxPinHash_(me.slug, pin), tries: 0, until: 0 });
    return json_({ ok: true });
  }
  // rxsync: replace her stars when sent; add or update the cards sent (by card ID); always answer with both
  if (Array.isArray(d.favs)) rxMeSet_(me.slug, me.name, { favs: d.favs.slice(0, 200).map(x => clean_(x, 160)).filter(Boolean) });
  if (Array.isArray(d.cards) && d.cards.length) {
    const sh = ttab_(TT.rxcard), vals = tvals_(TT.rxcard), now = new Date();
    d.cards.slice(0, 50).forEach(c => {
      const id = clean_(c && c.id, 40), body = JSON.stringify(c || {});
      if (!id || body.length > 45000) return;
      const i = vals.findIndex(r => String(r[2]) === me.slug && String(r[3]) === id);
      const row = [now, me.name, me.slug, id, clean_(c.guest, 60), body];
      let at = i + 2;
      if (i >= 0) sh.getRange(at, 1, 1, row.length).setValues([row]); else { sh.appendRow(row); at = sh.getLastRow(); vals.push(row.concat(['', '', ''])); }
      // "Save & Send To Desk": the card waits on the Front Desk's RX Cards list (once there, saving again keeps its status)
      if (c.desk && !String((vals[at - 2] || [])[6] || '')) { rxDeskHead_(sh); sh.getRange(at, 7, 1, 2).setValues([['New', now]]); }
    });
  }
  return json_({ ok: true, favs: rxMe_(me.slug).favs, cards: rxCards_(me.slug) });
}

function teamPost_(d) {
  let me = member_(d.slug, d.t);
  // the salon iPad signs in with a PIN (the rxlogin key), not her app link: let it save home care too (Alexandra, Oct 20 2026)
  if (!me && (d.type === 'regimen' || d.type === 'rgmine') && d.tk && d.tk === rxTok_(String(d.slug || ''))) {
    const r = tvals_(TT.team).find(x => String(x[1]) === String(d.slug));
    if (r && String(r[4]).toLowerCase() !== 'no') me = { name: String(r[0]), slug: String(r[1]) };
  }
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
    if ('start' in d) {
      const start = String(d.start || '');
      if (start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) return json_({ ok: false, error: 'start' });
      const ts = startHeader_();
      ts.getRange(me.row, 6).setValue(start ? new Date(start + 'T12:00:00') : '').setNumberFormat('mmm d, yyyy');
    }
    return json_({ ok: true });
  }
  if (d.type === 'rgmine') {   // her saved home care sheets, newest first, to search and edit (Alexandra, Oct 20 2026)
    const rsh = tab_(TABS.regimen), n = rsh.getLastRow(); if (n < 2) return json_({ ok: true, list: [] });
    const out = [];
    rsh.getRange(2, 1, n - 1, 8).getValues().forEach((v, i) => { if (String(v[1]) !== me.name) return; let o = null; try { o = JSON.parse(String(v[5])); } catch (e) {}
      out.push({ row: i + 2, at: v[0] instanceof Date ? v[0].getTime() : 0, guest: String(v[2]), kind: String(v[3]), summary: String(v[4]), status: String(v[6] || 'New'), data: o }); });
    return json_({ ok: true, list: out.reverse().slice(0, 300) });
  }
  if (d.type === 'regimen') {   // an artist saved an at-home regimen: it waits on the Front Desk page's Home care list to be texted
    const r = d.data || {}, guest = clean_(d.guest, 80), kind = d.kind === 'skin' ? 'skin' : 'hair';
    const data = JSON.stringify({ guest: guest, services: [].concat(r.services || []).slice(0, 12), type: clean_(r.type, 40),
      picks: [].concat(r.picks || []).slice(0, 40).map(p => ({ n: clean_(p.n, 120), how: String(p.how == null ? '' : p.how).split(/\r?\n/).map(x => clean_(x, 600)).filter(Boolean).join('\n').slice(0, 1600), when: clean_(p.when, 30), step: clean_(p.step, 40) })),   // keeps the step-by-step lines (Oct 20 2026)
      notes: [].concat(r.notes || []).slice(0, 20).map(n => clean_(n, 200)), own: clean_(r.own, 1500), next: clean_(r.next, 20),
      nextDate: /^\d{4}-\d{2}-\d{2}$/.test(String(r.nextDate || '')) ? r.nextDate : '', msg: clean_(r.msg, 500), rid: clean_(r.rid, 40), plan: clean_(r.plan, 120) });
    if (!guest) return json_({ ok: false, error: 'guest' });
    const products = JSON.parse(data).picks.map(p => p.n.replace(/^Biologique Recherche /, '')).join(', ');
    // saved again from the same RX card before the desk texted it: replace that one instead of adding a second (Alexandra, Oct 20 2026)
    // draft (Oct 22 2026): she chose an option; the artist finishes the products at the end, then it's New for the desk
    const rid = JSON.parse(data).rid, rsh = tab_(TABS.regimen), row = [now, me.name, guest, kind === 'skin' ? 'Skincare' : 'Hair care', products, data, d.draft ? 'Draft' : 'New', ''];
    let at = -1;
    // edited from her Saved Cards: replace that one unless the desk already texted it (Alexandra, Oct 20 2026)
    const er = Number(d.replaceRow);
    if (er >= 2 && er <= rsh.getLastRow()) { const v = rsh.getRange(er, 1, 1, 8).getValues()[0]; if (String(v[1]) === me.name && String(v[6]) !== 'Sent') at = er; }
    if (at < 0 && rid && rsh.getLastRow() > 1) {
      const vals = rsh.getRange(2, 1, rsh.getLastRow() - 1, 8).getValues();
      for (let i = vals.length - 1; i >= 0; i--) { let o = {}; try { o = JSON.parse(String(vals[i][5])); } catch (e) {} if (o.rid === rid && String(vals[i][6]) !== 'Sent') { if (d.draft && String(vals[i][6]) === 'New') return json_({ ok: true, kept: true }); at = i + 2; break; } }
    }
    if (at > 0) { const was = String(rsh.getRange(at, 7).getValue()); rsh.getRange(at, 1, 1, row.length).setValues([row]);
      if (!d.draft && was === 'Draft') deskPush_('Home care PDF to send', me.name + ' finished ' + deskFirst_(guest) + '’s at-home ' + (kind === 'skin' ? 'skincare' : 'hair care') + ' PDF.');
      return json_({ ok: true, replaced: true }); }
    rsh.appendRow(row);
    if (!d.draft) deskPush_('Home care PDF to send', me.name + ' made ' + deskFirst_(guest) + '’s at-home ' + (kind === 'skin' ? 'skincare' : 'hair care') + ' PDF.');
    return json_({ ok: true });
  }
  if (d.type === 'stock') {
    if (STOCK_EDITORS.indexOf(me.slug) < 0) return json_({ ok: false, error: 'stock' });
    const id = clean_(d.id, 160), n = Number(d.n);
    if (!id || !(n >= 0 && n <= 9999) || Math.floor(n) !== n) return json_({ ok: false, error: 'count' });
    const row = [now, me.name, me.slug, id, clean_(d.item, 160), n];
    const sh = ttab_(TT.stock), i = tvals_(TT.stock).findIndex(r => String(r[3]) === id);
    if (i >= 0) sh.getRange(i + 2, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    sh.getRange('A2:A').setNumberFormat('ddd mmm d, h:mm am/pm');
    return json_({ ok: true });
  }
  if (d.type === 'model') {
    const id = clean_(d.id, 40), date = String(d.date || '');
    if (!/^[a-z0-9-]{2,40}$/.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json_({ ok: false, error: 'model' });
    const sh = ttab_(TT.models);
    if (d.action === 'undo') {
      const vals = tvals_(TT.models);
      for (let i = vals.length - 1; i >= 0; i--) if (String(vals[i][2]) === me.slug && String(vals[i][3]) === id) { sh.deleteRow(i + 2); break; }
      return json_({ ok: true });
    }
    sh.appendRow([now, me.name, me.slug, id, clean_(d.skill, 80), date]);
    sh.getRange('A2:A').setNumberFormat('ddd mmm d, h:mm am/pm');
    return json_({ ok: true });
  }
  if (d.type === 'mphoto') return mphotoSave_(me, d);
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
  if (p.mphotos) return json_(mphotoAlbum_());
  if (p.mpfull) return json_(mphotoFull_(p.mpfull));
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
    // Let the employee know too, if she has an email on her My info page.
    const inf = tvals_(TT.info).find(x => String(x[1]) === String(r[2])), to = inf && String(inf[6] || '').trim();
    if (to && to.indexOf('@') > 0) {
      const dd = v => v instanceof Date ? day_(v) : String(v), a = dd(r[3]), b = dd(r[4]);
      mail_(to, 'Your time off request was ' + status.toLowerCase(),
        'Hi ' + firstName_(r[1]) + ',\n\nYour request for ' + (a === b ? a : a + ' to ' + b) + ' off was ' + status.toLowerCase() + ' by ' + who + '.' +
        '\n\nYou can always see the latest in your Employee Experience App, under Time off.\n\nTaffeta Salon & Spa');
    }
    return page(status + '. ' + firstName_(r[1]) + ' will see it in her app.');
  } finally { lock.releaseLock(); }
}
const firstName_ = n => String(n || '').split(' ')[0];

function mail_(to, subject, body) { try { MailApp.sendEmail({ to: to, subject: subject, body: body }); } catch (err) {} }
