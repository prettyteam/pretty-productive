/* Extension Quote card (Alexandra, Nov 17 2026): under Customer Cards, next to the RX card and Home Care.
   Prices come from her Canva "Extension Consult & Cost Guide": the cost of hair by method, color and length, plus the
   application by look. Quote per look, never per box. New hair orders take a $100 deposit. The guide is a suggested
   guideline, so every price stays editable for the look she wants. Needs h() and store from the page. */
(function(){
const EXQ_KEY='pp-extq';
/* method -> hair prices [length, solid, balayage/rooted] (blank where the guide has no price) */
const EXQ_HAIR={
  'Original Tape-In':[['12–14"',180,200],['14–16"',220,null],['16–18"',null,260],['18–20"',290,320]],
  'Undetectable Tape-In':[['12–14"',200,220],['14–16"',230,null],['16–18"',null,260],['18–20"',300,320]],
  'Undetectable Tape Row':[['12–14"',250,250],['14–16"',300,null],['16–18"',null,350],['18–20"',380,430]],
  'Hand-Tied':[['14–16"',200,250],['16–18"',300,360],['22–24"',400,430]]
};
const EXQ_METHODS=['Original Tape-In','Undetectable Tape-In','Undetectable Tape Row','Hand-Tied','Color Pops'];
/* application: [label, new hair [lo,hi], re-app [lo,hi]] */
const EXQ_LOOK=[['Minimal','Minimal volume/length (1–1.5 boxes)',[100,125],[150,200]],
  ['Medium','Medium volume/length (2 boxes)',[150,250],[200,250]],
  ['Full','Full volume/length (3–5 boxes)',[300,350],[350,350]]];
const EXQ_KIT=55, EXQ_DEP=100;
const blank=()=>({guest:'',type:'new',method:'Original Tape-In',color:'solid',len:'',look:'Medium',rows:1,pops:1,hair:'',app:'',kit:true,note:''});
let Q=null;
function load(){if(Q)return Q;try{Q=Object.assign(blank(),JSON.parse(store.get(EXQ_KEY)||'{}'))}catch(e){Q=blank()}return Q}
function save(){store.set(EXQ_KEY,JSON.stringify(Q))}
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('en-US');
const rng=([a,b])=>a===b?money(a):money(a)+'–'+money(b);
function lens(q){const L=EXQ_HAIR[q.method]||[];return L.filter(r=>(q.color==='solid'?r[1]:r[2])!=null)}
/* the guide's suggested numbers for what's picked */
function guide(q){
  const re=q.type==='re', g={hair:0,hairTxt:'',app:[0,0],appTxt:''};
  if(q.method==='Color Pops'){
    const n=Math.max(1,Math.min(6,Number(q.pops)||1));
    g.hair=re?0:(n>=6?125:25*n); g.hairTxt=re?'':(n>=6?'Bundle of 6 sandwiches':n+' sandwich'+(n>1?'es':'')+' at $25');
    g.app=re?[50,150]:[0,100]; g.appTxt=re?'Color pops re-app (charge over $50 to cover the tape)':'Color pops application (your call)';
    return g}
  const row=lens(q).find(r=>r[0]===q.len);
  if(!re&&row){g.hair=q.color==='solid'?row[1]:row[2];g.hairTxt=q.method+(q.color==='solid'?'':' Balayage/Rooted')+' '+row[0]}
  if(q.method==='Undetectable Tape Row'){const r=Number(q.rows)>=2?2:1;g.app=r===2?[300,350]:[250,250];g.appTxt=r+' row'+(r>1?'s':'')+(re?' re-app':'')}
  else if(q.method==='Hand-Tied'){const r=Math.max(1,Number(q.rows)||1);g.app=[200*r,250*r];g.appTxt=r+' row'+(r>1?'s':'')+' at $200–$250 per row'+(re?' (re-app)':'')}
  else{const L=EXQ_LOOK.find(x=>x[0]===q.look)||EXQ_LOOK[1];g.app=re?L[3]:L[2];g.appTxt=L[1]+(re?', re-app':', new hair')}
  return g;
}
const num=(v,d)=>v===''||v==null||isNaN(Number(v))?d:Number(v);
function totals(q){const g=guide(q), hair=q.type==='re'?0:num(q.hair,g.hair), app=num(q.app,g.app[0]), kit=q.kit?EXQ_KIT:0, total=hair+app+kit,
  dep=q.type==='new'&&hair>0?EXQ_DEP:0;return {g,hair,app,kit,total,dep,bal:total-dep}}
function lines(q,t){
  const L=[];
  if(t.hair>0) L.push(['Hair',t.g.hairTxt||q.method,t.hair]);
  if(t.app>0) L.push(['Application',q.type==='re'?'Re-application · '+q.method+(q.method==='Color Pops'?'':/Row|Hand/.test(q.method)?' · '+(Number(q.rows)||1)+(Number(q.rows)>1?' rows':' row'):' · '+q.look+' look'):(q.method==='Color Pops'?'Color pops application':q.method+' · '+(/Row|Hand/.test(q.method)?((Number(q.rows)||1)+(Number(q.rows)>1?' rows':' row')):q.look+' look')),t.app]);
  if(t.kit) L.push(['Home Maintenance Kit','Taffeta Shampoo + Extension Brush',t.kit]);
  return L;
}
function quoteText(q,t){
  const first=String(q.guest||'').trim().split(/\s+/)[0];
  return [(first?'Hi '+first+'! ':'')+'Here is your Taffeta extension quote:','',
    ...lines(q,t).map(([a,b,c])=>a+' ('+b+'): '+money(c)),'','Total: '+money(t.total),
    t.dep?'Deposit to order your hair: '+money(t.dep)+' (goes toward your total)':null,
    t.dep?'Due at your appointment: '+money(t.bal):null,
    q.note?'\n'+q.note.trim():null,'',
    'This is a suggested guideline. Your final price depends on the look you want. 💕'].filter(x=>x!=null).join('\n');
}
function css(){if(document.getElementById('extq-css'))return;const s=document.createElement('style');s.id='extq-css';s.textContent=`
.exq input[type=text],.exq input[type=number],.exq textarea{font:inherit;font-size:15px;color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:9px 10px;background:#fff;width:100%;box-sizing:border-box}
.exq .seg{justify-content:center}
.exq .hint{font-size:12.5px;color:var(--muted)}
.exq-card{background:#fff;border:1px solid var(--ink);border-radius:6px;padding:22px 18px;text-align:center;display:flex;flex-direction:column;gap:10px}
.exq-card h2{margin:0;font-size:22px}.exq-card .who{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.exq-row{display:grid;grid-template-columns:1fr auto;gap:2px 12px;text-align:left;border-top:1px solid var(--line);padding-top:8px}
.exq-row b{font-weight:600}.exq-row small{grid-column:1;color:var(--muted);font-size:12.5px}.exq-row span{grid-row:1/3;grid-column:2;align-self:center;font-variant-numeric:tabular-nums}
.exq-tot{display:grid;grid-template-columns:1fr auto;gap:4px 12px;text-align:left;border-top:2px solid var(--ink);padding-top:10px;font-variant-numeric:tabular-nums}
.exq-tot .big{font-size:18px;font-weight:600}
.exq-fine{font-size:12px;color:var(--muted);margin:4px 0 0}
.exq-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.exq-acts .obtn{width:100%;padding:0 10px}`;document.head.append(s)}
let MSG='';
function view(){
  css(); const q=load();
  if(q.method!=='Color Pops'){const L=lens(q);if(!L.some(r=>r[0]===q.len)) q.len=(L[1]||L[0]||[''])[0]}
  const t=totals(q), re=q.type==='re';
  const set=(k,v)=>{q[k]=v;if(['method','color','len','type','look','rows','pops'].includes(k)){q.hair='';q.app=''}MSG='';save();render()};
  const chips=(opts,cur,k)=>h('div',{class:'seg'},opts.map(([v,l])=>h('button',{type:'button','aria-pressed':String(cur===v),onclick:()=>set(k,v)},l)));
  const txt=(k,ph,type)=>{const i=h('input',{type:type||'text',value:q[k],placeholder:ph,autocomplete:'off',inputmode:type==='number'?'decimal':null,autocapitalize:type?null:'words'});
    i.addEventListener('input',()=>{q[k]=i.value;save()});i.addEventListener('change',()=>render());return i};
  const g=t.g;
  const build=h('section',{class:'card2'},
    h('label',{class:'fld'},'Guest',txt('guest','First name and last initial')),
    h('div',{class:'fld'},'New Hair or Re-Application',chips([['new','New Hair'],['re','Re-App (Her Hair)']],q.type,'type')),
    h('div',{class:'fld'},'Method',chips(EXQ_METHODS.map(m=>[m,m]),q.method,'method')),
    q.method==='Color Pops'
      ?(re?null:h('div',{class:'fld'},'Sandwiches',chips([1,2,3,4,5,6].map(n=>[n,n===6?'6 (Bundle)':String(n)]),Number(q.pops)||1,'pops')))
      :[re?null:h('div',{class:'fld'},'Color',chips([['solid','Solid'],['bal','Balayage / Rooted']],q.color,'color')),
        re?null:h('div',{class:'fld'},'Length',chips(lens(q).map(r=>[r[0],r[0]]),q.len,'len')),
        q.method==='Undetectable Tape Row'?h('div',{class:'fld'},'Rows',chips([[1,'1 Row'],[2,'2 Rows']],Number(q.rows)>=2?2:1,'rows'))
        :q.method==='Hand-Tied'?h('div',{class:'fld'},'Rows',chips([[1,'1 Row'],[2,'2 Rows'],[3,'3 Rows']],Number(q.rows)||1,'rows'))
        :h('div',{class:'fld'},'Her Look (quote per look, never per box)',chips(EXQ_LOOK.map(l=>[l[0],l[0]]),q.look,'look'))],
    h('div',{class:'fld2'},
      re?null:h('label',{class:'fld'},'Hair',txt('hair',String(g.hair),'number'),h('span',{class:'hint'},'Guide: '+money(g.hair))),
      h('label',{class:'fld',style:re?'grid-column:1/-1':null},'Application',txt('app',String(g.app[0]),'number'),h('span',{class:'hint'},'Guide: '+rng(g.app)))),
    h('div',{class:'fld'},'Home Maintenance Kit ($55)',chips([[true,'Include'],[false,'Leave Off']],!!q.kit,'kit')),
    h('label',{class:'fld'},'Note For Her (optional)',(()=>{const a=h('textarea',{rows:'2',placeholder:'e.g. Price includes a blend cut'},q.note||'');a.addEventListener('input',()=>{q.note=a.value;save()});return a})()));
  const first=String(q.guest||'').trim();
  const card=h('section',{class:'exq-card'},
    h('span',{class:'who'},first?'For '+first:'Your Quote'),h('h2',{},'Extension Quote'),
    ...lines(q,t).map(([a,b,c])=>h('div',{class:'exq-row'},h('b',{},a),h('small',{},b),h('span',{},money(c)))),
    h('div',{class:'exq-tot'},h('span',{class:'big'},'Total'),h('span',{class:'big'},money(t.total)),
      t.dep?[h('span',{},'Deposit to order her hair'),h('span',{},money(t.dep)),h('span',{},'Due at her appointment'),h('span',{},money(t.bal))]:null),
    q.note&&q.note.trim()?h('p',{class:'soft',style:'margin:0'},q.note.trim()):null,
    h('p',{class:'exq-fine'},'A suggested guideline. Her final price depends on the look she wants.'));
  const text=quoteText(q,t);
  const copy=async()=>{try{await navigator.clipboard.writeText(text);MSG='Copied. Paste it in a text or email to her.'}catch(e){MSG='Couldn’t copy on this device. Hold on the quote to copy it.'}render()};
  const acts=h('div',{class:'exq-acts'},
    h('button',{type:'button',class:'obtn',onclick:copy},'Copy Quote'),
    h('a',{class:'obtn',href:'sms:?&body='+encodeURIComponent(text),style:'display:inline-flex;align-items:center;justify-content:center;text-decoration:none'},'Text Her'));
  const fresh=h('div',{style:'display:flex;justify-content:center'},h('button',{type:'button',class:'obtn',style:'max-width:320px',
    onclick:()=>{if(!confirm('Start a new quote? This clears the one on screen.'))return;Q=blank();save();MSG='';render();window.scrollTo(0,0)}},'Start A New One'));
  const head=h('div',{},h('span',{class:'lbl'},'Customer Cards'),h('h1',{style:'font-size:28px'},'Extension Quote'),
    h('p',{class:'soft',style:'margin-top:6px'},'Pick her method, color, length and look. Prices fill in from the Extension Cost Guide, and you can change any of them for her look.'));
  return [h('div',{class:'hub exq'},head,fresh,build,card,acts,MSG?h('p',{class:'toast',style:'text-align:center'},MSG):null)];
}
window.extQuoteView=view;
window.EXQ_GUIDE={hair:EXQ_HAIR,look:EXQ_LOOK,kit:EXQ_KIT,dep:EXQ_DEP};   // the Prices tab shows the same guide (Nov 19 2026)
})();
