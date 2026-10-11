/**
 * Job offers (date holds): the office offers an upcoming wedding to chosen artists, with ranges only
 * (headcount, travel minimum, payout), and each artist answers Yes / No on her private link.
 * Nothing is emailed or texted from here; the office copies the text and sends it herself.
 * Offers live on the "Job offers" tab of this Sheet, one row per artist.
 */
const JOBS_TAB = 'Job offers';
const JOBS_HEADERS = ['Id', 'Wedding id', 'Bride', 'Date', 'Location', 'Artist id', 'Artist', 'Role', 'Headcount', 'Travel minimum',
                      'Payout', 'Note', 'Status', 'Sent at', 'Answered at'];

function jobsSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(JOBS_TAB);
  if (!sh) {
    sh = ss.insertSheet(JOBS_TAB);
    sh.getRange(1, 1, 1, JOBS_HEADERS.length).setValues([JOBS_HEADERS]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:O').setNumberFormat('@');
  }
  return sh;
}

function jobRows_() {
  const sh = jobsSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, JOBS_HEADERS.length).getValues().map((r, i) => ({
    row: i + 2, id: String(r[0]), weddingId: String(r[1]), bride: String(r[2]), date: String(r[3]), location: String(r[4]),
    artistId: String(r[5]), artist: String(r[6]), role: String(r[7]), headcount: String(r[8]), travel: String(r[9]),
    payout: String(r[10]), note: String(r[11]), status: String(r[12]) || 'Waiting', sentAt: String(r[13]), answeredAt: String(r[14])
  })).filter(j => j.id);
}

const jobPublic_ = j => { const o = Object.assign({}, j); delete o.row; return o; };

/** Office: every offer for weddings from 30 days ago on. */
function jobs_() {
  const since = Utilities.formatDate(new Date(Date.now() - 30 * 864e5), TZ, 'yyyy-MM-dd');
  return { ok: true, jobs: jobRows_().filter(j => !j.date || j.date >= since).map(jobPublic_) };
}

/** Office: one offer row per chosen artist. */
function offerJob_(o) {
  o = o || {};
  const w = weddings_().find(x => x.d.id === o.weddingId);
  if (!w) return { ok: false, error: 'bad_request', message: 'Pick a wedding.' };
  const ids = Array.isArray(o.memberIds) ? o.memberIds.map(String) : [];
  const team = members_().filter(m => ids.indexOf(m.id) >= 0);
  if (!team.length) return { ok: false, error: 'bad_request', message: 'Pick at least one artist.' };
  const role = o.role === 'mu' ? 'Makeup' : o.role === 'both' ? 'Hair & makeup' : 'Hair';
  const sh = jobsSheet_(), now = new Date().toISOString();
  team.forEach(m => sh.appendRow(['j' + code_(10).toLowerCase(), w.d.id, clean_(w.d.bride, 120), w.d.date || '',
    clean_([w.d.location, w.d.room].filter(Boolean).join(', '), 200), m.id, clean_(m.preferredName || m.legalName, 120), role,
    clean_(o.headcount, 60), clean_(o.travel, 60), clean_(o.payout, 60), clean_(o.note, 500), 'Waiting', now, '']));
  return jobs_();
}

/** Artist: her own offers, upcoming only. */
function myJobs_(member) {
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  return { ok: true, jobs: jobRows_().filter(j => j.artistId === member.id && (!j.date || j.date >= today)).map(j => {
    const o = jobPublic_(j); delete o.artistId; return o;
  }) };
}

/** Artist: Yes or No on one of her own offers. */
function answerJob_(member, id, yes) {
  const j = jobRows_().find(x => x.id === String(id || '') && x.artistId === member.id);
  if (!j) return { ok: false, error: 'not_found' };
  jobsSheet_().getRange(j.row, 13, 1, 3).setValues([[yes ? 'Yes' : 'No', j.sentAt, new Date().toISOString()]]);
  return myJobs_(member);
}
