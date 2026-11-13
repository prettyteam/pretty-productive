/**
 * Guest request alerts on staff phones (Alexandra, Nov 13 2026).
 * Each person turns alerts on in her Employee Experience App (My Profile, or the card on Home).
 * When a guest sends the Concierge form:
 *   - the people in CONCIERGE_ALL get every request,
 *   - every other artist gets a ping only when the guest picked her in "Who is taking care of you today?".
 * Uses the same free Firebase project as the Front Desk alerts (DeskPush.gs, FCM_PROJECT).
 * Banners show only the guest's first name and what she asked for.
 */
const TEAM_PUSH_TAB = 'Team phone alerts';
const TEAM_PUSH_HEADERS = ['App ID', 'Name', 'Token', 'Device', 'Added', 'Last sent'];
/* Every request goes to these apps (by App ID, or first name when the App ID differs). */
const CONCIERGE_ALL = ['amanda', 'ashley-b', 'adriana', 'sara', 'alexandra', 'carolyn', 'isabella', 'kat', 'rose'];
/* Team tab groups that are not artists (left off the guest's pick list). */
const NOT_ARTIST = /desk|front|office|admin|manager|owner|assistant|concierge|nanny/i;

function teamPushAll_(slug, name) {
  const s = String(slug || '').toLowerCase(), f = String(name || '').trim().split(/\s+/)[0].toLowerCase();
  return CONCIERGE_ALL.indexOf(s) >= 0 || (f && CONCIERGE_ALL.indexOf(f) >= 0);
}

function teamPushSheet_() {
  const ss = tss_();
  let sh = ss.getSheetByName(TEAM_PUSH_TAB);
  if (!sh) {
    sh = ss.insertSheet(TEAM_PUSH_TAB);
    sh.getRange(1, 1, 1, TEAM_PUSH_HEADERS.length).setValues([TEAM_PUSH_HEADERS]).setFontWeight('bold').setBackground('#121212').setFontColor('#f8f6f0');
    sh.setFrozenRows(1);
    sh.getRange('A:F').setNumberFormat('@');
  }
  return sh;
}

function teamPushRows_() {
  const sh = teamPushSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, TEAM_PUSH_HEADERS.length).getValues()
    .map((r, i) => ({ row: i + 2, slug: String(r[0]), name: String(r[1]), token: String(r[2]) })).filter(t => t.token);
}

/** Team app: save this phone for the signed-in person, or remove it (Turn off). */
function teamPushSave_(d) {
  const me = member_(d.slug, d.t);
  if (!me) return json_({ ok: false, error: 'link' });
  const token = String(d.token || '').trim();
  if (!token || token.length > 600) return json_({ ok: false });
  const sh = teamPushSheet_(), cur = teamPushRows_().find(t => t.token === token);
  if (cur) sh.deleteRow(cur.row);
  if (!d.off) sh.appendRow([me.slug, me.name, token, clean_(d.device, 60), new Date().toISOString(), '']);
  return json_({ ok: true, on: !d.off, all: teamPushAll_(me.slug, me.name) });
}

/** Sends one alert to the phones in toks. Never throws. */
function teamPushSend_(toks, title, body) {
  try {
    if (!toks.length) return 0;
    const url = 'https://fcm.googleapis.com/v1/projects/' + FCM_PROJECT + '/messages:send';
    const headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': FCM_PROJECT };
    const res = UrlFetchApp.fetchAll(toks.map(t => ({ url: url, method: 'post', contentType: 'application/json', headers: headers, muteHttpExceptions: true,
      payload: JSON.stringify({ message: { token: t.token,
        data: { title: String(title).slice(0, 100), body: String(body).slice(0, 180), tab: 'home' },
        webpush: { headers: { Urgency: 'high', TTL: '3600' } } } }) })));
    const sh = teamPushSheet_(), now = new Date().toISOString(), gone = [];
    let sent = 0;
    res.forEach((r, i) => {
      const code = r.getResponseCode(), text = r.getContentText();
      if (code === 200) { sent++; sh.getRange(toks[i].row, 6).setValue(now); }
      else if (code === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(text)) gone.push(toks[i].row);
      else console.warn('Team push failed (' + code + '): ' + text.slice(0, 300));
    });
    gone.sort((a, b) => b - a).forEach(r => sh.deleteRow(r));
    return sent;
  } catch (e) { console.warn(e); return 0; }
}

/** Active artists for the guest's pick list: [{a: App ID, n: first name}], first names made unique with a last initial. */
function conciergeArtistList_() {
  const vals = tvals_(TT.team).filter(r => r[1] && String(r[4]).toLowerCase() !== 'no' && !NOT_ARTIST.test(String(r[2])));
  const first = r => String(r[0]).trim().split(/\s+/)[0];
  const count = {};
  vals.forEach(r => { const f = first(r).toLowerCase(); count[f] = (count[f] || 0) + 1; });
  return vals.map(r => {
    const parts = String(r[0]).trim().split(/\s+/), f = parts[0];
    return { a: String(r[1]), n: count[f.toLowerCase()] > 1 && parts[1] ? f + ' ' + parts[1].charAt(0) + '.' : f };
  }).sort((x, y) => x.n.localeCompare(y.n));
}
function conciergeArtists_() {
  const c = CacheService.getScriptCache(), hit = c.get('concierge-artists');
  if (hit) return { ok: true, artists: JSON.parse(hit) };
  const list = conciergeArtistList_();
  c.put('concierge-artists', JSON.stringify(list), 600);
  return { ok: true, artists: list };
}

/** Concierge form came in: note the artist on the row, then ping the right phones. Never throws. */
function teamPushConcierge_(d, name, items) {
  try {
    const artist = clean_(d.artist, 60), list = artist ? conciergeArtistList_() : [];
    const pick = list.find(x => x.a === artist);
    const sh = tab_(TABS.concierge), col = TABS.concierge.headers.length + 1;
    if (sh.getRange(1, col).getValue() !== 'Artist') sh.getRange(1, col).setValue('Artist').setFontWeight('bold').setBackground('#423327').setFontColor('#f2f1ec');
    if (pick) sh.getRange(sh.getLastRow(), col).setValue(pick.n);
    const toks = teamPushRows_().filter(t => teamPushAll_(t.slug, t.name) || (pick && t.slug === pick.a));
    const title = pick ? 'Request from ' + pick.n + '’s guest' : 'New guest request';
    return teamPushSend_(toks, title, deskFirst_(name) + ' · ' + String(items).slice(0, 110));
  } catch (e) { console.warn(e); return 0; }
}

/** Editor check: who has alerts on right now. */
function listTeamPush() {
  teamPushRows_().forEach(t => Logger.log(t.name + ' (' + t.slug + ') · ' + (teamPushAll_(t.slug, t.name) ? 'every request' : 'her own guests')));
}

/** The Pretty Report / Pretty Life: who has guest alerts on. [{n: name, a: App ID, on: phones, all: true|false}] */
function teamPushStatus_() {
  try {
    const rows = teamPushRows_();
    return tvals_(TT.team).filter(r => r[1] && String(r[4]).toLowerCase() !== 'no')
      .map(r => ({ n: String(r[0]), a: String(r[1]), on: rows.filter(t => t.slug === String(r[1])).length, all: teamPushAll_(r[1], r[0]) }))
      .sort((x, y) => (y.all - x.all) || x.n.localeCompare(y.n));
  } catch (e) { console.warn(e); return []; }
}

/** Team app Home: today's guest requests (every request for CONCIERGE_ALL, her own guests for everyone else). Never throws. */
function teamPushReqs_(me) {
  try {
    const sh = tab_(TABS.concierge), n = sh.getLastRow(), col = TABS.concierge.headers.length + 1;
    if (n < 2) return [];
    const k = Math.min(n - 1, 150), vals = sh.getRange(n - k + 1, 1, k, col).getValues();
    const all = teamPushAll_(me.slug, me.name), mine = (conciergeArtistList_().find(x => x.a === me.slug) || {}).n;
    const today = day_(new Date());
    return vals.filter(r => r[0] instanceof Date && day_(r[0]) === today && (all || (mine && String(r[col - 1]) === mine)))
      .map(r => ({ at: r[0].getTime(), name: deskFirst_(r[1]), items: [r[2], r[3], r[4]].filter(String).join(', '), note: String(r[5] || ''),
        status: String(r[6] || 'New'), artist: String(r[col - 1] || '') })).reverse();
  } catch (e) { console.warn(e); return []; }
}
