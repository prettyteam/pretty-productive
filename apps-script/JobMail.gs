/**
 * Job offer emails, alongside the phone alerts.
 * - The office sends an offer: each artist with an email in Team records gets her own email with her private link,
 *   and the office gets one confirmation email (Alexandra and Dom on the same email).
 * - An artist taps Yes or No: the office gets one email.
 * Artist emails never include payout, the same as the phone banners. Office emails do.
 * Office emails go to Alexandra (info@) and Dom (sales@) on one email; the script property OFFICE_EMAILS (comma separated) overrides them.
 * An offer still waiting after 2 business days gets one reminder (email and phone alert), and the office gets one note.
 * Sent from info@ through MailApp (needs the script.send_mail scope, approved once in the editor).
 */
const MAIL_FROM_NAME = 'Taffeta Weddings';
const OFFICE_EMAILS = 'info@taffetadesign.com,sales@taffetadesign.com';

function officeEmails_() {
  const raw = PropertiesService.getScriptProperties().getProperty('OFFICE_EMAILS') || OFFICE_EMAILS;
  return String(raw || '').split(/[,;\s]+/).map(s => s.trim()).filter(s => /@/.test(s)).join(',');
}

const longDate_ = d => {
  const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? Utilities.formatDate(new Date(+m[1], +m[2] - 1, +m[3], 12), TZ, 'EEEE, MMMM d, yyyy') : 'Date TBD';
};
const mailEsc_ = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const memberLink_ = m => APP_URL + '#a.' + m.id + '.' + m.secret;

/** Ivory card, brown text, bronze rule (Taffeta Weddings colors). rows: [label, value] pairs. */
function mailHtml_(heading, intro, rows, button, outro) {
  const row = r => '<tr><td style="padding:6px 0;color:#886d4e;font-size:12px;letter-spacing:.08em;text-transform:uppercase;width:130px;vertical-align:top">'
    + mailEsc_(r[0]) + '</td><td style="padding:6px 0;color:#423327;font-size:15px">' + mailEsc_(r[1]) + '</td></tr>';
  return '<div style="background:#f2f1ec;padding:32px 16px;font-family:Georgia,\'Times New Roman\',serif">'
    + '<div style="max-width:520px;margin:0 auto;background:#ffffff;padding:32px 28px;color:#423327">'
    + '<div style="text-align:center;font-size:13px;letter-spacing:.3em;color:#423327">TAFFETA WEDDINGS</div>'
    + '<div style="width:48px;height:1px;background:#886d4e;margin:16px auto 24px"></div>'
    + '<div style="font-size:22px;font-style:italic;margin-bottom:12px">' + mailEsc_(heading) + '</div>'
    + (intro ? '<p style="font-size:15px;line-height:1.6;margin:0 0 16px">' + mailEsc_(intro) + '</p>' : '')
    + (rows.length ? '<table style="border-collapse:collapse;width:100%;margin:0 0 20px">' + rows.map(row).join('') + '</table>' : '')
    + (button ? '<div style="text-align:center;margin:24px 0"><a href="' + mailEsc_(button[1]) + '" style="background:#423327;color:#ffffff;text-decoration:none;padding:12px 28px;font-size:14px;letter-spacing:.06em">'
      + mailEsc_(button[0]) + '</a></div>' : '')
    + (outro ? '<p style="font-size:13px;line-height:1.6;color:#886d4e;margin:0">' + mailEsc_(outro) + '</p>' : '')
    + '</div></div>';
}

function sendMail_(to, subject, text, html) {
  if (!to) return false;
  try { MailApp.sendEmail({ to: to, subject: subject, body: text, htmlBody: html, name: MAIL_FROM_NAME }); return true; }
  catch (e) { console.warn('mail: ' + e); return false; }
}
const mailText_ = (heading, intro, rows, link, outro) =>
  [heading, '', intro].concat(rows.map(r => r[0] + ': ' + r[1]), link ? ['', link] : [], outro ? ['', outro] : []).filter(x => x != null).join('\n');

/** After an offer is saved: one email per artist, then one confirmation to the office. */
function mailJobOffer_(team, w, role, o) {
  const d = w.d, where = [d.location, d.room].filter(Boolean).join(', ') || 'Location TBD';
  const range = [o.headcount && ['Headcount', o.headcount], o.travel && ['Travel minimum', o.travel]].filter(Boolean);
  const emailed = [], noEmail = [];
  team.forEach(m => {
    const name = m.preferredName || m.legalName || 'there', link = memberLink_(m);
    const rows = [['Date', longDate_(d.date)], ['Location', where], ['Role', role]].concat(range, o.note ? [['Note', o.note]] : []);
    const intro = 'Hi ' + first_(name) + ', we would love to have you on this wedding. Let us know if you can hold the date.';
    const outro = 'Your link is private to you, so please don’t share it.';
    const ok = /@/.test(m.email || '') && sendMail_(m.email, 'Job offer · ' + shortDate_(d.date),
      mailText_('New job offer', intro, rows, 'Tap Yes or No here: ' + link, outro),
      mailHtml_('New job offer', intro, rows, ['Answer Yes or No', link], outro));
    (ok ? emailed : noEmail).push(first_(name) || name);
  });
  const rows = [['Bride', d.bride || ''], ['Date', longDate_(d.date)], ['Location', where], ['Role', role]]
    .concat(range, o.payout ? [['Payout', o.payout]] : [], [['Emailed', emailed.join(', ') || 'Nobody']], noEmail.length ? [['No email on file', noEmail.join(', ')]] : []);
  const intro = 'The offer went out' + (noEmail.length ? '. Text anyone without an email on file from the Jobs tab.' : '.');
  sendMail_(officeEmails_(), 'Offer sent · ' + first_(d.bride) + ' · ' + shortDate_(d.date),
    mailText_('Job offer sent', intro, rows, APP_URL, ''), mailHtml_('Job offer sent', intro, rows, ['Open the Jobs tab', APP_URL], ''));
}

/** After an artist answers: one email to the office. */
function mailJobAnswer_(j, yes) {
  const who = first_(j.artist) || j.artist;
  const heading = who + (yes ? ' said Yes' : ' said No');
  const intro = yes ? 'She’s on the wedding’s team now.' : 'You may want to offer this one to someone else.';
  const rows = [['Bride', j.bride], ['Date', longDate_(j.date)], ['Location', j.location || 'TBD'], ['Role', j.role]];
  sendMail_(officeEmails_(), heading + ' · ' + first_(j.bride) + ' · ' + shortDate_(j.date),
    mailText_(heading, intro, rows, APP_URL, ''), mailHtml_(heading, intro, rows, ['Open the Jobs tab', APP_URL], ''));
}

/** Run once from the editor to approve sending email and get a sample at the office addresses. */
function testJobEmails() {
  const to = officeEmails_();
  sendMail_(to, 'Test · Taffeta Weddings emails', 'Job offer emails are working.', mailHtml_('Emails are working', 'Job offer emails will look like this.', [['Sent to', to]], ['Open the app', APP_URL], ''));
  Logger.log('Sent a test to ' + to);
}

/* ---------- reminders: an offer still Waiting 2 business days after it went out ---------- */
const JOB_REMIND_AFTER = 2;     // business days (weekends don't count)
const JOB_REMIND_HOUR = 9;      // weekday mornings, New York time

/** The day an offer sent at `iso` is 2 business days old, as yyyy-MM-dd (sent Thursday: Monday). */
function businessDaysAfter_(iso, n) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  for (let k = 0; k < n;) { d.setDate(d.getDate() + 1); if (+Utilities.formatDate(d, TZ, 'u') <= 5) k++; }
  return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
}

/** Runs every weekday morning (see setupJobReminders): one email and phone alert per waiting offer, once, then one note to the office. */
function remindJobOffers() {
  if (+Utilities.formatDate(new Date(), TZ, 'u') > 5) return;
  const now = new Date(), today = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  const due = jobRows_().filter(j => j.status === 'Waiting' && !j.remindedAt && (!j.date || j.date >= today)
    && (businessDaysAfter_(j.sentAt, JOB_REMIND_AFTER) || '9') <= today);
  if (!due.length) return;
  const team = members_(), sh = jobsSheet_(), done = [];
  due.forEach(j => {
    const m = team.find(x => x.id === j.artistId);
    if (!m) return;
    const name = first_(m.preferredName || m.legalName || j.artist) || 'there', link = memberLink_(m);
    const rows = [['Date', longDate_(j.date)], ['Location', j.location || 'Location TBD'], ['Role', j.role]]
      .concat(j.headcount ? [['Headcount', j.headcount]] : [], j.travel ? [['Travel minimum', j.travel]] : [], j.note ? [['Note', j.note]] : []);
    const intro = 'Hi ' + name + ', we\u2019re still holding a spot for you on this wedding. Tap below to say Yes or No so we can plan the team.';
    const outro = 'Your link is private to you, so please don’t share it.';
    const mailed = /@/.test(m.email || '') && sendMail_(m.email, 'Reminder · Job offer ' + shortDate_(j.date),
      mailText_('Job offer reminder', intro, rows, 'Tap Yes or No here: ' + link, outro),
      mailHtml_('Job offer reminder', intro, rows, ['Answer Yes or No', link], outro));
    let pushed = 0;
    try { pushed = pushTo_(m.id, 'Reminder: job offer', shortDate_(j.date) + ' · ' + j.role + '. Tap to answer.', 'jobs'); } catch (e) { console.warn(e); }
    sh.getRange(j.row, 16).setValue(now.toISOString());
    done.push([name, shortDate_(j.date) + ' · ' + first_(j.bride) + (mailed ? '' : pushed ? ' (phone alert only, no email on file)' : ' (no email or alerts on file, please text her)')]);
  });
  if (!done.length) return;
  const intro = done.length === 1 ? 'One artist hasn’t answered yet, so she got a reminder this morning.' : done.length + ' artists haven’t answered yet, so they got a reminder this morning.';
  sendMail_(officeEmails_(), 'Reminders sent · ' + done.map(d => d[0]).join(', '),
    mailText_('Job offer reminders', intro, done, APP_URL, ''), mailHtml_('Job offer reminders', intro, done, ['Open the Jobs tab', APP_URL], ''));
}

/** Run once from the editor: checks for reminders every morning at 9 (weekends are skipped inside). */
function setupJobReminders() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'remindJobOffers').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('remindJobOffers').timeBased().everyDays(1).atHour(JOB_REMIND_HOUR).inTimezone(TZ).create();
  Logger.log('Job offer reminders run every weekday around ' + JOB_REMIND_HOUR + 'am.');
}
