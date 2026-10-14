/**
 * Front Desk phone alerts (web push through the "Taffeta Weddings Alerts" Firebase project on info@, free).
 * Each phone or iPad turns alerts on from the Front Desk page and is saved with a name ("Front desk iPad").
 * Alerts: every concierge request, consultation and profile update (sent as it comes in, next to the email),
 * and new rows on the To Do tab (checked every 10 minutes, since those are added straight to the Sheet).
 * Banners only show a first name or the task, never phone numbers, emails, budgets or allergies.
 */
const DESK_PUSH_TAB = 'Phone alerts';
const DESK_PUSH_HEADERS = ['Name', 'Token', 'Device', 'Added', 'Last sent'];
const FCM_PROJECT = 'taffeta-weddings-alerts';

function deskPushSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(DESK_PUSH_TAB);
  if (!sh) {
    sh = ss.insertSheet(DESK_PUSH_TAB);
    sh.getRange(1, 1, 1, DESK_PUSH_HEADERS.length).setValues([DESK_PUSH_HEADERS]).setFontWeight('bold').setBackground('#423327').setFontColor('#f2f1ec');
    sh.setFrozenRows(1);
    sh.getRange('A:E').setNumberFormat('@');
  }
  return sh;
}

function deskPushRows_() {
  const sh = deskPushSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, DESK_PUSH_HEADERS.length).getValues()
    .map((r, i) => ({ row: i + 2, name: String(r[0]), token: String(r[1]) })).filter(t => t.token);
}

/** Front Desk page: save this device's token with its name, or remove it (Turn off). */
function deskSavePush_(d) {
  if (d.key !== DESK_KEY) return json_({ ok: false, error: 'key' });
  const token = String(d.token || '').trim();
  if (!token || token.length > 600) return json_({ ok: false });
  const sh = deskPushSheet_(), cur = deskPushRows_().find(t => t.token === token);
  if (cur) sh.deleteRow(cur.row);
  if (!d.off) sh.appendRow([clean_(d.name, 60) || 'Front desk', token, clean_(d.device, 60), new Date().toISOString(), '']);
  return json_({ ok: true, on: !d.off });
}

/** One alert to every device that turned alerts on. Never throws. */
function deskPush_(title, body) {
  try {
    const toks = deskPushRows_();
    if (!toks.length) return 0;
    const url = 'https://fcm.googleapis.com/v1/projects/' + FCM_PROJECT + '/messages:send';
    const headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': FCM_PROJECT };
    const res = UrlFetchApp.fetchAll(toks.map(t => ({ url: url, method: 'post', contentType: 'application/json', headers: headers, muteHttpExceptions: true,
      payload: JSON.stringify({ message: { token: t.token,
        data: { title: String(title).slice(0, 100), body: String(body).slice(0, 180), tab: 'desk' },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } } } }) })));
    const sh = deskPushSheet_(), now = new Date().toISOString(), gone = [];
    let sent = 0;
    res.forEach((r, i) => {
      const code = r.getResponseCode(), text = r.getContentText();
      if (code === 200) { sent++; sh.getRange(toks[i].row, 5).setValue(now); }
      else if (code === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(text)) gone.push(toks[i].row);
      else console.warn('Push failed (' + code + '): ' + text.slice(0, 300));
    });
    gone.sort((a, b) => b - a).forEach(r => sh.deleteRow(r));
    return sent;
  } catch (e) { console.warn(e); return 0; }
}

const deskFirst_ = s => String(s || '').trim().split(/\s+/)[0] || 'A guest';

/** Every 10 minutes: alert for To Do rows added since the last check (one alert, or a count when several came in). */
function deskTodoCheck() {
  const props = PropertiesService.getScriptProperties();
  const since = Number(props.getProperty('DESK_TODO_SEEN') || 0);
  const t = TABS.todo, sh = tab_(t), n = sh.getLastRow();
  let newest = since;
  const fresh = n < 2 ? [] : sh.getRange(2, 1, n - 1, 2).getValues().filter(r => {
    const at = r[0] instanceof Date ? r[0].getTime() : 0;
    if (at > newest) newest = at;
    return since && at > since && r[1];
  });
  props.setProperty('DESK_TODO_SEEN', String(newest || Date.now()));
  if (!fresh.length) return;
  if (fresh.length === 1) deskPush_('To do', String(fresh[0][1]).slice(0, 120));
  else deskPush_('To do · ' + fresh.length + ' new tasks', String(fresh[0][1]).slice(0, 80) + ' and ' + (fresh.length - 1) + ' more');
}

/** Run once from the editor: switches on the 10-minute To Do check (and marks what's there now as already seen). */
function installDeskAlerts() {
  ScriptApp.getProjectTriggers().filter(tr => tr.getHandlerFunction() === 'deskTodoCheck').forEach(tr => ScriptApp.deleteTrigger(tr));
  PropertiesService.getScriptProperties().deleteProperty('DESK_TODO_SEEN');
  deskTodoCheck();
  ScriptApp.newTrigger('deskTodoCheck').timeBased().everyMinutes(10).create();
  Logger.log('To Do alerts are on (checked every 10 minutes).');
}

/** Editor check: asks Firebase to validate a send (nothing is delivered). A token error means sign-in and project are fine. */
function checkDeskPush() {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);   // asks again if a permission (like sending alerts) was left unticked
  const r = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + FCM_PROJECT + '/messages:send', { method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': FCM_PROJECT }, muteHttpExceptions: true,
    payload: JSON.stringify({ validate_only: true, message: { token: 'not-a-real-token', data: { title: 'check' } } }) });
  Logger.log(r.getResponseCode() + ' ' + r.getContentText().slice(0, 300));
}
