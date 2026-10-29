/* Approvals and caption edits (prettyteam version, Oct 17 2026): saved in Google Drive through MK.api, and only what
   changed is sent, so two people saving at once don't undo each other. */
let E={text:{},ok:{}},changed=new Set(),dirty=false,editing=false,baseOk={};
const $=s=>document.querySelector(s),st=$('#st'),saveB=$('#save'),editB=$('#edit');
function setText(el,t){el.replaceChildren(...t.split(/\n\s*\n/).map(x=>{const p=document.createElement('p');p.textContent=x.trim();if(el.classList.contains('cmt'))p.className='tags';return p}))}
function markOk(c){const a=document.getElementById('post-'+c.dataset.p);if(a)a.classList.toggle('ok',c.checked)}
function apply(){for(const[id,t]of Object.entries(E.text)){const el=document.getElementById(id);if(el)setText(el,t)}
 document.querySelectorAll('.okb').forEach(c=>{c.checked=!!E.ok[c.dataset.p];markOk(c)})}
function setDirty(v){dirty=v;saveB.disabled=!v;if(v)st.textContent='Unsaved changes'}
MK.onState(s=>{if(dirty)return;E={text:Object.assign({},s.edits.text),ok:Object.assign({},s.edits.ok)};baseOk=Object.assign({},E.ok);apply()});
document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',()=>{const el=document.getElementById(b.dataset.t);if(!el)return;const t=el.innerText.trim();
 navigator.clipboard.writeText(t).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent=b.dataset.l||'Copy caption',1500)}).catch(()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)})}));
document.querySelectorAll('.cap').forEach(el=>el.addEventListener('input',()=>{changed.add(el.id);setDirty(true);const c=document.getElementById('cc-'+el.id.slice(3));if(el.classList.contains('txt')&&c)c.textContent=el.innerText.trim().length+' characters'}));
document.querySelectorAll('.okb').forEach(c=>c.addEventListener('change',()=>{E.ok[c.dataset.p]=c.checked;if(!c.checked)delete E.ok[c.dataset.p];markOk(c);setDirty(true)}));
editB.addEventListener('click',()=>{editing=!editing;document.querySelectorAll('.cap').forEach(el=>el.setAttribute('contenteditable',editing?'true':'false'));editB.textContent=editing?'Done editing':'Edit text'});
saveB.addEventListener('click',async()=>{if(!dirty)return;const T={};for(const id of changed){const el=document.getElementById(id);if(el){E.text[id]=el.innerText.replace(/\n{3,}/g,'\n\n').trim();T[id]=E.text[id]}}
 const D={};new Set(Object.keys(E.ok).concat(Object.keys(baseOk))).forEach(k=>{if(!!E.ok[k]!==!!baseOk[k])D[k]=!!E.ok[k]});
 saveB.disabled=true;st.textContent='Saving…';
 try{const s=await MK.api('save',{text:T,ok:D});changed.clear();dirty=false;st.textContent='Saved';MK.applyState(s)}
 catch(e){st.textContent=e&&e.message==='offline'?'No connection. Try again in a moment.':'Could not save. Try again.';saveB.disabled=false}});
function sched(){const only=document.getElementById('onlyok').checked;
 const pm=(document.getElementById('planm')||{}).value||'';   // the plan's month picker: Archive, this week of October, or November (Oct 26 2026)
 const all=[...document.querySelectorAll('.post[data-date]')].filter(a=>{const d=a.dataset.date;return !pm||(pm==='arch'?d<'2026-10-26':pm==='2026-10'?(d>='2026-10-26'&&d<'2026-11'):d.startsWith(pm))}).map(a=>({a,ok:!!E.ok[a.id.slice(5)]})).filter(r=>!only||r.ok).sort((x,y)=>x.a.dataset.date.localeCompare(y.a.dataset.date)||x.a.dataset.acct.localeCompare(y.a.dataset.acct));
 const fill=(id,rows,cols)=>{const tb=document.getElementById(id);tb.replaceChildren(...rows.map(({a,ok})=>{const tr=document.createElement('tr');const d=a.dataset;
  cols.forEach(k=>{const td=document.createElement('td');td.textContent=d[k];tr.append(td)});
  const td=document.createElement('td');const l=document.createElement('a');l.href='#'+a.id;l.textContent=d.title;td.append(l);tr.append(td);
  const s=document.createElement('td');s.textContent=ok?'Approved':'Waiting';tr.append(s);return tr}));
  if(!rows.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=cols.length+2;td.textContent='Nothing approved here yet.';tr.append(td);tb.append(tr)}};
 fill('rowsapp',all.filter(r=>r.a.dataset.fmt==='Reel'),['day','time','acct']);
 fill('rowsbs',all.filter(r=>r.a.dataset.fmt!=='Reel'),['day','time','acct','fmt'])}
document.getElementById('onlyok').addEventListener('change',sched);
{const pm=document.getElementById('planm');if(pm){pm.addEventListener('change',sched);if(new Date()>=new Date('2026-11-02T00:00:00'))pm.value='2026-11'}}
const _apply=apply;apply=function(){_apply();sched()};sched();
document.querySelectorAll('.okb').forEach(c=>c.addEventListener('change',sched));
$('#bar').classList.add('on');document.querySelectorAll('.okb').forEach(c=>c.disabled=false);
/* Each "Week of …" (and the Stories block) folds behind a + so the page isn't one long scroll (her ask, Oct 22 2026). A link to a post opens its week. */
setTimeout(function(){const css=document.createElement('style');css.textContent='details.wk{border-top:1px solid rgba(0,0,0,.12)}details.wk>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:14px 4px;font-weight:600;font-size:1.05em}details.wk>summary::-webkit-details-marker{display:none}details.wk>summary::after{content:"+";font-size:1.5em;line-height:1;font-weight:400}details.wk[open]>summary::after{content:"\\2212"}';document.head.append(css);
 document.querySelectorAll('section.acct h3').forEach(h=>{const d=document.createElement('details');d.className='wk';const s=document.createElement('summary');s.textContent=h.textContent;d.append(s);
  let n=h.nextElementSibling;while(n&&n.tagName!=='H3'&&n.tagName!=='H2'){const x=n.nextElementSibling;d.append(n);n=x}h.replaceWith(d)});
 function openTo(){const id=decodeURIComponent(location.hash.slice(1));const el=id&&document.getElementById(id);const d=el&&el.closest('details.wk');if(d){d.open=true;el.scrollIntoView()}}
 addEventListener('hashchange',openTo);openTo()},0);   // after the page's own scripts, which move older weeks into Archive first
