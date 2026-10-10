/**
 * Booked weddings sync: every hour, adds new upcoming weddings from the year tabs
 * of the TAFFETA WEDDINGS sheet (info@ Drive) to the app, so nobody has to enter them by hand.
 *
 * - Reads every tab named like "2026 WEDDINGS" or "2027 Weddings" (columns Bride, Date, Location).
 * - Adds only weddings dated today or later that the app doesn't have yet (same date and same first or last name).
 * - Skips rows marked CANCELLED and GROOM rows. Never changes or deletes a wedding already in the app.
 * - Remembers what it has seen, so a wedding deleted from the app is not added back.
 *
 * Setup: run installSheetSync once from the editor (it also runs the first sync).
 * To stop: run removeSheetSync.
 */
const SYNC_SOURCE_ID = '19kl0X_Qzh5bG6HQGaLILaQCDlBJgEZ3vcRlMNc3vwmU';
const SYNC_TAB = /^\s*(\d{4})\s+weddings\s*$/i;

function installSheetSync() {
  removeSheetSync();
  ScriptApp.newTrigger('syncFromSheet').timeBased().everyHours(1).create();
  syncFromSheet();
}

function removeSheetSync() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncFromSheet')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function syncFromSheet() {
  ensureSetup_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd');
    const have = weddings_().map(x => x.d);
    const words = s => String(s || '').toLowerCase().replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 1);
    const known = (date, bride) => {
      const w = words(bride), first = w[0], last = w[w.length - 1];
      return have.some(d => d.date === date && words(d.bride).some(x => x === first || x === last));
    };
    let added = 0;
    SpreadsheetApp.openById(SYNC_SOURCE_ID).getSheets().forEach(sh => {
      const m = sh.getName().match(SYNC_TAB);
      if (!m || sh.getLastRow() < 2) return;
      const year = Number(m[1]);
      const rows = sh.getDataRange().getValues();
      const head = rows[0].map(h => String(h).trim().toLowerCase());
      const col = name => head.findIndex(h => h === name || h.indexOf(name) === 0);
      const cBride = col('bride'), cDate = col('date'), cLoc = col('location'), cNotes = col('notes');
      if (cBride < 0 || cDate < 0) return;
      const seenKey = 'SYNC_SEEN_' + year;
      const seen = new Set(JSON.parse(props.getProperty(seenKey) || '[]'));
      rows.slice(1).forEach(r => {
        const raw = String(r[cBride] || '').trim();
        const date = syncDate_(r[cDate], year);
        if (!raw || !date) return;
        const flags = raw + ' ' + (cNotes >= 0 ? r[cNotes] : '');
        if (/cancel/i.test(flags) || /\bgroom\b/i.test(raw)) return;
        const bride = raw.replace(/\s+/g, ' ');
        const key = date + '|' + bride.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        if (date < today || known(date, bride)) return;
        const loc = cLoc >= 0 ? String(r[cLoc] || '').trim() : '';
        const res = saveWedding_({ id: 'wsync' + date.replace(/-/g, '') + words(bride).join('').slice(0, 20),
          bride: bride, date: date, location: loc,
          notes: 'Added automatically from the TAFFETA WEDDINGS sheet (' + sh.getName().trim() + ' tab). Fill in the party, team and times here.' });
        if (res.ok) { have.push({ date: date, bride: bride }); added++; }
      });
      props.setProperty(seenKey, JSON.stringify([...seen]));
    });
    Logger.log('Sheet sync: added ' + added + ' new wedding' + (added === 1 ? '' : 's') + '.');
    return added;
  } finally {
    lock.releaseLock();
  }
}

/** A Date cell, "1/31", "1/31/26" or "1/31/2026" -> 'yyyy-MM-dd' (the tab's year when the cell has none). */
function syncDate_(v, year) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, 'America/New_York', 'yyyy-MM-dd');
  const m = String(v || '').trim().match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?/);
  if (!m) return '';
  let y = m[3] ? Number(m[3]) : year;
  if (y < 100) y += 2000;
  const mo = Number(m[1]), d = Number(m[2]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
