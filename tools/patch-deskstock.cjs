// Lets the Front Desk save shelf counts from What To Order > Count These First (Nov 2 2026).
// Usage: node patch-deskstock.cjs ~/taffeta-desk-script   (the clasp folder). Run it from OUTSIDE that folder. Safe to run twice.
// Adds to Code.js: a 'deskstock' POST (desk key) that writes the Stock Counts tab, a ?stock=1 GET for the desk, and deskStock_().
const fs=require('fs'), path=require('path'); const f=path.join(process.argv[2],'Code.js');
let s=fs.readFileSync(f,'utf8');
if(s.includes('deskStock_(')){console.log('Code.js already patched.');process.exit(0)}
const src=fs.readFileSync(path.join(__dirname,'..','apps-script','Code.gs'),'utf8');
const fn=src.slice(src.indexOf('/** Front Desk typed a shelf count'),src.indexOf('function stock_() {'));
const a="    if (d.type === 'deskseen') return deskSeenSet_(d);\n", b="  if (p.inv) return json_(invReport_());", c="function stock_() {";
for(const x of [a,b,c]) if(!s.includes(x)){console.error('Could not find: '+x.trim());process.exit(1)}
s=s.replace(a,()=>a+"    if (d.type === 'deskstock') return deskStock_(d);\n");
s=s.replace(b,()=>"  if (p.stock) return json_({ ok: true, stock: stock_() });   // shelf counts (What To Order > Count These First)\n"+b);
s=s.replace(c,()=>fn+c);
fs.writeFileSync(f,s); console.log('Patched '+f);
