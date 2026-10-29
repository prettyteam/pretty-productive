/**
 * Consultation booking reminder (Alexandra, Oct 28 2026): a safety net for guests nobody got back to.
 * Every hour, a consultation still marked "New" on the Front Desk page 24 hours after it came in gets one
 * friendly email asking them to call or text the desk. Contacted or Booked guests never get it.
 * The time of the email is written in the "Reminder sent" column so nobody gets it twice.
 * Only forms that came in after the reminder was switched on count, so nobody from before gets one.
 * The hourly check switches itself on the first time the Front Desk page loads (consultRemindEnsure_ in doGet).
 */
const CONSULT_REMIND_AFTER_HOURS = 24;
const CONSULT_REMIND_WINDOW = [9, 19];      // only sends between 9 AM and 7 PM New York time; overnight ones wait for the morning
const CONSULT_REMIND_PHONE = '(609) 383-5504';
const CONSULT_REMIND_HEADER = 'Reminder sent';

function consultRemindEnsure_() {
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('CONSULT_REMIND_ON')) return;
    if (!ScriptApp.getProjectTriggers().some(tr => tr.getHandlerFunction() === 'consultRemindCheck'))
      ScriptApp.newTrigger('consultRemindCheck').timeBased().everyHours(1).create();
    props.setProperty('CONSULT_REMIND_ON', String(Date.now()));
  } catch (err) {}
}

function consultRemindCheck() {
  const since = Number(PropertiesService.getScriptProperties().getProperty('CONSULT_REMIND_ON') || 0);
  if (!since) return;
  const hour = Number(Utilities.formatDate(new Date(), 'America/New_York', 'H'));
  if (hour < CONSULT_REMIND_WINDOW[0] || hour >= CONSULT_REMIND_WINDOW[1]) return;
  const t = TABS.consult, sh = tab_(t), n = sh.getLastRow();
  if (n < 2) return;
  let col = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].indexOf(CONSULT_REMIND_HEADER) + 1;
  if (!col) {
    col = Math.max(sh.getLastColumn(), t.headers.length) + 1;
    sh.getRange(1, col).setValue(CONSULT_REMIND_HEADER).setFontWeight('bold').setBackground('#423327').setFontColor('#f2f1ec');
  }
  const vals = sh.getRange(2, 1, n - 1, col).getValues();
  const iFirst = t.keys.indexOf('first'), iEmail = t.keys.indexOf('email'), iStatus = t.keys.indexOf('status');
  const due = Date.now() - CONSULT_REMIND_AFTER_HOURS * 36e5, stale = Date.now() - 7 * 864e5;
  vals.forEach((r, i) => {
    const at = r[0] instanceof Date ? r[0].getTime() : NaN;
    if (!(at > since && at <= due && at > stale)) return;
    if (String(r[iStatus] || 'New') !== 'New' || r[col - 1]) return;
    const email = String(r[iEmail] || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    const first = consultRemindName_(r[iFirst]);
    try {
      MailApp.sendEmail({ to: email, replyTo: FRONT_DESK_EMAIL, name: 'Taffeta Salon & Spa',
        subject: 'We’d Love To Get You In' + (first ? ', ' + first : '') + '!',
        body: consultRemindBody_(first) });
      sh.getRange(i + 2, col).setValue(new Date()).setNumberFormat('ddd mmm d, h:mm am/pm');
    } catch (err) {}
  });
}

/** "sonia" becomes "Sonia"; anything odd is left out so the email just says "Hi there". */
function consultRemindName_(v) {
  const s = String(v || '').trim().split(/\s+/)[0] || '';
  return /^[\p{L}'’-]{1,30}$/u.test(s) ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function consultRemindBody_(first) {
  return 'Hi ' + (first || 'there') + ',\n\n' +
    'Thank you so much for sending us your consultation! We loved reading about your goals & can’t wait to help you get there.\n\n' +
    'If we haven’t connected with you yet, please give our desk a call or text at ' + CONSULT_REMIND_PHONE +
    ' and we’ll find the perfect time (& the perfect artist) for you.\n\n' +
    'Can’t wait to meet you!\n' +
    'xo, Taffeta Salon & Spa';
}

/** Editor check: emails the reminder to the front desk so you can see exactly what guests get. */
function consultRemindPreview() {
  MailApp.sendEmail({ to: FRONT_DESK_EMAIL, replyTo: FRONT_DESK_EMAIL, name: 'Taffeta Salon & Spa',
    subject: 'We’d Love To Get You In, Sonia!', body: consultRemindBody_('Sonia') });
}
