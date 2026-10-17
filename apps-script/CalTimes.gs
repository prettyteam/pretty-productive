/**
 * Wedding hours from the "Weddings at Taffeta" Google Calendar (info@), for weddings whose timeline
 * isn't built in the app yet. Match: same date, and the event title has a word of the bride's name.
 * Only the start and end time are used, never the event notes, guests or contact details.
 * Cached for 30 minutes.
 */
const WEDDING_CAL_ID = 'weddings@taffetadesign.com';   // shows as "Weddings at Taffeta" in info@'s Google Calendar
const WEDDING_CAL_NAME = 'Weddings at Taffeta';

/** Calendar details per wedding id: { time, place, note, team:[{name, status, known}] }. Cached 30 minutes. */
function calInfo_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('calInfo');
  if (hit) return JSON.parse(hit);
  const out = {};
  try {
    const cal = CalendarApp.getCalendarById(WEDDING_CAL_ID) || CalendarApp.getCalendarsByName(WEDDING_CAL_NAME)[0];
    if (cal) {
      const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
      const from = new Date(Date.now() - 2 * 864e5), to = new Date(Date.now() + 500 * 864e5);
      const byEmail = {};
      members_().forEach(m => { if (m.email) byEmail[String(m.email).toLowerCase()] = m.preferredName || m.legalName; });
      const byDate = {};
      cal.getEvents(from, to).forEach(ev => {
        /* all-day wedding events count too: linked for the notes and headcount, no hours (Oct 16 2026) */
        const day = Utilities.formatDate(ev.getStartTime(), TZ, 'yyyy-MM-dd');
        (byDate[day] = byDate[day] || []).push({ ev: ev, title: String(ev.getTitle() || '').toLowerCase() });
      });
      weddings_().forEach(w => {
        const d = w.d;
        if (!d.date || d.date < today || !byDate[d.date]) return;
        const words = String(d.bride || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(x => x.length >= 3);
        const last = words[words.length - 1];   // last name first, so two brides with the same first name on one day don't mix
        /* a one-letter typo or swapped letters ("Hugdins" / "Hudgins", "Isabella" / "Isabelle") still links (Oct 16 2026) */
        const near = (x, t) => t.replace(/[^a-z\s]/g, ' ').split(/\s+/).some(y => y.length >= 4 && x.length >= 4 && typoDist_(x, y) <= 1);
        const hitEv = (last && byDate[d.date].find(e => e.title.indexOf(last) >= 0)) || byDate[d.date].find(e => words.some(x => e.title.indexOf(x) >= 0))
          || (last && byDate[d.date].find(e => near(last, e.title))) || byDate[d.date].find(e => words.some(x => near(x, e.title)));
        if (!hitEv) return;
        const ev = hitEv.ev;
        const team = ev.getGuestList().map(g => {
          const email = String(g.getEmail() || '').toLowerCase();
          if (email === WEDDING_CAL_ID) return null;
          const st = String(g.getGuestStatus());
          return { name: byEmail[email] || '', known: !!byEmail[email],
            status: st === 'YES' ? 'yes' : st === 'NO' ? 'no' : st === 'MAYBE' ? 'maybe' : 'waiting' };
        }).filter(Boolean);
        out[d.id] = {
          time: ev.isAllDayEvent() ? '' : Utilities.formatDate(ev.getStartTime(), TZ, 'h:mma').toLowerCase() + '–' + Utilities.formatDate(ev.getEndTime(), TZ, 'h:mma').toLowerCase(),
          place: String(ev.getLocation() || '').slice(0, 200),
          note: calNote_(ev.getDescription()),
          team: team
        };
      });
    }
  } catch (e) { console.warn(e); }
  cache.put('calInfo', JSON.stringify(out), 1800);
  return out;
}

/** The event note as plain text, with emails, phone numbers and links taken out. */
function calNote_(html) {
  return String(html || '').replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&quot;/g, "'")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email hidden]')
    .replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[phone hidden]')
    .replace(/https?:\/\/\S+/g, '[link hidden]')
    .split('\n').map(x => x.trim()).filter(Boolean).join('\n').slice(0, 1200);
}

/** Just the hours, for job offers and the wedding list. */
function calTimes_() {
  const info = calInfo_(), out = {};
  Object.keys(info).forEach(id => { out[id] = info[id].time; });
  return out;
}

/** What an artist sees: no RSVPs, no guests who aren't on the team. */
function calInfoForArtist_(c, myName) {
  const me = c && myName ? c.team.find(t => t.known && t.name === myName) : null;   // her own answer only, never anyone else's
  return c && { time: c.time, place: c.place, note: c.note, mine: me ? me.status : '', team: c.team.filter(t => t.known && t.status !== 'no').map(t => ({ name: t.name })) };
}

/** Editor check: how many upcoming weddings got calendar hours, and a few examples. */
function checkCalTimes() {
  CacheService.getScriptCache().remove('calInfo');
  const ct = calTimes_(), ws = weddings_().map(w => w.d);
  Logger.log(Object.keys(ct).length + ' weddings have calendar hours');
  const cals = CalendarApp.getAllCalendars().map(c => c.getName());
  Logger.log('calendars: ' + cals.length + '; wedding calendar found: ' + !!CalendarApp.getCalendarById(WEDDING_CAL_ID) + '; names with "wedding": ' + cals.filter(n => /wedding/i.test(n)).join(', '));
  Object.keys(ct).slice(0, 8).forEach(id => { const w = ws.find(x => x.id === id) || {}; Logger.log(w.date + ' ' + w.bride + ': ' + ct[id]); });
  const ci = calInfo_(), id = Object.keys(ci)[0];
  if (id) Logger.log('example: ' + JSON.stringify({ time: ci[id].time, note: ci[id].note, team: ci[id].team }) + ' | artist view: ' + JSON.stringify(calInfoForArtist_(ci[id]).team));
}


/** Edit distance with swapped neighbors counted as one change ("hugdins" vs "hudgins" = 1). */
function typoDist_(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 9;
  const d = [];
  for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
