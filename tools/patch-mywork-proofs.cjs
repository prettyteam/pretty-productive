// My Work albums on Marketing Proofs, for the live Weddings script (Oct 23 2026).
// Usage: node patch-mywork-proofs.cjs ~/taffeta-weddings-script <path to this repo's apps-script/AssociateModels.gs>
// Copies AssociateModels.gs in as AssociateModels.js and hooks it into Marketing.js. Safe to run twice.
const fs=require('fs'), path=require('path'); const dir=process.argv[2], src=process.argv[3];
fs.writeFileSync(path.join(dir,'AssociateModels.js'), fs.readFileSync(src,'utf8'));
const mf=path.join(dir,'Marketing.js'); let s=fs.readFileSync(mf,'utf8');
if(s.includes('mktModelsSync_(s)')){console.log('Marketing.js already hooked; AssociateModels.js updated.');process.exit(0)}
const a="case 'state': return mktPublic_(s);";
if(!s.includes(a)){console.error('Could not find: '+a);process.exit(1)}
s=s.replace(a,()=>"case 'state': mktModelsSync_(s); return mktPublic_(s);   // new My Work photos first (AssociateModels.js)");
fs.writeFileSync(mf,s); console.log('Patched '+dir);
