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
        if (ev.isAllDayEvent()) return;
        const day = Utilities.formatDate(ev.getStartTime(), TZ, 'yyyy-MM-dd');
        (byDate[day] = byDate[day] || []).push({ ev: ev, title: String(ev.getTitle() || '').toLowerCase() });
      });
      weddings_().forEach(w => {
        const d = w.d;
        if (!d.date || d.date < today || !byDate[d.date]) return;
        const words = String(d.bride || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(x => x.length >= 3);
        const last = words[words.length - 1];   // last name first, so two brides with the same first name on one day don't mix
        const hitEv = (last && byDate[d.date].find(e => e.title.indexOf(last) >= 0)) || byDate[d.date].find(e => words.some(x => e.title.indexOf(x) >= 0));
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
          time: Utilities.formatDate(ev.getStartTime(), TZ, 'h:mma').toLowerCase() + '–' + Utilities.formatDate(ev.getEndTime(), TZ, 'h:mma').toLowerCase(),
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
function calInfoForArtist_(c) {
  return c && { time: c.time, place: c.place, note: c.note, team: c.team.filter(t => t.known && t.status !== 'no').map(t => ({ name: t.name })) };
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
