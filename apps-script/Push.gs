/**
 * Phone alerts for artists (web push through Firebase Cloud Messaging, free).
 * An artist turns alerts on from My Info; her phone's token is kept on the "Push tokens" tab.
 * She gets a banner when the office creates a job offer for her, and when a wedding she's on
 * is added or changed. Schedule changes wait until the office has stopped editing for 5 minutes,
 * so one edit session sends one alert. Banners never include payout.
 * Firebase project: taffeta-weddings-alerts on info@ (script property FCM_PROJECT can override it).
 */
const PUSH_TAB = 'Push tokens';
const PUSH_HEADERS = ['Member id', 'Artist', 'Token', 'Device', 'Added', 'Last sent'];
const PUSH_SETTLE_MS = 5 * 60 * 1000;
const APP_URL = 'https://prettyteam.taffetadesign.com/weddings/';

function pushSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(PUSH_TAB);
  if (!sh) {
    sh = ss.insertSheet(PUSH_TAB);
    sh.getRange(1, 1, 1, PUSH_HEADERS.length).setValues([PUSH_HEADERS]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:F').setNumberFormat('@');
  }
  return sh;
}

function pushRows_() {
  const sh = pushSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, PUSH_HEADERS.length).getValues()
    .map((r, i) => ({ row: i + 2, memberId: String(r[0]), token: String(r[2]) })).filter(t => t.memberId && t.token);
}

/** Artist: save this phone's token (or remove it when she turns alerts off). */
function savePushToken_(member, token, device, off) {
  token = String(token || '').trim();
  if (!token || token.length > 600) return { ok: false, error: 'bad_request' };
  const sh = pushSheet_(), cur = pushRows_().find(t => t.token === token);
  if (off) { if (cur) sh.deleteRow(cur.row); return { ok: true, on: false }; }
  if (cur && cur.memberId === member.id) return { ok: true, on: true };
  if (cur) sh.deleteRow(cur.row);   // same phone, now someone else's link
  sh.appendRow([member.id, clean_(member.preferredName || member.legalName, 120), token, clean_(device, 120), new Date().toISOString(), '']);
  return { ok: true, on: true };
}

/** Office: member ids with alerts turned on. */
function pushOnIds_() { return [...new Set(pushRows_().map(t => t.memberId))]; }

/** Send one alert to every phone the artist turned alerts on for. */
function pushTo_(memberId, title, body, tab) {
  const project = PropertiesService.getScriptProperties().getProperty('FCM_PROJECT') || 'taffeta-weddings-alerts';
  const toks = pushRows_().filter(t => t.memberId === memberId);
  if (!project || !toks.length) return 0;
  const url = 'https://fcm.googleapis.com/v1/projects/' + project + '/messages:send';
  const headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': project };
  const reqs = toks.map(t => ({ url: url, method: 'post', contentType: 'application/json', headers: headers, muteHttpExceptions: true,
    payload: JSON.stringify({ message: { token: t.token,
      data: { title: String(title).slice(0, 100), body: String(body).slice(0, 180), tab: tab || 'team', url: APP_URL },
      webpush: { headers: { Urgency: 'high', TTL: '86400' } } } }) }));
  const res = UrlFetchApp.fetchAll(reqs), sh = pushSheet_(), now = new Date().toISOString(), gone = [];
  let sent = 0;
  res.forEach((r, i) => {
    const code = r.getResponseCode(), text = r.getContentText();
    if (code === 200) { sent++; sh.getRange(toks[i].row, 6).setValue(now); }
    else if (code === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(text)) gone.push(toks[i].row);   // phone turned alerts off or app removed
    else console.warn('Push failed (' + code + '): ' + text.slice(0, 300));
  });
  gone.sort((a, b) => b - a).forEach(r => sh.deleteRow(r));
  return sent;
}

const shortDate_ = d => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Number(m[2]) + '/' + Number(m[3]) : ''; };

/** After an offer is created: one alert per artist. */
function pushJobOffer_(memberIds, date, role) {
  memberIds.forEach(id => { try { pushTo_(id, 'New job offer', shortDate_(date) + ' · ' + role + '. Tap to answer.', 'jobs'); } catch (e) { console.warn(e); } });
}

/* ---------- schedule changes: noted on save, sent once editing settles ---------- */
const SCHED_SKIP = ['bride', 'notes', 'contactName', 'contactPhone', 'cal', 'updatedAt', 'ext', 'id'];
function schedSig_(w) {
  const o = {};
  Object.keys(w || {}).sort().forEach(k => { if (SCHED_SKIP.indexOf(k) < 0) o[k] = w[k]; });
  return JSON.stringify(o);
}
const artistIds_ = w => [...new Set(((w && w.artists) || []).map(a => String(a.uid || '')).filter(Boolean))];

/** Called from saveWedding_ with the old and new wedding. */
function notePushChange_(before, after) {
  try {
    const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
    if (!after || !after.date || after.date < today) return;
    const was = artistIds_(before), now = artistIds_(after), changed = before && schedSig_(before) !== schedSig_(after);
    const who = {};
    now.forEach(id => { if (was.indexOf(id) < 0) who[id] = 'added'; else if (changed) who[id] = 'changed'; });
    if (!Object.keys(who).length) return;
    const props = PropertiesService.getScriptProperties();
    const pend = JSON.parse(props.getProperty('PUSH_PENDING') || '{}');
    const p = pend[after.id] || { who: {} };
    Object.keys(who).forEach(id => { if (p.who[id] !== 'added') p.who[id] = who[id]; });
    p.at = Date.now();
    pend[after.id] = p;
    props.setProperty('PUSH_PENDING', JSON.stringify(pend));
  } catch (e) { console.warn(e); }
}

/** Sends alerts for weddings nobody has edited for 5 minutes. Runs on app requests and with the hourly sync. */
function flushPush_() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('PUSH_PENDING');
  if (!raw || raw === '{}') return;
  const pend = JSON.parse(raw), due = Object.keys(pend).filter(id => Date.now() - pend[id].at >= PUSH_SETTLE_MS);
  if (!due.length) return;
  due.forEach(id => delete pend[id]);
  props.setProperty('PUSH_PENDING', JSON.stringify(pend));   // clear first, so a slow send never repeats
  const all = weddings_();
  due.forEach(id => {
    const w = (all.find(x => x.d.id === id) || {}).d;
    if (!w) return;
    const now = artistIds_(w), who = JSON.parse(raw)[id].who;
    Object.keys(who).filter(m => now.indexOf(m) >= 0).forEach(m => {
      const first = String(w.bride || 'A wedding').split(/\s+/)[0];
      try {
        pushTo_(m, who[m] === 'added' ? "You're on a wedding" : 'Schedule updated', first + ' · ' + shortDate_(w.date) + '. Tap to see your times.', 'team');
      } catch (e) { console.warn(e); }
    });
  });
}

/** Editor check: asks Firebase to validate a send (nothing is delivered). A token error means sign-in and project are fine. */
function checkPushSetup() {
  const project = PropertiesService.getScriptProperties().getProperty('FCM_PROJECT') || 'taffeta-weddings-alerts';
  const r = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + project + '/messages:send', { method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': project }, muteHttpExceptions: true,
    payload: JSON.stringify({ validate_only: true, message: { token: 'not-a-real-token', data: { title: 'check' } } }) });
  Logger.log(r.getResponseCode() + ' ' + r.getContentText().slice(0, 400));
}

/** Editor test: sends a test alert to the first artist with alerts on. */
function testPush() {
  const t = pushRows_()[0];
  if (!t) { Logger.log('No one has turned alerts on yet.'); return; }
  Logger.log('Sent: ' + pushTo_(t.memberId, 'Test alert', 'Alerts are working.', 'team'));
}
