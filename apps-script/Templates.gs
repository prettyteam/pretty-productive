/**
 * Text templates tab (office only): copy-and-paste replies for brides who text the office.
 * Kept on the "Text templates" tab of this Sheet so Alexandra and Dom can add and edit them in the app.
 * Removing a template only marks it archived; the row stays on the Sheet.
 */
const TPL_TAB = 'Text templates';
const TPL_HEADERS = ['Id', 'Category', 'Title', 'Text', 'Order', 'Archived', 'Updated'];

function tplSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(TPL_TAB);
  if (!sh) {
    sh = ss.insertSheet(TPL_TAB);
    sh.getRange(1, 1, 1, TPL_HEADERS.length).setValues([TPL_HEADERS]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:G').setNumberFormat('@');
  }
  return sh;
}

function tplRows_() {
  const sh = tplSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, TPL_HEADERS.length).getValues().map((r, i) => ({
    row: i + 2, id: String(r[0]), category: String(r[1]), title: String(r[2]), text: String(r[3]),
    order: Number(r[4]) || 0, archived: String(r[5]) === 'Yes', updated: String(r[6])
  })).filter(t => t.id);
}

function templates_() {
  return { ok: true, templates: tplRows_().filter(t => !t.archived).map(t => ({ id: t.id, category: t.category, title: t.title, text: t.text, order: t.order })) };
}

/** Add a template (no id) or update one (with id). */
function saveTemplate_(t) {
  t = t || {};
  const category = clean_(t.category, 80) || 'General', title = clean_(t.title, 120), text = String(t.text || '').replace(/\r/g, '').slice(0, 4000).trim();
  if (!title || !text) return { ok: false, error: 'bad_request', message: 'Add a title and the message text.' };
  const safe = /^[=+\-@]/.test(text) ? "'" + text : text;
  const sh = tplSheet_(), now = new Date().toISOString(), rows = tplRows_();
  const cur = t.id && rows.find(x => x.id === String(t.id));
  if (cur) sh.getRange(cur.row, 2, 1, 6).setValues([[category, title, safe, String(cur.order), '', now]]);
  else sh.appendRow(['tp' + code_(10).toLowerCase(), category, title, safe, String(rows.length + 1), '', now]);
  return templates_();
}

function archiveTemplate_(id) {
  const cur = tplRows_().find(x => x.id === String(id || ''));
  if (cur) tplSheet_().getRange(cur.row, 6, 1, 2).setValues([['Yes', new Date().toISOString()]]);
  return templates_();
}
