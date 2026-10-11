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

/** Run once from the editor: switches on the hourly check (and runs it once now). */
function installSheetSync() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncFromWeddingsSheet')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncFromWeddingsSheet').timeBased().everyHours(1).create();
  Logger.log('Hourly sheet check is on.');
  syncFromWeddingsSheet();
}

function syncFromWeddingsSheet() { return syncFromWeddingsSheet_(false); }
function previewSheetSync() { return syncFromWeddingsSheet_(true); }   // logs what would be added, adds nothing

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
      words(bride).some(w => String(d.bride || '').toLowerCase().indexOf(w) >= 0));
    const added = [];
    SpreadsheetApp.openById(BOOKINGS_SHEET_ID).getSheets().forEach(sh => {
      const m = sh.getName().trim().match(/^(\d{4})\s+weddings$/i);
      const hb = HONEYBOOK_TAB.test(sh.getName().trim());
      if (!hb && (!m || Number(m[1]) < thisYear)) return;
      const year = hb ? thisYear : Number(m[1]);
      const vals = sh.getDataRange().getValues();
      if (vals.length < 2) return;
      const head = vals[0].map(h => String(h).trim().toUpperCase());
      const cB = head.indexOf('BRIDE'), cD = head.indexOf('DATE'), cL = head.indexOf('LOCATION');
      if (cB < 0 || cD < 0) return;
      const seenKey = 'SYNC_SEEN_' + (hb ? 'HB' : year), props = PropertiesService.getScriptProperties();
      const seen = new Set(JSON.parse(props.getProperty(seenKey) || '[]'));   // rows already looked at, so a wedding deleted in the app isn't added back
      vals.slice(1).forEach(r => {
        const bride = String(r[cB] || '').replace(/\s+/g, ' ').trim().replace(/\s+(project|wedding)$/i, '');
        if (!bride || /cancel|groom/i.test(bride)) return;
        const date = sheetDate_(r[cD], year);
        if (!date) return;
        const key = date + '|' + bride.toLowerCase();
        if (seen.has(key)) return;
        if (!dryRun) seen.add(key);
        if (date < today || inApp(date, bride)) return;
        const loc = cL >= 0 ? String(r[cL] || '').replace(/\s+/g, ' ').trim() : '';
        added.push(date + ' ' + bride);
        if (dryRun) return;
        const last = words(bride).pop() || 'bride';
        saveWedding_({ id: 'wsync' + date.replace(/-/g, '') + last, bride: bride, date: date, location: loc,
          notes: 'Added automatically from the TAFFETA WEDDINGS sheet (' + sh.getName().trim() + ' tab). Fill in the party, team and times here.' });
        have.push({ date: date, bride: bride });
      });
      if (!dryRun) props.setProperty(seenKey, JSON.stringify([...seen]));
    });
    Logger.log((dryRun ? 'Would add ' : 'Added ') + added.length + ' new weddings' + (added.length ? ': ' + added.join('; ') : '.'));
    return added.length;
  } finally {
    lock.releaseLock();
  }
}

/** "2/21/2026", "3/21/26", "1/31" (year from the tab), "May 1, 2027" or a real date -> "yyyy-MM-dd". */
function sheetDate_(v, year) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const m = String(v || '').trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) {
    const t = new Date(String(v || '').trim());   // "2027-05-01T00:00:00", "May 1, 2027" from Zapier
    return /\d{4}/.test(String(v)) && !isNaN(t) ? Utilities.formatDate(t, TZ, 'yyyy-MM-dd') : '';
  }
  let y = m[3] ? Number(m[3]) : year;
  if (y < 100) y += 2000;
  const mo = Number(m[1]), d = Number(m[2]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
