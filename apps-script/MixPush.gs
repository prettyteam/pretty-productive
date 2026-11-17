/**
 * Color mix reminders on artists' phones (Alexandra, Nov 17 2026).
 * Guests on the Team Hub "Mix Watch" tab have had their color mixes undercharged more than once.
 * Each morning the daily Pretty Productive update adds a Front Desk To Do row for every booked Mix Watch guest
 * (List "Color mix check", Detail "<time> with <artist>: bowls run …, ring … ($…). …"). deskTodoCheck() already
 * pushes that row to the Front Desk. Every 10 minutes mixPushCheck() sends the same reminder to that artist's
 * phones (same phones as the guest request alerts, TeamPush.gs). Rows it has handled are remembered for 3 days,
 * so nobody gets the same reminder twice.
 * Setup once from the editor: run installMixPush.
 */
const MIX_LIST = 'Color mix check';

/** Team tab artist whose first name (or "First L.") matches the name in the To Do detail. */
function mixArtistSlug_(name) {
  const want = String(name || '').trim().toLowerCase().replace(/\.$/, '');
  if (!want) return '';
  const rows = tvals_(TT.team).filter(r => r[1] && String(r[4]).toLowerCase() !== 'no');
  const full = r => String(r[0]).trim().toLowerCase();
  let hit = rows.filter(r => full(r) === want || String(r[1]).toLowerCase() === want);
  if (!hit.length) hit = rows.filter(r => full(r).split(/\s+/)[0] === want.split(/\s+/)[0] &&
    (want.split(/\s+/).length < 2 || (full(r).split(/\s+/)[1] || '').charAt(0) === want.split(/\s+/)[1].charAt(0)));
  return hit.length === 1 ? String(hit[0][1]) : '';
}

function mixPushCheck() {
  try {
    const t = TABS.todo, sh = tab_(t), n = sh.getLastRow();
    if (n < 2) return 0;
    const props = PropertiesService.getScriptProperties();
    const done = JSON.parse(props.getProperty('MIX_PUSH_DONE') || '{}'), cut = Date.now() - 3 * 864e5;
    Object.keys(done).forEach(k => { if (done[k] < cut) delete done[k]; });
    const iList = t.keys.indexOf('group'), iGuest = t.keys.indexOf('guest'), iDetail = t.keys.indexOf('detail'), iStatus = t.keys.indexOf('status');
    const vals = sh.getRange(2, 1, n - 1, t.headers.length).getValues();
    let phones = null, sent = 0;
    vals.forEach(r => {
      const at = r[0] instanceof Date ? r[0].getTime() : 0;
      if (!at || at < cut || String(r[iList]).trim() !== MIX_LIST || String(r[iStatus]) === 'Done') return;
      const key = at + '|' + r[iGuest];
      if (done[key]) return;
      done[key] = Date.now();
      const detail = String(r[iDetail] || ''), m = detail.match(/^(.*?)\s+with\s+([^:]+):\s*(.*)$/);
      const slug = m ? mixArtistSlug_(m[2]) : '';
      if (!slug) { console.warn('Mix reminder: no artist found in "' + detail.slice(0, 80) + '"'); return; }
      phones = phones || teamPushRows_();
      const toks = phones.filter(p => String(p.slug).toLowerCase() === slug.toLowerCase());
      sent += teamPushSend_(toks, 'Color mix reminder', deskFirst_(r[iGuest]) + ' at ' + m[1] + ' · ' + m[3]);
    });
    props.setProperty('MIX_PUSH_DONE', JSON.stringify(done));
    return sent;
  } catch (e) { console.warn(e); return 0; }
}

/** Run once from the editor: switches on the 10-minute check. */
function installMixPush() {
  ScriptApp.getProjectTriggers().filter(tr => tr.getHandlerFunction() === 'mixPushCheck').forEach(tr => ScriptApp.deleteTrigger(tr));
  ScriptApp.newTrigger('mixPushCheck').timeBased().everyMinutes(10).create();
  Logger.log('Color mix reminders are on (checked every 10 minutes).');
}
