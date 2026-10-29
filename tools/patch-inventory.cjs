// Adds the weekly Inventory report to the live desk script (Oct 29 2026), for the Front Desk app and Rose's app.
// Usage: node patch-inventory.cjs ~/taffeta-desk-script   (the clasp folder). Run it from OUTSIDE that folder.
// Copies apps-script/Inventory.gs in as Inventory.js and adds two lines to Code.js. Safe to run twice.
const fs=require('fs'), path=require('path'); const dir=process.argv[2]; const f=path.join(dir,'Code.js');
fs.copyFileSync(path.join(__dirname,'..','apps-script','Inventory.gs'), path.join(dir,'Inventory.js'));
let s=fs.readFileSync(f,'utf8');
if(s.includes('invReport_()')){console.log('Copied Inventory.js; Code.js already patched.');process.exit(0)}
const a="  if (p.rxcard) return json_(rxDeskCard_(p.rxcard));\n";
const b="function staffGet_(p) {\n  const me = member_(p.staff, p.t);\n  if (!me) return json_({ ok: false, error: 'link' });\n";
for(const x of [a,b]) if(!s.includes(x)){console.error('Could not find: '+x.trim());process.exit(1)}
s=s.replace(a,()=>a+"  if (p.inv) return json_(invReport_());   // weekly Inventory report (Inventory.gs)\n");
s=s.replace(b,()=>b+"  if (p.inv) return json_(INV_PEOPLE.indexOf(me.slug) >= 0 ? invReport_() : { ok: false, error: 'inv' });   // weekly Inventory report (Inventory.gs)\n");
fs.writeFileSync(f,s); console.log('Patched '+f+' and copied Inventory.js');
