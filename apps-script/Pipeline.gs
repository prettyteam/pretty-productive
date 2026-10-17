/**
 * Pipeline tab (office only): brides who haven't paid yet, read from the TAFFETA WEDDINGS sheet.
 *   - PIPELINE tab: a snapshot of HoneyBook leads, rewritten each time "run bride follow-ups" runs
 *     (BRIDE, DATE, LOCATION, STAGE, LAST CONTACT, NEXT STEP, UPDATED, INQUIRED = the day the HoneyBook project was created).
 *   - The list shows the newest inquiries first (Alexandra, Oct 17 2026); a lead with no inquiry date yet is new, so it goes on top.
 *     Inquiry dates come from the INQUIRED column or the HoneyBook list saved in script properties (HB_INQUIRED).
 *   - HONEYBOOK BOOKINGS rows with no payment yet on HONEYBOOK PAYMENTS show as "Signed, waiting on payment".
 * "Mark paid" in the app adds a row to the PAID IN APP tab and puts an upcoming wedding straight into
 * Booked weddings. HoneyBook itself can't be changed from here: the "mark bride paid" skill on
 * Alexandra's Mac marks those payments in HoneyBook and fills in the IN HONEYBOOK column.
 */
const PIPELINE_TAB = 'PIPELINE';
const PAID_IN_APP_TAB = 'PAID IN APP';
const PAID_IN_APP_HEADERS = ['BRIDE', 'WEDDING DATE', 'LOCATION', 'AMOUNT', 'METHOD', 'PAID ON', 'MARKED BY', 'MARKED AT', 'IN HONEYBOOK'];
const PAY_METHODS = ['Venmo', 'Zelle', 'Cash', 'Check', 'Card'];

function tabRows_(book, name) {
  const sh = book.getSheets().find(t => t.getName().trim().toUpperCase() === name);
  if (!sh) return [];
  const vals = sh.getDataRange().getValues();
  const head = (vals[0] || []).map(h => String(h).trim().toUpperCase());
  return vals.slice(1).map(r => {
    const o = {};
    head.forEach((h, i) => o[h] = r[i] instanceof Date ? r[i] : String(r[i] == null ? '' : r[i]).replace(/\s+/g, ' ').trim());
    return o;
  });
}

const brideName_ = s => String(s || '').replace(/\s+/g, ' ').trim().replace(/\s+(project|wedding)$/i, '');

function pipeline_() {
  const book = SpreadsheetApp.openById(BOOKINGS_SHEET_ID);
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const paid = paidClients_(book);
  const isPaid = (bride, email) => (email && paid.emails.has(email.toLowerCase())) || paid.names.has(bride.toLowerCase());
  const day = v => v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v || '');
  const rows = [], seen = new Set(), inquired = {};
  tabRows_(book, PIPELINE_TAB).forEach(r => { const b = brideName_(r.BRIDE).toLowerCase(), d = sheetDate_(r.INQUIRED, 0); if (b && d) inquired[b] = d; });
  const hb = hbInquired_();
  const inq = (bride, date) => inquired[bride.toLowerCase()] || inquiredFrom_(hb, bride, date);
  tabRows_(book, 'HONEYBOOK BOOKINGS').forEach(r => {
    const bride = brideName_(r.BRIDE), date = sheetDate_(r.DATE, 0);
    if (!bride || (date && date < today) || isPaid(bride, r.EMAIL)) return;
    seen.add(bride.toLowerCase());
    rows.push({ bride: bride, date: date, location: r.LOCATION || '', stage: 'Signed, waiting on payment', lastContact: sheetDate_(r['BOOKED ON'], 0), inquired: inq(bride, date), nextStep: 'Remind her the deposit holds her date' });
  });
  let updated = '';
  tabRows_(book, PIPELINE_TAB).forEach(r => {
    const bride = brideName_(r.BRIDE), date = sheetDate_(r.DATE, 0);
    updated = updated || day(r.UPDATED);
    if (!bride || seen.has(bride.toLowerCase()) || (date && date < today) || isPaid(bride, '')) return;
    rows.push({ bride: bride, date: date, location: r.LOCATION || '', stage: r.STAGE || '', lastContact: day(r['LAST CONTACT']), inquired: inq(bride, date), nextStep: r['NEXT STEP'] || '' });
  });
  rows.sort((a, b) => (b.inquired || '9999').localeCompare(a.inquired || '9999') || (a.date || '9999').localeCompare(b.date || '9999'));   // no inquiry date yet = a new lead, so it goes on top
  const cutoff = new Date(Date.now() - 45 * 864e5);
  const marked = tabRows_(book, PAID_IN_APP_TAB).filter(r => r.BRIDE && (!(r['MARKED AT'] instanceof Date) || r['MARKED AT'] > cutoff))
    .map(r => ({ bride: r.BRIDE, date: day(r['WEDDING DATE']), amount: r.AMOUNT, method: r.METHOD, paidOn: day(r['PAID ON']), inHoneyBook: day(r['IN HONEYBOOK']) }))
    .reverse();
  return { ok: true, rows: rows, marked: marked, updated: updated };
}

/** HoneyBook inquiry dates (the day each project was created), saved in script properties as [name, inquired, wedding date] rows. */
function hbInquired_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('HB_INQUIRED') || '[]'); } catch (e) { return []; }
}
function inquiredFrom_(list, bride, date) {
  const w = s => String(s || '').toLowerCase().replace(/['\u2019]s\b.*$/, '').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(x => x.length >= 2);
  const b = w(bride);
  if (!b.length) return '';
  const first = b[0], last = b[b.length - 1];
  let best = '';
  list.forEach(r => {
    const n = w(r[0]);
    if (!n.length) return;
    const same = n.join(' ') === b.join(' ');
    const both = b.length > 1 && n.indexOf(first) >= 0 && n.indexOf(last) >= 0;
    const lastAndDate = date && r[2] === date && n.indexOf(last) >= 0 && last.length >= 3;
    const firstAndDate = date && r[2] === date && n[0] === first && first.length >= 3;   // a misspelled last name (Durolli / Durellari)
    if ((same || both || lastAndDate || firstAndDate) && r[1] > best) best = r[1];
  });
  return best;
}

/** Saves the HoneyBook inquiry dates sent from Claude (rows of [name, inquired, wedding date]). */
function saveHbInquired_(rows) {
  const clean = (rows || []).filter(r => Array.isArray(r) && r[0] && /^\d{4}-\d{2}-\d{2}$/.test(r[1] || ''))
    .map(r => [String(r[0]).slice(0, 80), r[1], /^\d{4}-\d{2}-\d{2}$/.test(r[2] || '') ? r[2] : '']);
  PropertiesService.getScriptProperties().setProperty('HB_INQUIRED', JSON.stringify(clean));
  return clean.length;
}

function markPaid_(p) {
  p = p || {};
  const bride = clean_(brideName_(p.bride), 120), method = PAY_METHODS.indexOf(p.method) >= 0 ? p.method : '';
  const amount = Number(String(p.amount || '').replace(/[$,\s]/g, ''));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : '';
  const paidOn = /^\d{4}-\d{2}-\d{2}$/.test(p.paidOn || '') ? p.paidOn : Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  if (!bride || !method || !(amount > 0) || amount > 100000) return { ok: false, error: 'bad_request', message: 'Add the amount and how she paid.' };
  const book = SpreadsheetApp.openById(BOOKINGS_SHEET_ID);
  let sh = book.getSheets().find(t => t.getName().trim().toUpperCase() === PAID_IN_APP_TAB);
  if (!sh) {
    sh = book.insertSheet(PAID_IN_APP_TAB);
    sh.getRange(1, 1, 1, PAID_IN_APP_HEADERS.length).setValues([PAID_IN_APP_HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:I').setNumberFormat('@');
  }
  sh.appendRow([bride, date, clean_(p.location, 200), amount.toFixed(2), method, paidOn, 'Office (app)', new Date().toISOString(), '']);
  let added = false;
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const words = String(bride).toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  if (date && date >= today && !weddings_().some(w => w.d.date === date && words.some(x => String(w.d.bride || '').toLowerCase().indexOf(x) >= 0 || String(w.d.bride || '').toLowerCase().split(/[^a-z]+/).some(y => x.length >= 4 && y.length >= 4 && typoDist_(x, y) <= 1)))) {
    saveWedding_({ id: 'wsync' + date.replace(/-/g, '') + (words.pop() || 'bride'), bride: bride, date: date, location: clean_(p.location, 200),
      notes: 'Added when the office marked her paid in the app (' + method + '). Fill in the party, team and times here.' });
    added = true;
  }
  return { ok: true, added: added };
}
