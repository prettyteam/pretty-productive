/**
 * Bride inquiry and bride photo links (Alexandra, Nov 18 2026).
 * Alexandra texts brides who text her directly:
 *   prettyteam.taffetadesign.com/bride/         a short inquiry form (bride/index.html)
 *   prettyteam.taffetadesign.com/bride-photos/  a separate photo form (bride-photos/index.html)
 * Nobody signs in. Both post here without a code, so these actions run before doPost's sign-in check.
 *
 * Inquiry: one row on the "Bride inquiries" tab. A Zap (Google Sheets "New Spreadsheet Row" on that tab ->
 * HoneyBook "Create Project") turns each row into a HoneyBook inquiry, which then flows to Flodesk "Inquired Brides"
 * through the existing zap. Column names below are what the Zap maps, so don't rename them.
 *
 * Photos: a Drive folder per bride inside "Taffeta Bride Photos" (info@), one subfolder per kind of photo,
 * a row on the "Bride photos" tab, and one email to the office with the folder link.
 *
 * Hooked into Weddings.gs doPost, before the sign-in check:
 *   if (/^bride(Inquiry|PhotoStart|Photo|PhotosDone)$/.test(d.action || '')) return json_(bridePost_(d));
 */
const BRIDE_TAB = 'Bride inquiries';
const BRIDE_HEAD = ['Sent at', 'Full name', 'First name', 'Last name', 'Mobile', 'Email', 'Wedding date', 'Ceremony time',
  'First look', 'Getting ready at', 'Hair', 'Makeup', 'Project details', 'Project type'];
const BRIDE_PHOTO_TAB = 'Bride photos';
const BRIDE_PHOTO_HEAD = ['Sent at', 'Full name', 'Mobile', 'Photos', 'Folder'];
const BRIDE_GROUPS = { hair: 'Hair', skin: 'Skin', love: 'Looks she loves', skip: 'Looks she does not love' };

function bridePost_(d) {
  if (clean_(d.website, 10)) return { ok: true };   // the hidden box only robots fill in
  try {
    switch (d.action) {
      case 'brideInquiry': return brideInquiry_(d);
      case 'bridePhotoStart': return bridePhotoStart_(d);
      case 'bridePhoto': return bridePhoto_(d);
      case 'bridePhotosDone': return bridePhotosDone_(d);
    }
    return { ok: false, error: 'unknown_action' };
  } catch (err) {
    console.warn('bride: ' + err);
    return { ok: false, error: 'server' };
  }
}

function brideTab_(name, head) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

const brideFullName_ = d => (clean_(d.first, 40) + ' ' + clean_(d.last, 40)).trim();
const bridePhoneOk_ = p => String(p || '').replace(/\D/g, '').length >= 10;

function brideInquiry_(d) {
  const first = clean_(d.first, 40), last = clean_(d.last, 40), email = clean_(d.email, 120), phone = clean_(d.phone, 30);
  if (!first || !last || !bridePhoneOk_(phone) || !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'missing' };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(d.date || '')) ? String(d.date) : '';
  if (!date) return { ok: false, error: 'missing' };
  const ceremony = clean_(d.ceremony, 30), firstLook = clean_(d.firstLook, 20), ready = clean_(d.ready, 200),
    hair = clean_(d.hair, 20), makeup = clean_(d.makeup, 20);
  const details = [
    'Ceremony time: ' + (ceremony || 'not given'),
    'First look: ' + (firstLook || 'not given'),
    'Getting ready at: ' + (ready || 'not given'),
    'How many for hair: ' + (hair || 'not given'),
    'How many for makeup: ' + (makeup || 'not given'),
    'Mobile: ' + phone,
    'Sent from the bride text link.'
  ].join('\n');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = brideTab_(BRIDE_TAB, BRIDE_HEAD);
    sh.appendRow([Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'), first + ' ' + last, first, last, "'" + phone, email,
      "'" + date, ceremony, firstLook, ready, hair, makeup, details, 'Wedding']);
  } finally { lock.releaseLock(); }
  return { ok: true };
}

function bridePhotoRoot_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('BRIDE_PHOTO_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('Taffeta Bride Photos');
  props.setProperty('BRIDE_PHOTO_FOLDER', f.getId());
  return f;
}

/** Makes the bride's folder ("Emily Smith · Nov 18, 2026") and hands back a token for her photos (good for 6 hours). */
function bridePhotoStart_(d) {
  const name = brideFullName_(d);
  if (!clean_(d.first, 40) || !clean_(d.last, 40) || !bridePhoneOk_(d.phone)) return { ok: false, error: 'missing' };
  const folder = bridePhotoRoot_().createFolder((name + ' · ' + Utilities.formatDate(new Date(), TZ, 'MMM d, yyyy')).replace(/[\/\\]/g, '-'));
  const token = Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('bp_' + token, folder.getId(), 21600);
  return { ok: true, token: token };
}

function brideFolder_(token) {
  const id = /^[0-9a-f]{32}$/.test(String(token || '')) ? CacheService.getScriptCache().get('bp_' + token) : null;
  return id ? DriveApp.getFolderById(id) : null;
}

/** One photo: {token, group, data:'<base64 jpeg>'}. Each kind of photo goes in its own subfolder. */
function bridePhoto_(d) {
  const folder = brideFolder_(d.token);
  const label = BRIDE_GROUPS[d.group];
  if (!folder || !label || !d.data) return { ok: false, error: 'not_found' };
  if (String(d.data).length > 14e6) return { ok: false, error: 'too_big' };
  const subs = folder.getFoldersByName(label);
  const sub = subs.hasNext() ? subs.next() : folder.createFolder(label);
  const name = label + ' ' + Utilities.formatDate(new Date(), TZ, 'HHmmss') + '-' + Math.floor(Math.random() * 1000) + '.jpg';
  sub.createFile(Utilities.newBlob(Utilities.base64Decode(d.data), 'image/jpeg', name));
  return { ok: true };
}

/** After the last photo: a row on "Bride photos" and one email to the office with the folder link. */
function bridePhotosDone_(d) {
  const folder = brideFolder_(d.token);
  if (!folder) return { ok: false, error: 'not_found' };
  const name = brideFullName_(d), phone = clean_(d.phone, 30), c = d.counts || {};
  const parts = Object.keys(BRIDE_GROUPS).filter(k => +c[k] > 0).map(k => BRIDE_GROUPS[k] + ': ' + (+c[k]));
  const sent = +d.sent || 0, failed = +d.failed || 0;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    brideTab_(BRIDE_PHOTO_TAB, BRIDE_PHOTO_HEAD).appendRow([Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'), name, "'" + phone,
      sent + (failed ? ' (' + failed + ' did not send)' : ''), folder.getUrl()]);
  } finally { lock.releaseLock(); }
  const rows = [['Bride', name], ['Mobile', phone], ['Photos', String(sent)]].concat(parts.map(p => p.split(': ')));
  const intro = failed ? failed + ' photo(s) did not send. You may want to ask her for them by text.' : 'They are in her folder in Google Drive.';
  sendMail_(officeEmails_(), 'New bride photos: ' + name, mailText_('New bride photos', intro, rows, folder.getUrl()),
    mailHtml_('New bride photos', intro, rows, ['Open her photos', folder.getUrl()]));
  CacheService.getScriptCache().remove('bp_' + d.token);
  return { ok: true };
}
