/**
 * Wedding hours from the "Weddings at Taffeta" Google Calendar (info@), for weddings whose timeline
 * isn't built in the app yet. Match: same date, and the event title has a word of the bride's name.
 * Only the start and end time are used, never the event notes, guests or contact details.
 * Cached for 30 minutes.
 */
const WEDDING_CAL_ID = 'weddings@taffetadesign.com';   // shows as "Weddings at Taffeta" in info@'s Google Calendar
const WEDDING_CAL_NAME = 'Weddings at Taffeta';

function calTimes_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('calTimes');
  if (hit) return JSON.parse(hit);
  const out = {};
  try {
    const cal = CalendarApp.getCalendarById(WEDDING_CAL_ID) || CalendarApp.getCalendarsByName(WEDDING_CAL_NAME)[0];
    if (cal) {
      const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
      const from = new Date(Date.now() - 2 * 864e5), to = new Date(Date.now() + 500 * 864e5);
      const byDate = {};
      cal.getEvents(from, to).forEach(ev => {
        if (ev.isAllDayEvent()) return;
        const day = Utilities.formatDate(ev.getStartTime(), TZ, 'yyyy-MM-dd');
        (byDate[day] = byDate[day] || []).push({ title: String(ev.getTitle() || '').toLowerCase(),
          start: Utilities.formatDate(ev.getStartTime(), TZ, 'h:mma').toLowerCase(),
          end: Utilities.formatDate(ev.getEndTime(), TZ, 'h:mma').toLowerCase() });
      });
      weddings_().forEach(w => {
        const d = w.d;
        if (!d.date || d.date < today || !byDate[d.date]) return;
        const words = String(d.bride || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(x => x.length >= 3);
        const last = words[words.length - 1];   // last name first, so two brides with the same first name on one day don't mix
        const ev = (last && byDate[d.date].find(e => e.title.indexOf(last) >= 0)) || byDate[d.date].find(e => words.some(x => e.title.indexOf(x) >= 0));
        if (ev) out[d.id] = ev.start + '–' + ev.end;
      });
    }
  } catch (e) { console.warn(e); }
  cache.put('calTimes', JSON.stringify(out), 1800);
  return out;
}

/** Editor check: how many upcoming weddings got calendar hours, and a few examples. */
function checkCalTimes() {
  CacheService.getScriptCache().remove('calTimes');
  const ct = calTimes_(), ws = weddings_().map(w => w.d);
  Logger.log(Object.keys(ct).length + ' weddings have calendar hours');
  const cals = CalendarApp.getAllCalendars().map(c => c.getName());
  Logger.log('calendars: ' + cals.length + '; wedding calendar found: ' + !!CalendarApp.getCalendarById(WEDDING_CAL_ID) + '; names with "wedding": ' + cals.filter(n => /wedding/i.test(n)).join(', '));
  Object.keys(ct).slice(0, 8).forEach(id => { const w = ws.find(x => x.id === id) || {}; Logger.log(w.date + ' ' + w.bride + ': ' + ct[id]); });
}
