/**
 * Bridal skin consult emails (Alexandra, Nov 17 2026).
 * Every booked (paid) bride gets Taffeta Spa emails asking her to book her bridal skin consult
 * (the 1-hour Taffeta Facial with the take-home Skin Box) before her preview and wedding day.
 *
 * The emails themselves live in two Flodesk workflows that Alexandra's team builds once in Flodesk:
 *   "Bridal Skin 1 - After Booking"  -> Email 1 the next day, Email 2 three weeks later
 *   "Bridal Skin 2 - Before Preview" -> Email 3 right away, Email 4 two weeks later
 * The hourly sheet check calls bridalSkinSync_, which:
 *   - adds each paid bride (HONEYBOOK BOOKINGS) with a wedding 8+ weeks away to workflow 1, once;
 *   - 8 weeks before her preview (or 4 months before the wedding when no preview is on the
 *     calendar) adds her to workflow 2, once, and takes her out of workflow 1 so emails never pile up;
 *   - skips any bride in the Flodesk segment "Skin consult booked".
 * Nothing happens until both workflows are ACTIVE in Flodesk, so no bride is added early.
 * Mock-up of the emails: https://claude.ai/artifact/3rgY7ZpABvZ54ZW9mLdRAS
 */
const BRIDAL_SKIN_WF1 = 'bridal skin 1 - after booking';
const BRIDAL_SKIN_WF2 = 'bridal skin 2 - before preview';
const BRIDAL_SKIN_SKIP = 'skin consult booked';
const DAY_MS_ = 864e5;

/** Active Flodesk workflow name (lower case) -> id. */
function flodeskActiveWorkflows_() {
  const out = {};
  for (let page = 1; page < 20; page++) {
    const r = flodesk_('get', '/workflows?statuses=active&perPage=100&page=' + page);
    (r.data || []).forEach(w => out[String(w.name).trim().toLowerCase()] = w.id);
    if (!r.meta || page >= (r.meta.total_pages || 1)) break;
  }
  return out;
}

function ymdAdd_(ymd, days) {
  const d = new Date(ymd + 'T12:00:00Z');
  return Utilities.formatDate(new Date(d.getTime() + days * DAY_MS_), 'UTC', 'yyyy-MM-dd');
}

/** The bride's preview date (yyyy-MM-dd) from the calendar, or '' when none is booked. */
function bridalPreviewDate_(events, bride, email, wedding) {
  const last = (bride.toLowerCase().match(/[a-z]{3,}/g) || []).pop();
  const hit = events.filter(ev => {
    const day = Utilities.formatDate(new Date(ev.start), TZ, 'yyyy-MM-dd');
    if (day > wedding) return false;
    return (email && (ev.guests || []).indexOf(email) >= 0) || (last && ev.title.toLowerCase().indexOf(last) >= 0);
  }).map(ev => Utilities.formatDate(new Date(ev.start), TZ, 'yyyy-MM-dd')).sort();
  return hit.length ? hit[hit.length - 1] : '';
}

function bridalSkinSync_(book, hasPaid, dryRun) {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FLODESK_API_KEY')) return;
  const sh = book.getSheets().find(t => HONEYBOOK_TAB.test(t.getName().trim()));
  if (!sh) return;
  const wfs = flodeskActiveWorkflows_();
  const wf1 = wfs[BRIDAL_SKIN_WF1], wf2 = wfs[BRIDAL_SKIN_WF2];
  if (!wf1 || !wf2) { Logger.log('Bridal skin: waiting for both Flodesk workflows to be turned on.'); return; }
  const skipSeg = flodeskSegments_()[BRIDAL_SKIN_SKIP];
  const vals = sh.getDataRange().getValues();
  const head = (vals[0] || []).map(h => String(h).trim().toUpperCase());
  const cB = head.indexOf('BRIDE'), cD = head.indexOf('DATE'), cE = head.indexOf('EMAIL');
  if (cB < 0 || cD < 0 || cE < 0) return;
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const one = JSON.parse(props.getProperty('BRIDAL_SKIN_1') || '{}');   // email -> day added to workflow 1
  const two = JSON.parse(props.getProperty('BRIDAL_SKIN_2') || '{}');   // email -> day added to workflow 2
  let events = null;
  const consultBooked = email => {
    if (!skipSeg) return false;
    const s = flodesk_('get', '/subscribers/' + encodeURIComponent(email));
    return (s.segments || []).some(x => x.id === skipSeg);
  };
  vals.slice(1).forEach(r => {
    const email = String(r[cE] || '').trim().toLowerCase();
    const bride = String(r[cB] || '').replace(/\s+/g, ' ').trim().replace(/\s+(project|wedding)$/i, '');
    const wedding = sheetDate_(r[cD], 0);
    if (!email || !wedding || wedding <= today || two[email] || /cancel/i.test(bride)) return;
    if (!hasPaid(bride.toLowerCase(), email)) return;
    try {
      if (!one[email]) {
        if (ymdAdd_(today, 56) > wedding) { one[email] = 'skipped'; return; }   // booked too close to the wedding for skin prep emails
        if (consultBooked(email)) { one[email] = two[email] = 'consult'; return; }
        if (dryRun) { Logger.log('Bridal skin: would start ' + bride); return; }
        flodesk_('post', '/workflows/' + wf1 + '/subscribers', { email: email });
        one[email] = today;
        Logger.log('Bridal skin: started emails 1-2 for ' + bride);
        return;
      }
      if (one[email] === 'skipped') return;
      events = events || previewEvents_();
      const preview = bridalPreviewDate_(events, bride, email, wedding);
      const start = preview ? ymdAdd_(preview, -56) : ymdAdd_(wedding, -120);
      const stop = ymdAdd_(preview || wedding, -14);
      if (today < start || today > stop) return;
      if (/^\d{4}-/.test(one[email]) && ymdAdd_(one[email], 7) > today) return;   // never two emails in the same week
      if (consultBooked(email)) { two[email] = 'consult'; return; }
      if (dryRun) { Logger.log('Bridal skin: would send preview emails to ' + bride); return; }
      flodesk_('post', '/workflows/' + wf2 + '/subscribers', { email: email });
      try { flodesk_('delete', '/workflows/' + wf1 + '/subscribers/' + encodeURIComponent(email)); } catch (_) {}   // already finished workflow 1
      two[email] = today;
      Logger.log('Bridal skin: started emails 3-4 for ' + bride + (preview ? ' (preview ' + preview + ')' : ''));
    } catch (e) {
      Logger.log('Bridal skin: could not update ' + bride + ' (will retry next hour): ' + e.message);
    }
  });
  if (!dryRun) {
    props.setProperty('BRIDAL_SKIN_1', JSON.stringify(one));
    props.setProperty('BRIDAL_SKIN_2', JSON.stringify(two));
  }
}

/** Run from the editor: shows who would get bridal skin emails right now. Changes nothing. */
function testBridalSkin() {
  const book = SpreadsheetApp.openById(BOOKINGS_SHEET_ID);
  const paid = paidClients_(book);
  bridalSkinSync_(book, (bride, email) => (email && paid.emails.has(email)) || paid.names.has(bride.toLowerCase()), true);
}
