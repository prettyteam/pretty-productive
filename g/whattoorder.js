/* What To Order (Alexandra, Nov 2 2026): one straightforward page for Rose's Monday inventory and ordering, and the Front Desk.
   Three lists behind big buttons: Retail (the weekly Retail Inventory Report's reorder list), Color & Backbar (the color
   report's order list, only for people who have it) and On The Way (vendor orders from the info@ order emails, with the
   arrival date when a shipping email gives one). Each order list is grouped by the store we buy it from, with that store's
   button right there. Anything already ordered leaves the order lists and shows under On The Way.
   WhatToOrder.html({inv, report, mode, logins, countsHint}) returns the page as HTML.
   inv = the desk script's ?inv reply (g/inventory.js shape), or null while it loads; report = the color report (R), or null.
   The full store page (g/ordering.js: every store, logins, Amazon lists, Rossano Ferretti) folds in at the bottom. */
(function(){
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  /* where each retail brand is bought (Alexandra, Oct 28 2026). A brand not listed here shows under "Ask Alex Where To Order". */
  const STORE_OF=[[/k18/i,'SalonCentric'],[/davines/i,'Ethos'],[/igk/i,'DePasquale'],[/goldwell|alter ego/i,'DePasquale'],[/brazilian blowout/i,'Paramount'],
    [/blondor|wella/i,'CosmoProf'],[/rossano|ferretti/i,'Rossano Ferretti']];
  const URL={DePasquale:'https://cl.depasqualesalonsystems.com',SalonCentric:'https://www.saloncentric.com',Paramount:'https://www.paramountbeauty.com',
    Ethos:'https://www.ethosbeauty.com',CosmoProf:'https://www.cosmoprofbeauty.com/login'};
  const ASK='Ask Alex Where To Order';
  const storeOf=t=>{const m=STORE_OF.find(([re])=>re.test(t));return m?m[1]:ASK};
  const n=x=>Number(x)||0;
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day=d=>{const x=new Date(String(d)+'T12:00:00');return isNaN(x)?String(d):MON[x.getMonth()]+' '+x.getDate()};
  /* arrival date: the daily order-email job writes it into Status, like "Shipped · arrives Nov 5" or "Delivered" */
  const arrives=s=>{const m=/arriv\w*\s+(?:on\s+|by\s+)?([A-Z][a-z]{2,8}\.?\s+\d{1,2})/i.exec(s||'');return m?m[1].replace('.',''):''};
  const css='<style>.wto{display:grid;gap:18px;max-width:640px;width:100%;min-width:0;overflow-wrap:anywhere}.wto *{box-sizing:border-box}.wto h1{margin:0}.wto p{margin:0;font-size:13.5px;color:var(--soft,#5f5b55)}'
    +'.wto .wpick{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}'
    +'.wto .wpick button{font:inherit;text-align:left;cursor:pointer;background:var(--card,#fff);color:var(--ink,#121212);border:1px solid var(--line,#e2ded5);border-radius:6px;padding:14px 12px;display:grid;gap:2px}'
    +'.wto .wpick b{font-family:var(--display,Georgia,serif);font-size:30px;font-weight:400;line-height:1}.wto .wpick span{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600}'
    +'.wto .wpick small{color:var(--soft,#5f5b55);font-size:12.5px}.wto .wpick button[aria-pressed="true"]{background:var(--ink,#121212);color:#fff;border-color:var(--ink,#121212)}.wto .wpick button[aria-pressed="true"] small{color:#fff;opacity:.75}'
    +'.wto .wback{font:inherit;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;cursor:pointer;background:none;color:var(--ink,#121212);border:1px solid var(--ink,#121212);border-radius:6px;padding:12px;justify-self:start}'
    +'.wto .wv{display:grid;gap:12px}.wto .wv[hidden]{display:none}.wto .wst{background:var(--card,#fff);border:1px solid var(--line,#e2ded5);border-radius:6px;padding:14px;display:grid;gap:4px}'
    +'.wto .wst .top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px}.wto h2{margin:0;font-family:var(--display,Georgia,serif);font-weight:500;font-size:19px;letter-spacing:0;text-transform:none}'
    +'.wto .wst a{text-decoration:none;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;background:var(--ink,#121212);color:#fff;border-radius:4px;padding:8px 12px;white-space:nowrap}'
    +'.wto .wr{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:9px 0;border-top:1px solid var(--line,#e2ded5);font-size:14px}.wto .wr>span:first-child{flex:1;min-width:0}.wto .wr .qty{flex:none;font-family:var(--display,Georgia,serif);font-size:20px;line-height:1.1;min-width:34px;text-align:right}.wto .wnote{font-size:13px;color:var(--soft,#5f5b55);padding:8px 0;border-top:1px solid var(--line,#e2ded5)}.wto .wr small{display:block;color:var(--soft,#5f5b55);font-size:12.5px}'
    +'.wto .q{flex:none;max-width:45%;text-align:center;white-space:normal;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;border-radius:12px;padding:4px 10px;background:#fbefdc;color:#8a5a12}.wto .q.r{background:#f7e3e1;color:#8a2a22}.wto .q.g{background:#e3efe6;color:#2f5d46}.wto .q.b{background:#e9edf5;color:#3e4f6e}'
    +'.wto details.wmore{border:1px solid var(--line,#e2ded5);border-radius:6px;background:var(--card,#fff);padding:0 14px}.wto details.wmore>summary{list-style:none;cursor:pointer;display:flex;align-items:center;padding:14px 0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600}'
    +'.wto details.wmore>summary::-webkit-details-marker{display:none}.wto details.wmore>summary:after{content:"+";margin-left:auto;font-size:18px;font-weight:400}.wto details.wmore[open]>summary:after{content:"–"}.wto details.wmore>div{padding:0 0 14px}'
    +'.wto .wcbtn{cursor:pointer;border:0;font-family:inherit;min-height:36px}.wto .wcin{display:flex;gap:6px;flex:none}.wto .wcin[hidden],.wto .cdone[hidden]{display:none}'
    +'.wto .wcin input{width:72px;font:inherit;font-size:18px;padding:6px 8px;border:1px solid var(--ink,#121212);border-radius:6px}.wto .wcsave{font:inherit;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;background:var(--ink,#121212);color:#fff;border:0;border-radius:6px;padding:0 12px;cursor:pointer}'
    +'.wto .cdone{color:#2f5d46!important;font-weight:600}.wto .wbr{margin:12px 0 0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--green,#2f5d46)}.wto .wc.err .cdone{color:#8a2a22!important}'
    +'.wto .wpick button:focus-visible,.wto .wst a:focus-visible{outline:2px solid var(--gold,#4a3426);outline-offset:2px}</style>';
  /* not used at Taffeta, never on a list (Alexandra, Nov 2 2026) */
  const NOUSE=/color\s*renew|6n\s*@\s*gb/i;
  /* Rose, Nov 3 2026: no "used more than was counted Oct 12–14 ... so these were restocked" lines on the lists */
  const DROPNOTE=/used more|restocked|counted 0 or 1/i;
  /* Count These First, Rose, Nov 3 2026: each brand in its own section, shades in level order, one row per shade.
     "Shades EQ 06N Moroccan Sand" and "Shades EQ 6N" are the same shade (leading zero and the color's name don't count),
     and every Blondor item (Free Lites powder and so on) is one row, "Wella Blondor". */
  const BRANDS=[[/shades\s*eq/i,'Redken Shades EQ'],[/colorance/i,'Goldwell Colorance'],[/topchic/i,'Goldwell Topchic'],[/alter\s*ego/i,'Alter Ego'],
    [/blondor/i,'Wella Blondor'],[/developer|\bvol\b/i,'Developer']];
  /* brand found last-to-first, so "Topchic 20 vol developer" lands under Developer */
  const SHADE_DIR=1;   /* 1 = lightest to darkest (level 10 first), -1 = darkest to lightest */
  const shadeOf=nm=>{const t=String(nm||'').trim(),b=BRANDS.slice().reverse().find(([re])=>re.test(t)),brand=b?b[1]:(t.split(/\s+/)[0]||'Other');
    if(brand==='Wella Blondor')return{brand,key:brand,lvl:0,code:'',name:'Wella Blondor'};
    const m=/(?:^|\s)0*(\d{1,2})(\/\d+|[A-Z@]*[A-Z])?(?=\s|$)/.exec(t.replace(/\b(redken|goldwell|wella)\b/ig,''));
    const code=m?(m[1]+(m[2]||'')).toUpperCase():'',lvl=m?+m[1]:0;
    return{brand,key:brand+'|'+(code||t.toLowerCase()),lvl,code,name:t}};
  const row=(name,detail,pill,kind)=>'<div class="wr"><span><b>'+esc(name)+'</b>'+(detail?'<small>'+esc(detail)+'</small>':'')+'</span>'+(pill?'<span class="q'+(kind?' '+kind:'')+'">'+esc(pill)+'</span>':'')+'</div>';
  /* The color report writes each store's order as one sentence, like "Topchic 6NN ×2, 7NN ×2; Colorance 7N ×1. Skip anything
     already on order." (Nov 2 2026: Alexandra asked for one line per item instead of a paragraph.) parseList splits it into
     items [{name, qty}] (a short name like "7NN" gets the brand from the item before it) and plain notes. */
  const parseList=t=>{const items=[],notes=[];
    String(t||'').split(/(?<=\.)\s+(?=[A-Z])/).forEach(sen=>{sen=sen.trim().replace(/\.$/,'');if(!sen)return;
      let intro='',body=sen;const c=sen.indexOf(':');if(c>0){intro=sen.slice(0,c);body=sen.slice(c+1)}
      const parts=body.split(/[;,]/).map(x=>x.trim()).filter(Boolean);
      const listy=parts.length>1||/[×x]\s*\d+\s*$/.test(body.trim());
      if(!listy){notes.push(sen);return}
      if(intro)notes.push(intro);
      let brand='';body.split(';').forEach(seg=>{brand='';seg.split(',').map(x=>x.trim()).filter(Boolean).forEach(it=>{
        const m=/^(.*?)\s*[×x]\s*(\d+)$/.exec(it);let nm=m?m[1]:it;const q=m?m[2]:'';
        const w=nm.split(/\s+/);if(w.length===1&&brand)nm=brand+' '+nm;else if(w.length>1)brand=w.slice(0,-1).join(' ');
        items.push({name:nm,qty:q})})})});
    return{items,notes}};
  const qrow=(name,qty,detail)=>'<div class="wr"><span><b>'+esc(name)+'</b>'+(detail?'<small>'+esc(detail)+'</small>':'')+'</span>'+(qty?'<span class="qty">×'+esc(qty)+'</span>':'')+'</div>';
  const note=t=>'<div class="wnote">'+esc(t)+'</div>';
  const storeCard=(st,rows,note)=>'<div class="wst"><div class="top"><h2>'+esc(st)+'</h2>'+(URL[st]?'<a href="'+esc(URL[st])+'" target="_blank" rel="noopener">Open Store</a>':'')+'</div>'+(note?'<p>'+esc(note)+'</p>':'')+rows.join('')+'</div>';
  const byStore=list=>{const g={};list.forEach(([st,r])=>(g[st]||=[]).push(r));
    const keys=Object.keys(g).sort((a,b)=>(a===ASK)-(b===ASK)||a.localeCompare(b));return keys.map(k=>[k,g[k]])};
  const left=(oh,w)=>oh<0?'Paired Plus shows '+oh+', count the shelf':(oh+' on hand'+(w>0&&w<8?' · about '+Math.max(1,Math.round(w))+' wk left':''));
  let view='retail';
  function html(o){
    o=o||{};
    const D=o.inv, R=o.report, I=window.Inventory;
    const oo=(D&&D.onOrder)||[], isOn=t=>I&&I.onOrder?I.onOrder(t,oo):null;
    /* Retail: the reorder list, minus anything on order; "count first" rows get their own card */
    const ret=[], cnt=[];
    ((D&&D.reorder)||[]).slice().sort((a,b)=>n(b[6])-n(a[6])).forEach(([br,it,oh,ytd,d30,w,q,note])=>{
      if(isOn(br+' '+it)) return;
      const count=n(oh)<0||/count/i.test(note||'');
      const r=row(it,br+' · '+left(n(oh),n(w))+(ytd?' · '+ytd+' sold this year':''),count?'Count, then '+q:'Order '+q,count?'b':n(oh)<=0?'r':'');
      (count?cnt:ret).push([storeOf(br+' '+it),r]);});
    const retailCards=byStore(ret).map(([s,rs])=>storeCard(s,rs,s===ASK?'No store saved for these yet.':''))
      .concat(cnt.length?[storeCard('Count First',cnt.map(x=>x[1]),'Paired Plus shows a wrong count. Count the shelf, then order if it’s low.')]:[]);
    /* Color & Backbar: the color report's order list (store, what to order), minus stores already on order this week */
    const back=[];
    let backN=0;
    ((R&&R.order)||[]).forEach(([s,x])=>{const on=oo.filter(q=>String(q[1]).toLowerCase()===String(s).toLowerCase()),L=parseList(x);backN+=L.items.length||1;
      if(on.length) back.push([String(s),note('Already ordered '+day(on[0][0])+': '+on.map(q=>q[3]).join(', ')+'. Check On The Way before ordering more.')]);
      L.notes.filter(t=>!DROPNOTE.test(t)).forEach(t=>back.push([String(s),note(t+'.')]));
      /* Recount first card: each shade gets its own Count button too (Alexandra, Nov 2 2026) */
      const inStore=[];
      L.items.filter(it=>!NOUSE.test(it.name)).forEach(it=>{const sh=shadeOf(it.name);if(inStore.includes(sh.key))return;inStore.push(sh.key);   /* one row per shade, one Wella Blondor (Nov 3 2026) */
        const nm=sh.brand==='Wella Blondor'?sh.name:it.name;back.push([String(s),/recount/i.test(s)?{cnt:nm}:qrow(nm,it.qty,'')])});});
    const prices=(R&&R.prices)||[];
    /* Count These First (Alexandra, Nov 2 2026): the estimate is the last shelf count minus SureTint bowls, so unweighed bowls make it
       read high. Each Monday Rose counts what the list says to order plus the fastest-used shades, and types it in Backbar counts. */
    const fast=((R&&R.fastest)||[]).filter(f=>!NOUSE.test(f.join(' '))).slice(0,8);
    const fmt=v=>{const x=Math.round((+v||0)*10)/10;return String(x)};
    const norm=t=>String(t||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const ohOf=(l,p)=>((R&&R.onHand)||[]).find(r=>norm(r[1])===norm(p)&&(norm(l).includes(norm(r[0]).slice(0,6))||norm(r[0]).includes(norm(l).slice(0,6))));
    /* Tap Count to type what's on the shelf (Alexandra, Nov 2 2026). Saved to the Stock Counts tab through the host app's
       WhatToOrder.saveCount(id, item, n); o.counts = {id: {n, at}} shows the last count. */
    const C=o.counts||{};
    const crow=(name,detail,ids)=>{const id='c:'+norm(name),c=(ids||[id]).map(k=>C[k]).filter(Boolean)[0];
      return '<div class="wr wc" data-cid="'+esc(id)+'" data-citem="'+esc(name)+'"><span><b>'+esc(name)+'</b><small>'+esc(detail)+'</small>'
        +'<small class="cdone"'+(c?'':' hidden')+'>'+(c?'Counted '+esc(c.n)+(c.at?' · '+esc(c.at):''):'')+'</small></span>'
        +'<button type="button" class="q b wcbtn"'+(o.canCount?'':' disabled')+'>'+(c?'Recount':'Count')+'</button>'
        +'<span class="wcin" hidden><input type="number" inputmode="numeric" min="0" max="9999" aria-label="How many on the shelf"><button type="button" class="wcsave">Save</button></span></div>'};
    /* every shade to count (order list + fastest-used), merged by brand and shade code, then grouped and sorted */
    const toCount=[];
    ((R&&R.order)||[]).forEach(([s,x])=>parseList(x).items.filter(it=>!NOUSE.test(it.name)).forEach(it=>toCount.push({nm:it.name,det:(/recount/i.test(s)?'Recount':s)+(it.qty?' · order '+it.qty:'')})));
    fast.forEach(([l,p,u])=>{const x=ohOf(l,p);toCount.push({nm:l+' '+p,det:'About '+u+' used a week'+(x?' · estimate '+fmt(x[4])+' on hand':'')})});
    const merged=[];
    toCount.forEach(t=>{const sh=shadeOf(t.nm),had=merged.find(m=>m.key===sh.key);
      if(!had){merged.push({...sh,ids:['c:'+norm(t.nm)],det:t.det});return}
      had.ids.push('c:'+norm(t.nm));
      if(sh.brand!=='Wella Blondor'&&sh.name.length<had.name.length)had.name=sh.name;   /* keep the plain "6N" name, not "6N Moroccan Sand" */
      if(!/order/.test(had.det)&&/order/.test(t.det))had.det=t.det});
    merged.forEach(m=>{const k='c:'+norm(m.name);m.ids=[k].concat(m.ids.filter(x=>x!==k))});
    const bOrder=b=>{const i=BRANDS.findIndex(x=>x[1]===b);return i<0?BRANDS.length:i};
    merged.sort((a,b)=>bOrder(a.brand)-bOrder(b.brand)||a.brand.localeCompare(b.brand)
      ||(a.brand==='Developer'?a.lvl-b.lvl:SHADE_DIR*(b.lvl-a.lvl))||a.code.localeCompare(b.code));
    let lastB='';
    const cfRows=merged.map(m=>{const head=m.brand!==lastB?'<h3 class="wbr">'+esc(m.brand)+'</h3>':'';lastB=m.brand;return head+crow(m.name,m.det,m.ids)}).join('');
    const countFirst=merged.length?'<div class="wst"><div class="top"><h2>Count These First</h2><span class="q b">Mondays</span></div>'
      +'<p>These counts are estimates: the last shelf count minus every bowl weighed in SureTint. A bowl that wasn’t weighed never comes off, so count these on the shelf. Tap Count, type how many are there, and tap Save.</p>'
      +cfRows+'</div>':'';
    /* Color on hand (R.onHand, Nov 2 2026): [line, shade, counted, used since, on hand, per week, weeks left] */
    const OH=((R&&R.onHand)||[]).filter(r=>!NOUSE.test(r.join(' ')));
    const ohCard=OH.length?'<details class="wmore"><summary>Color &amp; Backbar On Hand</summary><div><p>Estimates: Rose’s last count minus SureTint use since then.</p>'
      +OH.slice().sort((a,b)=>(+a[6]||99)-(+b[6]||99)).map(([l,sh,c,u,oh,pw,wl])=>row(l+' '+sh,'Counted '+fmt(c)+' · used '+fmt(u)+' since'+(+wl?' · about '+Math.round(+wl)+' wk left':''),fmt(oh)+' on hand',+oh<=0?'r':+wl&&+wl<3?'':'g')).join('')+'</div></details>':'';
    const backCards=byStore(back).filter(([s])=>!(countFirst&&/recount/i.test(s))).map(([s,rs])=>storeCard(s,rs.map(r=>typeof r==='string'?r:crow(r.cnt,'Count it on the shelf')).concat(prices.filter(p=>String(p[1]).toLowerCase()===s.toLowerCase()).map(([i,,p])=>row(i,'Best price here',p,'g')))));
    /* On The Way: one card per order */
    const ords={};oo.forEach(q=>(ords[q[1]+'|'+q[2]+'|'+q[0]]||=[]).push(q));
    const wayCards=Object.keys(ords).map(k=>{const [st,num,d]=k.split('|'),its=ords[k],s=its[0][5]||'Ordered',a=arrives(s);
      return '<div class="wst"><div class="top"><h2>'+esc(st)+'</h2><span class="q '+(a?'g':'b')+'">'+esc(a?'Arrives '+a:/ship/i.test(s)?'Shipped':s)+'</span></div><p>Ordered '+esc(day(d))+(num?' · #'+esc(num):'')+'</p>'
        +its.map(q=>row(q[3],'',q[4]?'Qty '+q[4]:'','g')).join('')+'</div>'});
    /* Nov 2 2026: the Color & Backbar button always shows, even when this week's report has no order list or this app has no color report */
    const noColor=!R?'<p>The color list comes from the weekly color report, which opens in Rose’s app and Alex’s. Ask Rose what color to order this week.</p>':'';
    const btn=(k,label,count,sub)=>'<button type="button" data-wto="'+k+'" aria-pressed="'+(view===k)+'"><span>'+label+'</span><b>'+count+'</b><small>'+sub+'</small></button>';
    const v=(k,body)=>'<div class="wv" data-wtov="'+k+'"'+(view===k?'':' hidden')+'>'+body+'<button type="button" class="wback" data-wtoback>Back To All Lists</button></div>';
    const loading=!D?'<p>'+(o.err?'Couldn’t open the inventory report right now. Check the Wi-Fi and try again.':'Opening the inventory report…')+'</p>':'';
    let h=css+'<div class="wto"><div><h1>What To Order</h1><p>'+(D&&D.asOf?'Retail from the inventory report dated '+esc(String(D.asOf).replace(/,\s*\d{4}$/,''))+'. ':'')
      +(R&&R.week?'Color from the week of '+esc(R.week)+'. ':'')+'A new report comes in every week, so Monday is the day to order.</p></div>'
      +'<div class="wpick" role="group" aria-label="Choose a list">'+btn('retail','Retail',ret.length+cnt.length,'for the shelf')
      +btn('back','Color & Backbar',backN,'color and supplies')+btn('way','On The Way',Object.keys(ords).length,Object.keys(ords).length===1?'order':'orders')+'</div>'
      +v('retail',loading||(retailCards.length?'<p>Grouped by where we buy it. Open the store and order the amount shown.</p>'+retailCards.join(''):'<p>Nothing to reorder this week.</p>'))
      +v('back',noColor||(countFirst+(backCards.length?'<p>From this week’s color report.</p>'+backCards.join(''):'<p>Nothing on this week’s color order list.</p>')+ohCard))
      +v('way',wayCards.length?'<p>From the order emails in info@. Don’t order these again. When a box comes in, receive it in Paired Plus.</p>'+wayCards.join(''):'<p>Nothing on the way right now.</p>')
      +(o.countsHint?'<p>'+esc(o.countsHint)+'</p>':'');
    if(window.Ordering) h+='<details class="wmore"><summary>All Stores, Logins &amp; Amazon Lists</summary><div>'+Ordering.html(o.mode||'full',prices,o.logins).replace(/<h1>Ordering<\/h1>/,'')+'</div></details>';
    return h+'</div>';
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('.wcbtn,.wcsave'); if(!t) return;
    const r=t.closest('.wc'), inBox=r.querySelector('.wcin'), inp=inBox.querySelector('input'), done=r.querySelector('.cdone'), btn=r.querySelector('.wcbtn');
    if(t.classList.contains('wcbtn')){btn.hidden=true;inBox.hidden=false;inp.focus();return}
    const n=Number(inp.value); if(inp.value===''||!(n>=0&&n<=9999)||Math.floor(n)!==n){inp.focus();return}
    t.disabled=true; t.textContent='Saving';
    Promise.resolve(window.WhatToOrder.saveCount?window.WhatToOrder.saveCount(r.dataset.cid,r.dataset.citem,n):Promise.reject())
      .then(()=>{r.classList.remove('err');done.textContent='Counted '+n+' · just now';done.hidden=false;inBox.hidden=true;btn.hidden=false;btn.textContent='Recount'})
      .catch(()=>{r.classList.add('err');done.textContent='Didn’t save. Check the Wi-Fi and tap Save again.';done.hidden=false})
      .then(()=>{t.disabled=false;t.textContent='Save'});
  });
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest&&e.target.closest('.wcin')){const b=e.target.closest('.wcin').querySelector('.wcsave');if(b)b.click()}});
  document.addEventListener('click',e=>{
    const bk=e.target.closest&&e.target.closest('[data-wtoback]');
    if(bk){const box=bk.closest('.wto'),pk=box&&box.querySelector('.wpick');if(pk) pk.scrollIntoView({behavior:'smooth',block:'start'});return}
    const b=e.target.closest&&e.target.closest('[data-wto]'); if(!b) return;
    view=b.dataset.wto; const box=b.closest('.wto'); if(!box) return;
    box.querySelectorAll('[data-wto]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    box.querySelectorAll('[data-wtov]').forEach(x=>{x.hidden=x.dataset.wtov!==view});
    const open=box.querySelector('[data-wtov="'+view+'"]'); if(open&&open.getBoundingClientRect().top>window.innerHeight*0.6) open.scrollIntoView({behavior:'smooth',block:'start'});
  });
  window.WhatToOrder=Object.assign(window.WhatToOrder||{},{html,storeOf,arrives});
})();
