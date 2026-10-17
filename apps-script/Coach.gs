/**
 * Call Coach (Alexandra, Oct 17 2026): every sales call and front desk call recorded in Granola gets a grade
 * and tips for saying things differently, so the team books more.
 *   - Calls are recorded in Granola into the "Sales Calls" and "Front Desk Calls" folders.
 *   - A scheduled Claude task reads new calls each day, grades them and saves them here (coachSave, with the
 *     grader's private key; only its SHA-256 is in this file).
 *   - The office sees the sales line in the bridal app (Sales > Call Coach). The front desk app sees the desk
 *     line with its own desk key (its SHA-256 is saved in script properties as DESK_KEY_SHA).
 *   - Each call is one row on the "Call Coach" tab. Guest names are first name + last initial only.
 *     The "this week" focus for each line is saved in script properties (COACH_FOCUS_SALES / _DESK).
 */
const COACH_TAB = 'Call Coach';
const COACH_HEADERS = ['Id', 'Line', 'Person', 'Guest', 'Called at', 'Minutes', 'Kind', 'Outcome', 'Grade', 'Scores', 'Strength', 'Tips', 'Summary', 'Granola id', 'Saved at'];
const COACH_KEY_SHA = 'd33b58e37cfce67c45ad09c1664e174d2b6655990b6b83b9a37786871388d682';
const COACH_LINES = ['sales', 'desk'];
const COACH_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

function sha256Hex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s || ''), Utilities.Charset.UTF_8)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}
function coachKeyOk_(k) { return !!k && safeEq_(sha256Hex_(k), COACH_KEY_SHA); }
function deskKeyOk_(k) {
  const h = PropertiesService.getScriptProperties().getProperty('DESK_KEY_SHA');
  return !!k && !!h && safeEq_(sha256Hex_(k), h);
}

function coachSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(COACH_TAB);
  if (!sh) {
    sh = ss.insertSheet(COACH_TAB);
    sh.getRange(1, 1, 1, COACH_HEADERS.length).setValues([COACH_HEADERS]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:O').setNumberFormat('@');
  }
  return sh;
}

function coachRows_() {
  const sh = coachSheet_();
  if (sh.getLastRow() < 2) return [];
  const pj = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
  return sh.getRange(2, 1, sh.getLastRow() - 1, COACH_HEADERS.length).getValues().map((r, i) => ({
    row: i + 2, id: String(r[0]), line: String(r[1]), person: String(r[2]), guest: String(r[3]), at: String(r[4]),
    minutes: Number(r[5]) || 0, kind: String(r[6]), outcome: String(r[7]), grade: String(r[8]), scores: pj(r[9], []),
    strength: String(r[10]), tips: pj(r[11], []), summary: String(r[12]), granola: String(r[13]), saved: String(r[14])
  })).filter(c => c.id);
}

/** What the app shows for one line: the last 120 days of calls (newest first) and this week's focus. */
function coach_(line) {
  line = COACH_LINES.indexOf(line) >= 0 ? line : 'sales';
  const cutoff = new Date(Date.now() - 120 * 864e5).toISOString();
  const calls = coachRows_().filter(c => c.line === line && c.at >= cutoff)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(c => { const o = Object.assign({}, c); delete o.row; delete o.granola; delete o.saved; return o; });
  let focus = null;
  try { focus = JSON.parse(PropertiesService.getScriptProperties().getProperty('COACH_FOCUS_' + line.toUpperCase()) || 'null'); } catch (e) {}
  return { ok: true, line: line, calls: calls, focus: focus };
}

/** Granola ids already graded, so the grader skips them. */
function coachSeen_() {
  return { ok: true, seen: coachRows_().map(c => c.granola).filter(Boolean) };
}

/** Saves graded calls from the grader (new rows, or updates by Granola id) and each line's focus. */
function coachSave_(d) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return coachSaveLocked_(d); } finally { lock.releaseLock(); }
}
function coachSaveLocked_(d) {
  const sh = coachSheet_();
  const have = {};
  coachRows_().forEach(c => { if (c.granola) have[c.granola] = c.row; });
  let saved = 0;
  (d.calls || []).slice(0, 60).forEach(c => {
    const line = COACH_LINES.indexOf(c.line) >= 0 ? c.line : '';
    const at = /^\d{4}-\d{2}-\d{2}T/.test(c.at || '') ? String(c.at).slice(0, 25) : '';
    if (!line || !at || !c.granola) return;
    const scores = (Array.isArray(c.scores) ? c.scores : []).slice(0, 8)
      .map(s => [clean_(s && s[0], 40), Math.max(0, Math.min(10, Math.round(Number(s && s[1]) || 0)))]).filter(s => s[0]);
    const tips = (Array.isArray(c.tips) ? c.tips : []).slice(0, 4)
      .map(t => ({ was: clean_(t && t.was, 300), try: clean_(t && t.try, 400) })).filter(t => t.try);
    const row = [
      have[c.granola] ? coachSheet_().getRange(have[c.granola], 1).getValue() : 'c' + code_(10).toLowerCase(),
      line, clean_(c.person, 40), clean_(c.guest, 60), at, String(Math.max(0, Math.min(600, Math.round(Number(c.minutes) || 0)))),
      c.kind === 'voicemail' ? 'voicemail' : 'call', clean_(c.outcome, 60), COACH_GRADES.indexOf(c.grade) >= 0 ? c.grade : '',
      JSON.stringify(scores), clean_(c.strength, 400), JSON.stringify(tips), clean_(c.summary, 600), clean_(c.granola, 80), new Date().toISOString()];
    if (have[c.granola]) sh.getRange(have[c.granola], 1, 1, row.length).setValues([row]);
    else { sh.appendRow(row); have[c.granola] = sh.getLastRow(); }
    saved++;
  });
  const props = PropertiesService.getScriptProperties();
  Object.keys(d.focus || {}).forEach(line => {
    const f = d.focus[line];
    if (COACH_LINES.indexOf(line) < 0 || !f || !f.title) return;
    props.setProperty('COACH_FOCUS_' + line.toUpperCase(), JSON.stringify({ title: clean_(f.title, 120), why: clean_(f.why, 400), try: clean_(f.try, 400), updated: new Date().toISOString() }));
  });
  return { ok: true, saved: saved };
}

/** Coach requests that don't use the office code: the grader (coachKey) and the front desk app (deskKey). */
function coachPost_(d) {
  if (d.action === 'coachSave' || d.action === 'coachSeen') {
    if (!coachKeyOk_(d.coachKey)) return { ok: false, error: 'signin' };
    return d.action === 'coachSave' ? coachSave_(d) : coachSeen_();
  }
  if (d.action === 'coachDesk') {
    if (!deskKeyOk_(d.deskKey)) return { ok: false, error: 'signin' };
    return coach_('desk');
  }
  return null;
}
