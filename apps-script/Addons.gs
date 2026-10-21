/**
 * Wedding day add-on payments (Alexandra, Oct 21 2026).
 * Before the guest scans the Venmo code, the artist picks the wedding and the add-on in the app.
 * Each pick is a row on the "Add-on payments" tab of this Sheet, so the office (Cherish runs payroll)
 * can see what every artist collected for, beyond what the wedding booked.
 * The app can't see Venmo, so a row only says the artist showed the code. Cherish ticks
 * "Paid, confirmed" in the app once she finds the payment in the Taffeta Weddings Venmo.
 */
const ADDON_TAB = 'Add-on payments';
const ADDON_HEADERS = ['Id', 'Logged', 'Artist id', 'Artist', 'Wedding id', 'Bride', 'Wedding date', 'Add-on', 'Qty', 'Each',
                       'Total', 'Guest', 'Paid by', 'Status', 'Confirmed by', 'Confirmed at'];
const ADDON_STATUS = ['Collected', 'Not paid', 'Confirmed'];

function addonSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(ADDON_TAB);
  if (!sh) {
    sh = ss.insertSheet(ADDON_TAB);
    sh.getRange(1, 1, 1, ADDON_HEADERS.length).setValues([ADDON_HEADERS]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:H').setNumberFormat('@');
    sh.getRange('L:P').setNumberFormat('@');
  }
  return sh;
}

function addonRows_() {
  const sh = addonSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, ADDON_HEADERS.length).getValues().map((r, i) => ({
    _row: i + 2, id: String(r[0]), loggedAt: iso_(r[1]), artistId: String(r[2]), artist: String(r[3]), weddingId: String(r[4]),
    bride: String(r[5]), date: String(r[6]), addon: String(r[7]), qty: Number(r[8]) || 1, each: Number(r[9]) || 0,
    total: Number(r[10]) || 0, guest: String(r[11]), method: String(r[12]), status: String(r[13]) || 'Collected',
    confirmedBy: String(r[14]), confirmedAt: String(r[15])
  })).filter(a => a.id);
}
function addonOut_(a) { const o = Object.assign({}, a); delete o._row; return o; }

/** Artists see their own; the office sees everyone's. */
function addons_(who) {
  const all = addonRows_();
  return who.role === 'office' ? all.map(addonOut_) : all.filter(a => a.artistId === who.member.id).map(addonOut_);
}

/** a: {weddingId, addon, qty, each, guest, method, artist (office only)} */
function logAddon_(who, a) {
  a = a || {};
  const addon = clean_(a.addon, 80), qty = Math.max(1, Math.min(20, Math.round(Number(a.qty) || 1)));
  const each = Math.max(0, Math.min(5000, Math.round((Number(a.each) || 0) * 100) / 100));
  if (!addon || !each) return { ok: false, error: 'bad_request', message: 'Pick the add-on first.' };
  const w = weddings_().find(x => x.d.id === a.weddingId);
  if (who.role !== 'office') {
    const email = String(who.member.email || '').toLowerCase();
    const mine = w && (w.d.artists || []).some(x => x.uid === who.member.id || (email && String(x.email || '').toLowerCase() === email));
    if (!mine) return { ok: false, error: 'not_found', message: 'Pick one of your weddings.' };
  }
  const artist = who.role === 'office' ? clean_(a.artist || 'Office', 60) : (who.member.preferredName || who.member.legalName || '');
  const row = {
    id: 'a' + code_(10).toLowerCase(), loggedAt: new Date().toISOString(), artistId: who.role === 'office' ? '' : who.member.id,
    artist: artist, weddingId: w ? w.d.id : '', bride: clean_(w ? w.d.bride : a.bride, 120), date: clean_(w ? w.d.date : '', 20),
    addon: addon, qty: qty, each: each, total: Math.round(qty * each * 100) / 100, guest: clean_(a.guest, 80),
    method: String(a.method).toLowerCase() === 'card' ? 'Card' : 'Venmo', status: 'Collected', confirmedBy: '', confirmedAt: ''
  };
  addonSheet_().appendRow([row.id, row.loggedAt, row.artistId, row.artist, row.weddingId, row.bride, row.date, row.addon, row.qty,
                           row.each, row.total, row.guest, row.method, row.status, '', '']);
  pushOffice_('Add-on collected', first_(artist) + ' · ' + addon + (qty > 1 ? ' ×' + qty : '') + ' · $' + row.total + ' · ' + first_(row.bride), 'addon');
  return { ok: true, addon: row };
}

/** The artist marks her own row "Not paid" (the guest changed her mind); the office can set any status. */
function setAddon_(who, id, status, by) {
  if (ADDON_STATUS.indexOf(status) < 0) return { ok: false, error: 'bad_request' };
  const a = addonRows_().find(x => x.id === id);
  if (!a) return { ok: false, error: 'not_found' };
  if (who.role !== 'office') {
    if (a.artistId !== who.member.id || a.status === 'Confirmed' || status === 'Confirmed') return { ok: false, error: 'office_only' };
  }
  const confirmed = status === 'Confirmed';
  addonSheet_().getRange(a._row, 14, 1, 3).setValues([[status, confirmed ? clean_(by || 'Office', 40) : '', confirmed ? new Date().toISOString() : '']]);
  return { ok: true };
}
