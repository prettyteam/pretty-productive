// Guest request alerts on staff phones (Nov 13 2026).
// Usage: node patch-teampush.cjs ~/taffeta-desk-script   (the clasp folder). Run it from OUTSIDE that folder. Safe to run twice.
// Copies apps-script/TeamPush.gs in as TeamPush.js and adds to Code.js: ?artists=1 (public pick list), a 'tpush' POST,
// the ping after each Concierge request, tpush in the staff reply, and ?admin=…&alerts=1 for The Pretty Report.
const fs=require('fs'), path=require('path'); const dir=process.argv[2], f=path.join(dir,'Code.js');
fs.copyFileSync(path.join(__dirname,'..','apps-script','TeamPush.gs'), path.join(dir,'TeamPush.js'));
let s=fs.readFileSync(f,'utf8');
if(s.includes('teamPushSave_(')){console.log('Code.js already patched (TeamPush.js refreshed).');process.exit(0)}
const edits=[
  ["  if (p.decide) return decide_(p);\n", "  if (p.artists) return json_(conciergeArtists_());   // guest's artist pick list on the Concierge form (TeamPush.gs)\n"],
  ["    if (d.type === 'push') return deskSavePush_(d);\n", "    if (d.type === 'tpush') return teamPushSave_(d);   // staff phone alerts (TeamPush.gs)\n"],
  ["      deskPush_('New request', deskFirst_(name) + ' · ' + items.slice(0, 100));\n", "      teamPushConcierge_(d, name, items);   // staff phones: everyone in CONCIERGE_ALL + the guest's artist\n"],
  ["  if (p.mphotos) return json_(mphotoAlbum_());\n", "  if (p.alerts) return json_({ ok: true, alerts: teamPushStatus_() });   // who has guest alerts on (TeamPush.gs)\n"],
];
for(const [a] of edits) if(!s.includes(a)){console.error('Could not find: '+a.trim());process.exit(1)}
for(const [a,b] of edits) s=s.replace(a,()=>a+b);
const r=/(\n\s*)regimen: true,/; if(!r.test(s)){console.error('Could not find: regimen: true,');process.exit(1)}
s=s.replace(r,(m,ws)=>ws+"tpush: teamPushAll_(me.slug, me.name) ? 'all' : 'mine',   // guest request alerts on her phone (TeamPush.gs)"+m);
fs.writeFileSync(f,s); console.log('Patched '+f);
