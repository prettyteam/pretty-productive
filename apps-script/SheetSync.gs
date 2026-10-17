/**
 * Brings new bookings from the TAFFETA WEDDINGS sheet (info@ Drive) into the app.
 * Every hour it reads the year tabs ("2026 WEDDINGS", "2027 Weddings", ...) and adds any
 * upcoming wedding that isn't in the app yet. It never changes or removes weddings
 * already in the app, and skips rows marked CANCELLED or GROOM. A wedding deleted in the
 * app is not added back.
 * It also reads a "HONEYBOOK BOOKINGS" tab, where a Zapier zap adds each newly booked
 * HoneyBook project (BRIDE, DATE, LOCATION); the year comes from the date there.
 * Run installSheetSync once from the editor to switch the hourly check on.
 */
const BOOKINGS_SHEET_ID = '19kl0X_Qzh5bG6HQGaLILaQCDlBJgEZ3vcRlMNc3vwmU';
const HONEYBOOK_TAB = /^honeybook bookings$/i;
const PAYMENTS_TAB = /^honeybook payments$/i;

function previewSheetSync() { return syncFromWeddingsSheet_(true); }   // logs what would be added, adds nothing

/** Run once from the editor: switches on the hourly check (and runs it once now). */
function installSheetSync() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncFromWeddingsSheet')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncFromWeddingsSheet').timeBased().everyHours(1).create();
  Logger.log('Hourly sheet check is on.');
  syncFromWeddingsSheet();
}

function syncFromWeddingsSheet() { return syncFromWeddingsSheet_(false); }

function syncFromWeddingsSheet_(dryRun) {
  ensureSetup_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
    const thisYear = Number(today.slice(0, 4));
    const have = weddings_().map(x => x.d);
    const words = s => String(s || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
    const inApp = (date, bride) => have.some(d => d.date === date &&
      words(bride).some(w => String(d.bride || '').toLowerCase().indexOf(w) >= 0 || words(d.bride).some(y => w.length >= 4 && y.length >= 4 && typoDist_(w, y) <= 1)));   // a one-letter typo is the same bride (Hugdins / Hudgins, Oct 16 2026)
    const added = [], book = SpreadsheetApp.openById(BOOKINGS_SHEET_ID);
    const paid = paidClients_(book);
    const hasPaid = (bride, email) => (email && paid.emails.has(email)) || paid.names.has(bride.toLowerCase());
    book.getSheets().forEach(sh => {
      const m = sh.getName().trim().match(/^(\d{4})\s+weddings$/i);
      // HONEYBOOK BOOKINGS and the PIPELINE list (leads signed before the zap existed) only add a bride once she has paid
      const hb = HONEYBOOK_TAB.test(sh.getName().trim()) || /^pipeline$/i.test(sh.getName().trim());
      const pipe = /^pipeline$/i.test(sh.getName().trim());
      if (!hb && (!m || Number(m[1]) < thisYear)) return;
      const year = hb ? thisYear : Number(m[1]);
      const vals = sh.getDataRange().getValues();
      if (vals.length < 2) return;
      const head = vals[0].map(h => String(h).trim().toUpperCase());
      const cB = head.indexOf('BRIDE'), cD = head.indexOf('DATE'), cL = head.indexOf('LOCATION'), cE = head.indexOf('EMAIL');
      if (cB < 0 || cD < 0) return;
      const seenKey = 'SYNC_SEEN_' + (pipe ? 'PIPE' : hb ? 'HB' : year), props = PropertiesService.getScriptProperties();
      const seen = new Set(JSON.parse(props.getProperty(seenKey) || '[]'));   // rows already looked at, so a wedding deleted in the app isn't added back
      vals.slice(1).forEach(r => {
        const bride = String(r[cB] || '').replace(/\s+/g, ' ').trim().replace(/\s+(project|wedding)$/i, '');
        if (!bride || /cancel|groom/i.test(bride)) return;
        const date = sheetDate_(r[cD], year);
        if (!date) return;
        const key = date + '|' + bride.toLowerCase();
        if (seen.has(key)) return;
        if (hb && !hasPaid(bride.toLowerCase(), cE >= 0 ? String(r[cE] || '').trim().toLowerCase() : '')) return;   // signed but no payment yet: check again next hour
        if (!dryRun) seen.add(key);
        if (date < today || inApp(date, bride)) return;
        const loc = cL >= 0 ? String(r[cL] || '').replace(/\s+/g, ' ').trim() : '';
        added.push(date + ' ' + bride);
        if (dryRun) return;
        const last = words(bride).pop() || 'bride';
        saveWedding_({ id: 'wsync' + date.replace(/-/g, '') + last, bride: bride, date: date, location: loc,
          notes: 'Added automatically from the TAFFETA WEDDINGS sheet (' + sh.getName().trim() + ' tab). Fill in the party, team and times here.' });
        have.push({ date: date, bride: bride });
        pushOffice_('New booking', bride + ' · ' + fullDate_(date), 'booked');
      });
      if (!dryRun) props.setProperty(seenKey, JSON.stringify([...seen]));
    });
    flodeskMoveBookedBrides_(book, hasPaid, dryRun);
    if (!dryRun) try { flushPush_(); } catch (e) { console.warn(e); }
    Logger.log((dryRun ? 'Would add ' : 'Added ') + added.length + ' new weddings' + (added.length ? ': ' + added.join('; ') : '.'));
    return added.length;
  } finally {
    lock.releaseLock();
  }
}

/** Emails and names of clients with at least one payment on the HONEYBOOK PAYMENTS or PAID IN APP tab. */
function paidClients_(book) {
  const out = { emails: new Set(), names: new Set() };
  book.getSheets().filter(t => PAYMENTS_TAB.test(t.getName().trim()) || /^paid in app$/i.test(t.getName().trim()))
    .forEach(sh => addPaid_(out, sh));
  return out;
}

function addPaid_(out, sh) {
  const vals = sh.getDataRange().getValues();
  const head = (vals[0] || []).map(h => String(h).trim().toUpperCase());
  const cB = head.indexOf('BRIDE'), cE = head.indexOf('EMAIL'), cP = head.indexOf('PROJECT');
  const real = v => { const t = String(v || '').replace(/\s+/g, ' ').trim(); return /^(n\/?a|none|-)$/i.test(t) ? '' : t; };
  vals.slice(1).forEach(r => {
    if (cE >= 0 && real(r[cE])) out.emails.add(real(r[cE]).toLowerCase());
    if (cB >= 0 && real(r[cB])) out.names.add(real(r[cB]).toLowerCase());
    // hand-marked HoneyBook payments can come through with the name as "N/A": use the project name ("Jane Doe's Project")
    if (cP >= 0 && real(r[cP])) out.names.add(real(r[cP]).replace(/['\u2019]s?\s+(project|wedding)$/i, '').replace(/\s+(project|wedding)$/i, '').trim().toLowerCase());
  });
}

/** "2/21/2026", "3/21/26", "1/31" (year from the tab), "May 1, 2027" or a real date -> "yyyy-MM-dd". */
function sheetDate_(v, year) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const m = String(v || '').trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) {
    const iso = String(v || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);   // the calendar date as written, not shifted by time zone
    if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
    const n = String(v == null ? '' : v).trim();
    if (/^\d{5}(\.\d+)?$/.test(n) && Number(n) > 30000 && Number(n) < 80000) {   // a spreadsheet day number, e.g. 46508 = May 1, 2027 (Zapier, Kathleen Saxman, Oct 17 2026)
      const u = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(n)) * 864e5);
      return Utilities.formatDate(u, 'UTC', 'yyyy-MM-dd');
    }
    const t = new Date(n);   // "2027-05-01T00:00:00", "May 1, 2027" from Zapier
    const out = /\d{4}/.test(n) && !isNaN(t) ? Utilities.formatDate(t, TZ, 'yyyy-MM-dd') : '';
    return /^20\d\d-/.test(out) ? out : '';   // never a made-up year
  }
  let y = m[3] ? Number(m[3]) : year;
  if (y < 100) y += 2000;
  const mo = Number(m[1]), d = Number(m[2]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}


/** One time (Oct 17 2026): Kathleen Saxman came in with the year 46508 because Zapier wrote May 1, 2027 as a day number. */
function fixSaxmanDate20261017() {
  const w = weddings_().find(x => x.d.id === 'wsync465080101saxman');
  if (!w) { Logger.log('Not found'); return; }
  const d = w.d; d.date = '2027-05-01'; d.location = 'Renault Winery';
  saveWedding_(d);
  Logger.log('Fixed: ' + d.bride + ' ' + d.date + ' ' + d.location + '; sheet date reads as ' + sheetDate_('46508', 2026));
}
