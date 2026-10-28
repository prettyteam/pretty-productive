// Adds the 24-hour consultation booking reminder to the live desk script (Oct 28 2026).
// Usage: node patch-consult-remind.cjs ~/taffeta-desk-script   (the clasp folder). Run it from OUTSIDE that folder.
// Copies apps-script/ConsultRemind.gs in as ConsultRemind.js and adds one line to doGet. Safe to run twice.
const fs=require('fs'), path=require('path'); const dir=process.argv[2]; const f=path.join(dir,'Code.js');
fs.copyFileSync(path.join(__dirname,'..','apps-script','ConsultRemind.gs'), path.join(dir,'ConsultRemind.js'));
let s=fs.readFileSync(f,'utf8');
if(s.includes('consultRemindEnsure_()')){console.log('Copied ConsultRemind.js; Code.js already patched.');process.exit(0)}
const a="  if (p.rxcard) return json_(rxDeskCard_(p.rxcard));\n";
if(!s.includes(a)){console.error('Could not find: '+a.trim());process.exit(1)}
s=s.replace(a,()=>a+"  consultRemindEnsure_();   // switches on the 24-hour booking reminder (ConsultRemind.gs)\n");
fs.writeFileSync(f,s); console.log('Patched '+f+' and copied ConsultRemind.js');
