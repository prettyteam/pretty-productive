/**
 * Weekly Inventory report for the Front Desk app and Rose's app (Alexandra, Oct 29 2026).
 * Reads the newest "Retail Inventory Report" sheet in Alexandra's "Front Desk & Inventory" Drive folder
 * (the weekly Paired Plus report that Pretty Life's Inventory page is built from) and returns a staff-safe copy:
 * counts, reorder suggestions and the products missing a cost. No dollar amounts at cost and no sales dollars.
 * Desk: ?key=<desk key>&inv=1   Staff app: ?staff=<slug>&t=<token>&inv=1 (INV_PEOPLE only)
 */
const INV_FOLDER_ID = '12caB_cJkBiE6_dm8rBqOeolmMOMUX650';   // Taffeta Business Brain > Front Desk & Inventory
const INV_PEOPLE = ['alexandra', 'rose'];                     // who sees the weekly report in the staff app
// "Taffeta On Order" sheet (owned by info@): one row per item ordered, filled each morning from the vendor order emails in info@
const ONORDER_SHEET_ID = '1nXeNpv2-SRJVYfuofE97ECvtXwPIe94Wnbt5cHabdUg';
const ONORDER_DAYS = 21;                                      // stop showing an order this many days after it was placed

function invReport_() {
  const c = CacheService.getScriptCache(), hit = c.get('invReport1');
  let out = hit ? JSON.parse(hit) : null;
  if (!out) {
    try { out = invBuild_(); } catch (err) { return { error: 'read' }; }
    if (!out.error) { try { c.put('invReport1', JSON.stringify(out), 3600); } catch (e) {} }
  }
  if (!out.error) { out.onOrder = invOnOrder_(); out.arrived = invArrived_(); }   // read fresh each time, so an order shows as soon as it's on the sheet
  return out;
}

/** Items ordered but not received yet: [date, store, order #, item, qty, status], newest first.
    Auto drop-off (Alexandra, Nov 27 2026): an order leaves On The Way once the vendor's normal delivery time has passed,
    even when no delivered email comes: DePasquale (own truck, no delivered email) 2 business days after the order,
    2 days after an "arrives <date>", Shipped orders 7 days after the order, everything else 14 days.
    A "Still coming" order (someone tapped Not Delivered) stays 7 more days from that tap.
    The hourly order checker marks those rows Received on the sheet too; this just hides them right away.
    invArrived_ lists what just came in (last 10 days) so the Not Delivered button has somewhere to live. */
const ONORDER_STD = [[/depasquale/i, 'biz2']];
function invOrderRows_() {
  const v = SpreadsheetApp.openById(ONORDER_SHEET_ID).getSheets()[0].getDataRange().getValues();
  const fmt = x => Utilities.formatDate(x, 'America/New_York', 'yyyy-MM-dd');
  return v.slice(1).map(r => {
    const d = r[0] instanceof Date ? r[0] : new Date(String(r[0]) + 'T12:00:00');
    const g = r[6] instanceof Date ? r[6] : (r[6] ? new Date(String(r[6]).slice(0, 10) + 'T12:00:00') : null);
    return { d, g: g && !isNaN(g) ? g : null, row: isNaN(d) ? [] : [fmt(d), String(r[1]), String(r[2]), String(r[3]), Number(r[4]) || 0, String(r[5] || 'Ordered')] };
  }).filter(x => x.row[3] && !isNaN(x.d));
}
function invOnOrder_() {
  try {
    const now = Date.now(), cut = now - ONORDER_DAYS * 864e5;
    return invOrderRows_().filter(x => x.d.getTime() >= cut && !/received|cancel|deliver/i.test(x.row[5]) && !invPastDue_(x.d, x.row[1], x.row[5], now, x.g))
      .sort((a, b) => b.d - a.d).map(x => x.row);
  } catch (e) { return []; }
}
/** Just came in (last 10 days): [date, store, order #, item, qty, how] — how = 'got' (marked received) or 'auto' (past its normal delivery time). */
function invArrived_() {
  try {
    const now = Date.now(), cut = now - 10 * 864e5;
    return invOrderRows_().map(x => {
      if (/cancel/i.test(x.row[5])) return null;
      if (/received|deliver/i.test(x.row[5])) return (x.g || x.d).getTime() >= cut ? { t: (x.g || x.d).getTime(), row: x.row.slice(0, 5).concat('got') } : null;
      if (x.d.getTime() >= now - ONORDER_DAYS * 864e5 && invPastDue_(x.d, x.row[1], x.row[5], now, x.g)) return { t: x.d.getTime(), row: x.row.slice(0, 5).concat('auto') };
      return null;
    }).filter(Boolean).sort((a, b) => b.t - a.t).map(x => x.row);
  } catch (e) { return []; }
}

/** true when the vendor's normal delivery time for this order has passed (see invOnOrder_). g = Updated date (column G). */
function invPastDue_(d, store, status, now, g) {
  const day = 864e5;
  if (/still coming/i.test(status || '')) return now > (g || d).getTime() + 7 * day;
  const m = /arriv\w*\s+(?:on\s+|by\s+)?([A-Z][a-z]{2,8})\.?\s+(\d{1,2})/i.exec(status || '');
  if (m) {
    const a = new Date(m[1].slice(0, 3) + ' ' + m[2] + ', ' + d.getFullYear() + ' 12:00');
    if (!isNaN(a)) { if (a < d - 30 * day) a.setFullYear(a.getFullYear() + 1); return now > a.getTime() + 2 * day; }
  }
  if (ONORDER_STD.some(([re]) => re.test(store))) {
    const t = new Date(d.getTime()); let n = 0;
    while (n < 2) { t.setDate(t.getDate() + 1); const w = t.getDay(); if (w !== 0 && w !== 6) n++; }
    t.setHours(23, 59, 0, 0);
    return now > t.getTime();
  }
  return now > d.getTime() + (/ship/i.test(status) ? 7 : 14) * day;
}

/** "Got It" on What To Order > On The Way (Alexandra, Nov 27 2026): marks every open row of that order Received
    with today's date. Column I stays blank so the hourly order checker adds non-color boxes to the counts
    and the daily color refresh adds the color. Column J notes who tapped it.
    d = {type:'ordergot', key (desk) | slug+t (staff app, STOCK_EDITORS only), date:'yyyy-MM-dd', store, num} */
function invOrderGot_(d) {
  let who = '';
  if (d.key && d.key === DESK_KEY) who = 'Front Desk';
  else { const me = member_(d.slug, d.t); if (me && STOCK_EDITORS.indexOf(me.slug) >= 0) who = me.name; }
  if (!who) return json_({ ok: false, error: 'link' });
  const date = String(d.date || ''), store = String(d.store || ''), num = String(d.num || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !store) return json_({ ok: false, error: 'order' });
  const sh = SpreadsheetApp.openById(ONORDER_SHEET_ID).getSheets()[0], v = sh.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd');
  const back = d.type === 'ordernot';
  const note = (back ? 'Not Delivered in the app: ' : 'Got It in the app: ') + clean_(who, 60) + ', ' + Utilities.formatDate(new Date(), 'America/New_York', 'MMM d h:mm a');
  let n = 0;
  v.forEach((r, i) => {
    if (i === 0) return;
    const rd = r[0] instanceof Date ? Utilities.formatDate(r[0], 'America/New_York', 'yyyy-MM-dd') : String(r[0]).slice(0, 10);
    if (rd !== date || String(r[1]) !== store || String(r[2]) !== num || /cancel/i.test(String(r[5]))) return;
    if (!back && /received/i.test(String(r[5]))) return;
    // Not Delivered: back on On The Way as "Still coming" (no "deliver"/"receiv" in it, so every reader treats it as on the way).
    // Column I is cleared only when nothing was added to the counts yet; if boxes were already added, the note says to recount.
    const added = String(r[8] || '') && !/^color:/i.test(String(r[8])) && /add/i.test(String(r[8]));
    sh.getRange(i + 1, 6, 1, 2).setValues([[back ? 'Still coming · not here yet' : 'Received', today]]);
    if (back && !added) sh.getRange(i + 1, 9).setValue('');
    sh.getRange(i + 1, 10).setValue(note + (back && added ? ' (boxes were already added to the counts: recount this one)' : ''));
    n++;
  });
  return json_({ ok: true, marked: n });
}

function invNewest_() {
  const it = DriveApp.getFolderById(INV_FOLDER_ID).getFilesByType(MimeType.GOOGLE_SHEETS);
  let best = null;
  while (it.hasNext()) {
    const f = it.next();
    if (/^Retail Inventory Report/i.test(f.getName()) && (!best || f.getDateCreated() > best.getDateCreated())) best = f;
  }
  return best;
}

/** The report is one tab of sections: an ALL CAPS title row, a header row, then rows until a blank row. */
function invBuild_() {
  const f = invNewest_();
  if (!f) return { error: 'none' };
  const v = SpreadsheetApp.openById(f.getId()).getSheets()[0].getDataRange().getDisplayValues();
  const sec = {};
  let asOf = '';
  for (let i = 0; i < v.length; i++) {
    const t = String(v[i][0] || '').trim();
    const m = /^Stock as of:\s*(.+)$/i.exec(t);
    if (m) asOf = m[1];
    const bare = t.replace(/\(.*\)/, '').trim();   // e.g. "FULL STOCK LIST (348 items; ...)"
    if (!bare || bare !== bare.toUpperCase() || !/[A-Z]{3}/.test(bare) || v[i].slice(1).some(x => x !== '')) continue;
    const rows = [];
    let j = i + 2;
    for (; j < v.length && v[j].some(x => x !== ''); j++) rows.push(v[j]);
    sec[t] = { head: (v[i + 1] || []).map(x => String(x).trim()), rows };
    i = j - 1;
  }
  const find = p => { const k = Object.keys(sec).find(x => x.indexOf(p) === 0); return k ? sec[k] : { head: [], rows: [] }; };
  const num = x => { const n = Number(String(x).replace(/[$,]/g, '')); return isFinite(n) ? n : 0; };
  const pick = (s, cols) => s.rows.map(r => { const o = {}; cols.forEach(([k, h]) => { const i = s.head.indexOf(h); o[k] = i < 0 ? '' : r[i]; }); return o; });

  const glance = {};
  find('AT A GLANCE').rows.forEach(r => { glance[String(r[0])] = num(r[1]); });
  const g = p => { const k = Object.keys(glance).find(x => x.toLowerCase().indexOf(p) === 0); return k ? glance[k] : null; };

  const stock = pick(find('FULL STOCK LIST'), [['brand', 'Brand'], ['item', 'Product'], ['sku', 'SKU'], ['cat', 'Category'], ['oh', 'On Hand'], ['cost', 'Cost Each'], ['ytd', 'YTD Units']])
    .filter(r => r.item && !/EXTENSION HAIR/i.test(r.cat));
  const noCost = stock.filter(r => num(r.cost) === 0).map(r => [r.brand, r.item, r.sku, num(r.oh), num(r.ytd)])
    .sort((a, b) => (a[0] + a[1]).toLowerCase() < (b[0] + b[1]).toLowerCase() ? -1 : 1);
  const negative = stock.filter(r => num(r.oh) < 0).map(r => [r.brand, r.item, num(r.oh)]).sort((a, b) => a[2] - b[2]);

  const reorder = pick(find('SUGGESTED REORDER'), [['brand', 'Brand'], ['item', 'Product'], ['oh', 'On Hand'], ['ytd', 'YTD Units'], ['d30', '30-Day Units'], ['weeks', 'Weeks Left'], ['qty', 'Suggested Qty'], ['note', 'Note']])
    .map(r => [r.brand, r.item, num(r.oh), num(r.ytd), num(r.d30), num(r.weeks), num(r.qty), r.note]);
  const outLow = pick(find('OUT OF STOCK'), [['brand', 'Brand'], ['item', 'Product'], ['st', 'Status'], ['oh', 'On Hand'], ['ytd', 'YTD Units'], ['weeks', 'Weeks Left']])
    .map(r => [r.brand, r.item, r.st, num(r.oh), num(r.ytd), num(r.weeks)]);
  const top = pick(find('TOP 15 SELLERS'), [['brand', 'Brand'], ['item', 'Product'], ['ytd', 'YTD Units'], ['oh', 'On Hand']])
    .map(r => [r.brand, r.item, num(r.ytd), num(r.oh)]);
  const idle = pick(find('MOST STOCK ON HAND'), [['brand', 'Brand'], ['item', 'Product'], ['oh', 'On Hand'], ['ytd', 'YTD Units']])
    .filter(r => num(r.ytd) === 0).map(r => [r.brand, r.item, num(r.oh)]);
  // Needs a Look notes, minus anything with dollar amounts (costs and totals stay in Alexandra's report)
  const notes = find('NEEDS A LOOK').rows.map(r => String(r[0]).replace(/\s*\(\$[\d,.]+ at cost\)/g, '')).filter(t => t && t.indexOf('$') < 0);

  return { ok: true, asOf, file: f.getName(), at: Date.now(),
    glance: { products: g('retail products'), units: g('units on hand'), out: g('out of stock'), low: g('low'), reorder: g('reorder'), negative: negative.length, noCost: noCost.length },
    notes, reorder, outLow, top, idle, negative, noCost };
}
