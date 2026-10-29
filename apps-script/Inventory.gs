/**
 * Weekly Inventory report for the Front Desk app and Rose's app (Alexandra, Oct 29 2026).
 * Reads the newest "Retail Inventory Report" sheet in Alexandra's "Front Desk & Inventory" Drive folder
 * (the weekly Paired Plus report that Pretty Life's Inventory page is built from) and returns a staff-safe copy:
 * counts, reorder suggestions and the products missing a cost. No dollar amounts at cost and no sales dollars.
 * Desk: ?key=<desk key>&inv=1   Staff app: ?staff=<slug>&t=<token>&inv=1 (INV_PEOPLE only)
 */
const INV_FOLDER_ID = '12caB_cJkBiE6_dm8rBqOeolmMOMUX650';   // Taffeta Business Brain > Front Desk & Inventory
const INV_PEOPLE = ['alexandra', 'rose'];                     // who sees the weekly report in the staff app

function invReport_() {
  const c = CacheService.getScriptCache(), hit = c.get('invReport1');
  if (hit) return JSON.parse(hit);
  let out;
  try { out = invBuild_(); } catch (err) { return { error: 'read' }; }
  if (!out.error) { try { c.put('invReport1', JSON.stringify(out), 3600); } catch (e) {} }
  return out;
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
