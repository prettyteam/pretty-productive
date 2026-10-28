// Log an Add-On for the live desk script (Oct 28 2026). Usage: node patch-addon-log.cjs ~/taffeta-desk-script/Code.js
// Needs the Team Activity log (actLog_) already in. Safe to run twice: it stops if add-ons are already counted.
const fs=require('fs'); const f=process.argv[2]; let s=fs.readFileSync(f,'utf8');
if(s.includes("addon: 'Logged an Add-On'")){console.log('Already patched.');process.exit(0)}
const R=[["cardopen: 'Guest Opened Her Card' };", "cardopen: 'Guest Opened Her Card', addon: 'Logged an Add-On' };"],
  ["  if (n > 1) {\n    const k = Math.min(n - 1, 200)", "  if (n > 1 && d.what !== 'addon') {   // every add-on she logs counts, even two in a row (Oct 28 2026)\n    const k = Math.min(n - 1, 200)"],
  ["clean_(d.detail, 120)]);", "clean_(d.detail, 200)]);"]];
for(const [a,b] of R){ if(!s.includes(a)){console.error('Could not find: '+a.slice(0,80));process.exit(1)} s=s.replace(a,()=>b); }
fs.writeFileSync(f,s); console.log('Patched '+f);
