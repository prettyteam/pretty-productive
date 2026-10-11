/**
 * Keeps Flodesk's bride segments in step with HoneyBook. Flodesk's own HoneyBook connection
 * puts each new inquiry in "Inquired Brides". Once a bride on the HONEYBOOK BOOKINGS tab has
 * paid (see HONEYBOOK PAYMENTS), the hourly sync calls flodeskMoveBookedBrides_, which adds
 * her to "<year> Brides Who Booked" (made if missing) and takes her out of "Inquired Brides".
 * Nothing is emailed from here. The API key lives in the script property FLODESK_API_KEY.
 */
const FLODESK_INQUIRED = 'Inquired Brides';
const flodeskBookedName_ = year => year + ' Brides Who Booked';

function flodesk_(method, path, body) {
  const key = PropertiesService.getScriptProperties().getProperty('FLODESK_API_KEY');
  if (!key) throw new Error('FLODESK_API_KEY is not set');
  const res = UrlFetchApp.fetch('https://api.flodesk.com/v1' + path, {
    method: method, contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(key + ':'), 'User-Agent': 'Taffeta Weddings (info@taffetadesign.com)' },
    payload: body ? JSON.stringify(body) : undefined
  });
  const code = res.getResponseCode(), text = res.getContentText();
  if (code >= 300) throw new Error('Flodesk ' + method + ' ' + path + ': ' + code + ' ' + text.slice(0, 200));
  return text ? JSON.parse(text) : {};
}

/** Segment name -> id, for every segment in Flodesk. */
function flodeskSegments_() {
  const out = {};
  for (let page = 1; page < 50; page++) {
    const r = flodesk_('get', '/segments?per_page=100&page=' + page);
    (r.data || []).forEach(s => out[String(s.name).trim().toLowerCase()] = s.id);
    if (!r.meta || page >= (r.meta.total_pages || 1)) break;
  }
  return out;
}

function flodeskSegmentId_(segs, name) {
  const k = name.toLowerCase();
  if (!segs[k]) segs[k] = flodesk_('post', '/segments', { name: name, color: '#E8C4C4' }).id;
  return segs[k];
}

/** Run from the editor: lists Flodesk segments in the log, to check the key works. Changes nothing. */
function testFlodesk() {
  Logger.log(Object.keys(flodeskSegments_()).join(', '));
}

/** Moves paid brides from Inquired Brides to their year's Brides Who Booked, once each. */
function flodeskMoveBookedBrides_(book, hasPaid, dryRun) {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FLODESK_API_KEY')) return;
  const sh = book.getSheets().find(t => HONEYBOOK_TAB.test(t.getName().trim()));
  if (!sh) return;
  const vals = sh.getDataRange().getValues();
  const head = (vals[0] || []).map(h => String(h).trim().toUpperCase());
  const cB = head.indexOf('BRIDE'), cD = head.indexOf('DATE'), cE = head.indexOf('EMAIL');
  if (cB < 0 || cD < 0 || cE < 0) return;
  const done = new Set(JSON.parse(props.getProperty('FLODESK_DONE') || '[]'));
  let segs = null;
  vals.slice(1).forEach(r => {
    const email = String(r[cE] || '').trim().toLowerCase();
    const bride = String(r[cB] || '').replace(/\s+/g, ' ').trim().replace(/\s+(project|wedding)$/i, '');
    const date = sheetDate_(r[cD], 0);
    if (!email || !date || done.has(email) || !hasPaid(bride.toLowerCase(), email)) return;
    const segName = flodeskBookedName_(date.slice(0, 4));
    if (dryRun) { Logger.log('Flodesk: would move ' + bride + ' to ' + segName); return; }
    try {
      segs = segs || flodeskSegments_();
      const parts = bride.split(' ');
      flodesk_('post', '/subscribers', { email: email, first_name: parts[0], last_name: parts.slice(1).join(' '),
        segment_ids: [flodeskSegmentId_(segs, segName)] });
      const inq = segs[FLODESK_INQUIRED.toLowerCase()];
      if (inq) flodesk_('delete', '/subscribers/' + encodeURIComponent(email) + '/segments', { segment_ids: [inq] });
      done.add(email);
      Logger.log('Flodesk: moved ' + bride + ' to ' + segName);
    } catch (e) {
      Logger.log('Flodesk: could not move ' + bride + ' (will retry next hour): ' + e.message);
    }
  });
  if (!dryRun) props.setProperty('FLODESK_DONE', JSON.stringify([...done]));
}
