/* Taffeta Calendar (Updates From Alex & Events) — Alexandra, Nov 19 2026.
   In every staff app: updates from Alex (each shows 5 days, then moves to Past Updates), Meeting / Class requests
   to Accept, and a month calendar of classes, trainings, meetings and events. Alexandra (Pretty Report or her own app)
   and Rose can send requests and add events. Server: taffeta-apps-scripts desk/Calendar.js.
   Uses the app's own h(), render(), HUB, API(), S, ymd(), niceDay() at call time. */
(function(){
const TC={month:'',sel:'',past:false,form:null,busy:'',msg:'',ans:false};
const ADM={data:null,err:null,busy:false,msg:''};
const KINDS=['Class','Training','Meeting','Event','Save The Date','Update'];
const ASK_KINDS=['Class','Training','Meeting'];
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const ERR={caltitle:'Add a title.',caldate:'Pick the day.',calgone:'That one was taken down.',cal:'Only Alexandra and Rose can add to the calendar.',bad:'That didn’t go through. Try again.'};
const pad=n=>('0'+n).slice(-2);
const dOf=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const t12=v=>{if(!v)return'';const [H,M]=v.split(':').map(Number);return (H%12||12)+(M?':'+pad(M):'')+(H<12?' AM':' PM')};
const when=e=>(e.start?t12(e.start)+(e.end?' – '+t12(e.end):''):'All day');
const longDay=s=>dOf(s).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
function gLink(e){
  const d=e.date.replace(/-/g,''), tt=v=>v.replace(':','')+'00';
  let dates;
  if(e.start){const end=e.end||(()=>{const [H,M]=e.start.split(':').map(Number);return pad(Math.min(23,H+1))+':'+pad(M)})();dates=d+'T'+tt(e.start)+'/'+d+'T'+tt(end)}
  else{const n=dOf(e.date);n.setDate(n.getDate()+1);dates=d+'/'+ymd(n).replace(/-/g,'')}
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(e.title)+'&dates='+dates+'&ctz=America/New_York'+
    (e.where?'&location='+encodeURIComponent(e.where):'')+(e.details?'&details='+encodeURIComponent(e.details):'');
}
const today=()=>ymd(new Date());

/* ---- pieces ---- */
function evRow(e,o){
  const dt=dOf(e.date), past=e.date<today();
  const status=e.ask?(e.mine==='Accepted'?h('span',{class:'tc-pill on'},'Accepted ✓'):e.mine?h('span',{class:'tc-pill'},'Can’t Make It'):h('span',{class:'tc-pill wait'},'Needs Your Answer')):null;
  return h('div',{class:'tc-ev'+(past?' past':'')},
    h('div',{class:'tc-date'},h('small',{},dt.toLocaleDateString('en-US',{month:'short'})),h('b',{},dt.getDate())),
    h('div',{class:'tc-evtx'},
      h('span',{class:'tc-kind'},e.kind),
      h('b',{class:'tc-title'},e.title),
      h('small',{},dt.toLocaleDateString('en-US',{weekday:'long'})+' · '+when(e)+(e.where?' · '+e.where:'')),
      e.details?h('p',{class:'tc-det'},e.details):null,
      o&&o.admin?h('small',{class:'tc-who'},'For: '+e.forNames+(e.ask?' · Accepted: '+(e.yes.length?e.yes.join(', '):'nobody yet')+(e.no.length?' · Can’t: '+e.no.join(', '):'')+(e.waiting.length?' · Waiting on: '+e.waiting.join(', '):''):'')):null,
      h('div',{class:'tc-acts'},
        !o||!o.admin?status:null,
        (!e.ask||e.mine==='Accepted')&&!past&&!(o&&o.admin)?h('a',{class:'tdlink',href:gLink(e),target:'_blank',rel:'noopener'},'Add To My Google Calendar'):null,
        o&&o.onDel?h('button',{class:'tdlink',disabled:TC.busy?'':null,onclick:()=>{if(confirm('Take “'+e.title+'” off the calendar for everyone?'))o.onDel(e)}},'Remove'):null)));
}
function inviteBox(e,send){
  return h('div',{class:'tc-invite'},
    h('span',{class:'lbl'},'You’re Invited · '+e.kind),
    h('b',{class:'tc-title',style:'font-size:20px'},e.title),
    h('span',{},longDay(e.date)+' · '+when(e)),
    e.where?h('span',{class:'soft'},e.where):null,
    e.details?h('p',{class:'tc-det'},e.details):null,
    h('small',{class:'soft'},'From '+(e.by||'Alexandra')),
    h('div',{class:'tc-yn'},
      h('button',{class:'obtn sm',disabled:TC.busy?'':null,onclick:()=>send({type:'calans',id:e.id,answer:'yes'},'Thank you! It’s on your calendar.')},'Accept'),
      h('button',{class:'obtn sm ghost',disabled:TC.busy?'':null,onclick:()=>send({type:'calans',id:e.id,answer:'no'},'Got it. Alexandra will see your answer.')},'Can’t Make It')));
}
function monthGrid(events){
  if(!TC.month) TC.month=today().slice(0,7);
  const [y,m]=TC.month.split('-').map(Number), first=new Date(y,m-1,1), days=new Date(y,m,0).getDate();
  const byDay={}; events.forEach(e=>{(byDay[e.date]=byDay[e.date]||[]).push(e)});
  const step=n=>{const d=new Date(y,m-1+n,1);TC.month=d.getFullYear()+'-'+pad(d.getMonth()+1);TC.sel='';render()};
  const cells=[];
  for(let i=0;i<first.getDay();i++) cells.push(h('span',{class:'tc-cell blank'}));
  for(let d=1;d<=days;d++){
    const k=y+'-'+pad(m)+'-'+pad(d), evs=byDay[k]||[];
    const need=evs.some(e=>e.ask&&!e.mine);
    cells.push(h('button',{type:'button',class:'tc-cell'+(k===today()?' today':'')+(evs.length?' has':'')+(TC.sel===k?' sel':''),
      'aria-label':longDay(k)+(evs.length?', '+evs.length+' on the calendar':''),onclick:()=>{TC.sel=TC.sel===k?'':k;render()}},
      h('span',{class:'n'},d),evs.length?h('span',{class:'dots'},evs.slice(0,3).map(e=>h('i',{class:need?'need':(e.kind==='Save The Date'?'std':'')}))):null));
  }
  return h('div',{class:'tc-month'},
    h('div',{class:'tc-mhead'},h('button',{type:'button',class:'tc-arrow','aria-label':'Last month',onclick:()=>step(-1)},'‹'),
      h('b',{},MON[m-1]+' '+y),h('button',{type:'button',class:'tc-arrow','aria-label':'Next month',onclick:()=>step(1)},'›')),
    h('div',{class:'tc-grid'},['S','M','T','W','T','F','S'].map(x=>h('span',{class:'tc-dow'},x)),cells));
}
function form(F,people,save,cancel){
  const set=k=>e=>{F[k]=e.target.value};
  const isUp=F.kind==='Update';
  const groups=[['Everyone',()=>people.map(p=>p.slug)],['Estheticians',()=>people.filter(p=>p.group==='esthetician').map(p=>p.slug)],
    ['Stylists',()=>people.filter(p=>p.group==='stylist').map(p=>p.slug)],['Associates',()=>people.filter(p=>p.group==='associate').map(p=>p.slug)]];
  const all=F.who.length===people.length;
  return h('div',{class:'card2 tc-form'},
    h('span',{class:'lbl'},isUp?'Add An Update':'Send A Meeting Or Class Request'),
    h('div',{class:'fld'},'What is it?',h('div',{class:'seg tc-kinds'},KINDS.map(k=>h('button',{type:'button','aria-pressed':String(F.kind===k),
      onclick:()=>{F.kind=k;F.ask=ASK_KINDS.includes(k);render()}},k)))),
    h('label',{class:'fld'},isUp?'The update':'Title',isUp?h('textarea',{rows:'4',maxlength:'1500',placeholder:'Example: Star your go-to products in Prices → Home Care.',oninput:e=>{F.title=e.target.value.split('\n')[0].slice(0,120);F.details=e.target.value}},F.details)
      :h('input',{type:'text',maxlength:'120',value:F.title,placeholder:F.kind==='Save The Date'?'Example: Taffeta Holiday Party':'Example: BR Virtual Class',oninput:set('title')})),
    isUp?null:h('div',{class:'fld2'},h('label',{class:'fld'},'Day',h('input',{type:'date',value:F.date,oninput:set('date')})),
      h('label',{class:'fld'},'Where',h('input',{type:'text',value:F.where,maxlength:'200',placeholder:'Salon, Zoom…',oninput:set('where')}))),
    isUp?null:h('div',{class:'fld2'},h('label',{class:'fld'},'Starts',h('input',{type:'time',value:F.start,oninput:set('start')})),
      h('label',{class:'fld'},'Ends',h('input',{type:'time',value:F.end,oninput:set('end')}))),
    isUp?null:h('label',{class:'fld'},'Details (optional)',h('textarea',{rows:'3',maxlength:'1500',placeholder:F.kind==='Save The Date'?'Invite & details to follow.':'What to bring, Zoom link…',oninput:set('details')},F.details)),
    h('div',{class:'fld'},'Who is it for?',
      h('div',{class:'tc-chips'},groups.map(([g,fn])=>h('button',{type:'button',class:'tc-chip grp',onclick:()=>{F.who=fn();render()}},g)),
        h('button',{type:'button',class:'tc-chip grp',onclick:()=>{F.who=[];render()}},'Clear')),
      h('div',{class:'tc-chips'},people.map(p=>h('button',{type:'button',class:'tc-chip','aria-pressed':String(F.who.includes(p.slug)),
        onclick:()=>{F.who=F.who.includes(p.slug)?F.who.filter(x=>x!==p.slug):F.who.concat(p.slug);render()}},p.name))),
      h('small',{class:'soft'},all?'Everyone on the team':F.who.length?F.who.length+' picked':'Pick at least one person')),
    isUp?null:h('label',{class:'tc-check'},h('input',{type:'checkbox',checked:F.ask?'':null,onchange:e=>{F.ask=e.target.checked;render()}}),
      h('span',{},'Ask them to tap Accept. You get an email for each answer, and it goes on their Google Calendar when they accept.')),
    !isUp&&!F.ask?h('small',{class:'soft'},'It goes right on their app calendar and Google Calendar. No answer needed.'):null,
    TC.msg?h('p',{class:'toast'},TC.msg):null,
    h('div',{style:'display:flex;gap:10px;flex-wrap:wrap;justify-content:center'},
      h('button',{class:'obtn',disabled:TC.busy?'':null,onclick:save},TC.busy?'One moment…':isUp?'Post Update':F.ask?'Send Request':'Add To Calendar'),
      h('button',{class:'obtn ghost',onclick:cancel},'Cancel')));
}
const newForm=kind=>({kind:kind||'Class',title:'',date:'',start:'',end:'',where:'',details:'',who:[],ask:ASK_KINDS.includes(kind||'Class')});
function check(F,people){
  if(!String(F.title||'').trim()) return ERR.caltitle;
  if(F.kind!=='Update'&&!F.date) return ERR.caldate;
  if(!F.who.length) return 'Pick who it’s for.';
  return '';
}
const evOut=(F,people)=>({kind:F.kind,title:F.title.trim(),date:F.date,start:F.start,end:F.end,where:F.where,details:F.details,ask:F.ask,
  for:F.who.length===people.length?'Everyone':F.who});

/* ---- the whole section ---- */
function section(D,o){
  if(!D) return null;
  const t=today(), events=D.events||[], ups=D.updates||[];
  const fresh=ups.filter(u=>!u.old), old=ups.filter(u=>u.old);
  const out=[h('div',{class:'tc-head'},h('h2',{},'Taffeta Calendar'),h('span',{class:'tc-sub'},'Updates From Alex & Events'))];
  if(TC.msg&&!TC.form) out.push(h('p',{class:'toast'},TC.msg));
  // waiting on her answer
  if(!o.admin) events.filter(e=>e.ask&&!e.mine&&e.date>=t).forEach(e=>out.push(inviteBox(e,o.send)));
  // updates
  out.push(h('div',{class:'tc-ups'},h('span',{class:'lbl'},'Updates'),
    fresh.length?fresh.map(u=>h('div',{class:'ann'},h('p',{},u.details||u.title),h('small',{},(u.by||'Alexandra')+' · '+niceDay(ymd(new Date(u.sent)))))):h('p',{class:'soft',style:'margin:0'},'No new updates.'),
    old.length?h('button',{class:'tdlink',style:'align-self:flex-start',onclick:()=>{TC.past=!TC.past;render()}},TC.past?'Hide Past Updates':'Past Updates ('+old.length+')'):null,
    TC.past?old.map(u=>h('div',{class:'ann old'},h('p',{},u.details||u.title),h('small',{},niceDay(ymd(new Date(u.sent)))))):null));
  // calendar
  out.push(monthGrid(events));
  const list=TC.sel?events.filter(e=>e.date===TC.sel):events.filter(e=>e.date>=t).slice(0,6);
  out.push(h('div',{class:'tc-list'},h('span',{class:'lbl'},TC.sel?longDay(TC.sel):'Coming Up'),
    list.length?list.map(e=>evRow(e,o.admin?{admin:true,onDel:o.del}:null)):h('p',{class:'soft',style:'margin:0'},TC.sel?'Nothing on this day.':'Nothing coming up yet.')));
  // editors
  if(o.edit){
    const people=o.edit.people||[];
    if(TC.form) out.push(form(TC.form,people,()=>{const e=check(TC.form,people);if(e){TC.msg=e;render();return}
      o.add(evOut(TC.form,people))},()=>{TC.form=null;TC.msg='';render()}));
    else out.push(h('div',{class:'tc-adds'},
      h('button',{class:'obtn sm',onclick:()=>{TC.form=newForm('Class');TC.msg='';render()}},'+ Meeting Or Class Request'),
      h('button',{class:'obtn sm ghost',onclick:()=>{TC.form=newForm('Update');TC.msg='';render()}},'+ Add An Update')));
    if(!o.admin&&o.edit.all){
      const reqs=o.edit.all.filter(e=>e.ask&&e.date>=t);
      if(reqs.length) out.push(h('button',{class:'tdlink',onclick:()=>{TC.ans=!TC.ans;render()}},TC.ans?'Hide Who Answered':'See Who Answered ('+reqs.length+')'));
      if(TC.ans) reqs.forEach(e=>out.push(evRow(e,{admin:true,onDel:o.del})));
    }
  }
  return h('div',{class:'card2 tcal',id:'tcal'},out);
}

/* staff app: data rides on the hub GET (HUB.data.cal) */
async function staffSend(body,ok){
  const st=S.mine.staff; TC.busy='1'; render(); let j=null;
  try{const r=await fetch(API(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...body,slug:st.slug,t:st.t})});j=await r.json()}catch(e){}
  TC.busy=''; TC.msg=!j?'Can’t connect right now. Check your signal and try again.':j.ok?(ok||'Saved'):(ERR[j.error]||ERR.bad);
  if(j&&j.ok){TC.form=null}
  await hubGet(); render(); setTimeout(()=>{TC.msg='';render()},5000);
}
function card(){
  const D=HUB.data&&HUB.data.cal; if(!D) return null;
  return section(D,{send:staffSend,edit:D.edit||null,
    add:ev=>staffSend({type:'caladd',ev},ev.kind==='Update'?'Posted. Everyone sees it for 5 days.':ev.ask?'Sent! You’ll get an email as each one answers.':'Added to the calendar.'),
    del:e=>staffSend({type:'caldel',id:e.id},'Taken off the calendar.')});
}

/* The Pretty Report → Team → Taffeta Calendar */
async function admLoad(extra,ok){
  if(!S.hubKey||!API()){ADM.err='setup';render();return}
  ADM.busy=true;TC.busy='1';render();
  try{const r=await fetch(API()+'?admin='+encodeURIComponent(S.hubKey)+'&cal=1'+(extra||'')+'&by='+encodeURIComponent((window.prWho&&prWho())||'Alexandra')+'&_='+Date.now());
    const j=await r.json();if(!j.ok){TC.msg=ERR[j.error]||ERR.bad;throw 0}ADM.data=j;ADM.err=null;if(extra){TC.form=null;TC.msg=ok||'Saved'}}
  catch(e){if(!TC.msg)ADM.err='offline'}
  ADM.busy=false;TC.busy='';render();if(TC.msg)setTimeout(()=>{TC.msg='';render()},5000);
}
function adminView(){
  if(!ADM.data&&!ADM.busy&&!ADM.err) admLoad();
  const D=ADM.data;
  const out=[];
  if(!D) out.push(h('p',{class:'soft',style:'text-align:center'},ADM.err==='setup'?'The calendar isn’t connected yet.':ADM.err?'Can’t reach the calendar right now.':'Loading…'));
  else{
    const all=D.all||[];
    out.push(section({updates:all.filter(e=>e.kind==='Update').map(e=>({...e,details:e.details||e.title,old:Date.now()-e.sent>5*864e5})),
      events:all.filter(e=>e.kind!=='Update')},{admin:true,edit:D,
      add:ev=>admLoad('&caladd='+encodeURIComponent(JSON.stringify(ev)),ev.kind==='Update'?'Posted. Everyone sees it for 5 days.':ev.ask?'Sent! You’ll get an email as each one answers.':'Added to the calendar.'),
      del:e=>admLoad('&caldel='+encodeURIComponent(e.id),'Taken off the calendar.')}));
  }
  out.push(h('p',{class:'soft',style:'text-align:center;font-size:13px'},'Everything here shows in the girls’ apps under Taffeta Calendar. Updates show for 5 days, then move to Past Updates. Rose can send requests from her app too.'));
  return [h('div',{class:'hub'},out)];
}
window.TCal={card,adminView,reload:()=>{ADM.data=null;ADM.err=null}};
})();
