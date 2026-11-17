/**
 * Color mix reminders on artists' phones (Alexandra, Nov 17 2026).
 * Guests on the Team Hub "Mix Watch" tab have had their color mixes undercharged more than once.
 * Each morning the daily Pretty Productive update adds one row per booked Mix Watch guest to the
 * "Mix alerts" tab of the Team Hub sheet. Every 10 minutes mixPushCheck() sends each new row to the
 * phones of the artist named by App ID (same phones as the guest request alerts, TeamPush.gs) and
 * stamps the Sent column, so nobody gets the same reminder twice.
 * The Front Desk side needs nothing here: the run also adds a To Do row, and deskTodoCheck() pushes it.
 * Setup once from the editor: run installMixPush.
 */
const MIX_TAB = 'Mix alerts';
const MIX_HEADERS = ['Added', 'Date', 'Time', 'Guest', 'Artist App ID', 'Reminder', 'Sent'];

function mixSheet_() {
  const ss = tss_();
  let sh = ss.getSheetByName(MIX_TAB);
  if (!sh) {
    sh = ss.insertSheet(MIX_TAB);
    sh.getRange(1, 1, 1, MIX_HEADERS.length).setValues([MIX_HEADERS]).setFontWeight('bold').setBackground('#121212').setFontColor('#f8f6f0');
    sh.setFrozenRows(1);
    sh.getRange('A:G').setNumberFormat('@');
  }
  return sh;
}

/** Every 10 minutes: send today's unsent rows. Rows for other days are left alone. Never throws. */
function mixPushCheck() {
  try {
    const sh = mixSheet_(), n = sh.getLastRow();
    if (n < 2) return 0;
    const today = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd');
    const vals = sh.getRange(2, 1, n - 1, MIX_HEADERS.length).getValues();
    const phones = teamPushRows_();
    let sent = 0;
    vals.forEach((r, i) => {
      const date = r[1] instanceof Date ? Utilities.formatDate(r[1], 'America/New_York', 'yyyy-MM-dd') : String(r[1]).trim();
      const slug = String(r[4]).trim().toLowerCase();
      if (r[6] || date !== today || !slug || !r[5]) return;
      const toks = phones.filter(t => String(t.slug).toLowerCase() === slug);
      const body = deskFirst_(r[3]) + (r[2] ? ' at ' + r[2] : '') + ' · ' + String(r[5]);
      const ok = teamPushSend_(toks, 'Color mix reminder', body);
      sh.getRange(i + 2, 7).setValue(ok ? new Date().toISOString() : (toks.length ? 'Failed ' : 'No phone ') + new Date().toISOString());
      sent += ok;
    });
    return sent;
  } catch (e) { console.warn(e); return 0; }
}

/** Run once from the editor: makes the tab and switches on the 10-minute check. */
function installMixPush() {
  mixSheet_();
  ScriptApp.getProjectTriggers().filter(tr => tr.getHandlerFunction() === 'mixPushCheck').forEach(tr => ScriptApp.deleteTrigger(tr));
  ScriptApp.newTrigger('mixPushCheck').timeBased().everyMinutes(10).create();
  Logger.log('Color mix reminders are on (checked every 10 minutes).');
}
