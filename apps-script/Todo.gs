/**
 * To do tab (office only): one list each for Dom, Alex and Cherish, kept on the "To do" tab of this Sheet.
 * A checked-off task stays on the list (crossed out) for TODO_KEEP_DAYS, then drops off the app.
 * Nothing is deleted from the Sheet, so finished tasks stay there as a record.
 */
const TODO_TAB = 'To do';
const TODO_HEADERS = ['Id', 'For', 'Task', 'Due', 'From', 'Added', 'Done at'];
const TODO_LISTS = ['Dom', 'Alex', 'Cherish'];
const TODO_KEEP_DAYS = 2;

function todoSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(TODO_TAB);
  if (!sh) {
    sh = ss.insertSheet(TODO_TAB);
    sh.getRange(1, 1, 1, TODO_HEADERS.length).setValues([TODO_HEADERS]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:G').setNumberFormat('@');
  }
  return sh;
}

function todos_() {
  const sh = todoSheet_();
  if (sh.getLastRow() < 2) return { ok: true, items: [] };
  const cutoff = Date.now() - TODO_KEEP_DAYS * 864e5;
  const items = sh.getRange(2, 1, sh.getLastRow() - 1, TODO_HEADERS.length).getValues()
    .map(r => ({ id: String(r[0]), list: String(r[1]), task: String(r[2]), due: String(r[3]), from: String(r[4]), added: String(r[5]), doneAt: String(r[6]) }))
    .filter(t => t.id && t.task && (!t.doneAt || Date.parse(t.doneAt) > cutoff));
  return { ok: true, items: items };
}

function addTodo_(t) {
  t = t || {};
  const list = TODO_LISTS.indexOf(t.list) >= 0 ? t.list : '';
  const task = clean_(t.task, 500), from = TODO_LISTS.indexOf(t.from) >= 0 ? t.from : '';
  const due = /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') ? t.due : '';
  if (!list || !task) return { ok: false, error: 'bad_request', message: 'Write the task first.' };
  const id = 't' + code_(10).toLowerCase();
  todoSheet_().appendRow([id, list, task, due, from, new Date().toISOString(), '']);
  return todos_();
}

function doneTodo_(id, done) {
  const sh = todoSheet_();
  if (sh.getLastRow() < 2) return todos_();
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(r => String(r[0]));
  const i = ids.indexOf(String(id || ''));
  if (i >= 0) sh.getRange(i + 2, 7).setValue(done ? new Date().toISOString() : '');
  return todos_();
}
