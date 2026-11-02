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
  const css='<style>.wto{display:grid;gap:18px;max-width:640px}.wto h1{margin:0}.wto p{margin:0;font-size:13.5px;color:var(--soft,#5f5b55)}'
    +'.wto .wpick{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}'
    +'.wto .wpick button{font:inherit;text-align:left;cursor:pointer;background:var(--card,#fff);color:var(--ink,#121212);border:1px solid var(--line,#e2ded5);border-radius:6px;padding:14px 12px;display:grid;gap:2px}'
    +'.wto .wpick b{font-family:var(--display,Georgia,serif);font-size:30px;font-weight:400;line-height:1}.wto .wpick span{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600}'
    +'.wto .wpick small{color:var(--soft,#5f5b55);font-size:12.5px}.wto .wpick button[aria-pressed="true"]{background:var(--ink,#121212);color:#fff;border-color:var(--ink,#121212)}.wto .wpick button[aria-pressed="true"] small{color:#fff;opacity:.75}'
    +'.wto .wv{display:grid;gap:12px}.wto .wst{background:var(--card,#fff);border:1px solid var(--line,#e2ded5);border-radius:6px;padding:14px;display:grid;gap:4px}'
    +'.wto .wst .top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px}.wto h2{margin:0;font-family:var(--display,Georgia,serif);font-weight:500;font-size:19px;letter-spacing:0;text-transform:none}'
    +'.wto .wst a{text-decoration:none;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;background:var(--ink,#121212);color:#fff;border-radius:4px;padding:8px 12px;white-space:nowrap}'
    +'.wto .wr{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:9px 0;border-top:1px solid var(--line,#e2ded5);font-size:14px}.wto .wr>span{min-width:0}.wto .wr small{display:block;color:var(--soft,#5f5b55);font-size:12.5px}'
    +'.wto .q{white-space:nowrap;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;border-radius:12px;padding:4px 10px;background:#fbefdc;color:#8a5a12}.wto .q.r{background:#f7e3e1;color:#8a2a22}.wto .q.g{background:#e3efe6;color:#2f5d46}.wto .q.b{background:#e9edf5;color:#3e4f6e}'
    +'.wto details.wmore{border:1px solid var(--line,#e2ded5);border-radius:6px;background:var(--card,#fff);padding:0 14px}.wto details.wmore>summary{list-style:none;cursor:pointer;display:flex;align-items:center;padding:14px 0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600}'
    +'.wto details.wmore>summary::-webkit-details-marker{display:none}.wto details.wmore>summary:after{content:"+";margin-left:auto;font-size:18px;font-weight:400}.wto details.wmore[open]>summary:after{content:"–"}.wto details.wmore>div{padding:0 0 14px}'
    +'.wto .wpick button:focus-visible,.wto .wst a:focus-visible{outline:2px solid var(--gold,#4a3426);outline-offset:2px}</style>';
  const row=(name,detail,pill,kind)=>'<div class="wr"><span><b>'+esc(name)+'</b>'+(detail?'<small>'+esc(detail)+'</small>':'')+'</span>'+(pill?'<span class="q'+(kind?' '+kind:'')+'">'+esc(pill)+'</span>':'')+'</div>';
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
    ((R&&R.order)||[]).forEach(([s,x])=>{const on=oo.filter(q=>String(q[1]).toLowerCase()===String(s).toLowerCase());
      back.push([String(s),row(x,on.length?'Already ordered '+day(on[0][0])+': '+on.map(q=>q[3]).join(', '):'',on.length?'Check On The Way':'To order',on.length?'g':'')]);});
    const prices=(R&&R.prices)||[];
    const backCards=byStore(back).map(([s,rs])=>storeCard(s,rs.concat(prices.filter(p=>String(p[1]).toLowerCase()===s.toLowerCase()).map(([i,,p])=>row(i,'Best price here',p,'g')))));
    /* On The Way: one card per order */
    const ords={};oo.forEach(q=>(ords[q[1]+'|'+q[2]+'|'+q[0]]||=[]).push(q));
    const wayCards=Object.keys(ords).map(k=>{const [st,num,d]=k.split('|'),its=ords[k],s=its[0][5]||'Ordered',a=arrives(s);
      return '<div class="wst"><div class="top"><h2>'+esc(st)+'</h2><span class="q '+(a?'g':'b')+'">'+esc(a?'Arrives '+a:/ship/i.test(s)?'Shipped':s)+'</span></div><p>Ordered '+esc(day(d))+(num?' · #'+esc(num):'')+'</p>'
        +its.map(q=>row(q[3],'',q[4]?'Qty '+q[4]:'','g')).join('')+'</div>'});
    const hasBack=!!(R&&R.order);
    if(view==='back'&&!hasBack) view='retail';
    const btn=(k,label,count,sub)=>'<button type="button" data-wto="'+k+'" aria-pressed="'+(view===k)+'"><span>'+label+'</span><b>'+count+'</b><small>'+sub+'</small></button>';
    const v=(k,body)=>'<div class="wv" data-wtov="'+k+'"'+(view===k?'':' hidden')+'>'+body+'</div>';
    const loading=!D?'<p>'+(o.err?'Couldn’t open the inventory report right now. Check the Wi-Fi and try again.':'Opening the inventory report…')+'</p>':'';
    let h=css+'<div class="wto"><div><h1>What To Order</h1><p>'+(D&&D.asOf?'Retail from the inventory report dated '+esc(String(D.asOf).replace(/,\s*\d{4}$/,''))+'. ':'')
      +(R&&R.week?'Color from the week of '+esc(R.week)+'. ':'')+'A new report comes in every week, so Monday is the day to order.</p></div>'
      +'<div class="wpick" role="group" aria-label="Choose a list">'+btn('retail','Retail',ret.length+cnt.length,'for the shelf')
      +(hasBack?btn('back','Color & Backbar',back.length,'color and supplies'):'')+btn('way','On The Way',Object.keys(ords).length,Object.keys(ords).length===1?'order':'orders')+'</div>'
      +v('retail',loading||(retailCards.length?'<p>Grouped by where we buy it. Open the store and order the amount shown.</p>'+retailCards.join(''):'<p>Nothing to reorder this week.</p>'))
      +(hasBack?v('back',backCards.length?'<p>From this week’s color report.</p>'+backCards.join(''):'<p>Nothing to order for the color room this week.</p>'):'')
      +v('way',wayCards.length?'<p>From the order emails in info@. Don’t order these again. When a box comes in, receive it in Paired Plus.</p>'+wayCards.join(''):'<p>Nothing on the way right now.</p>')
      +(o.countsHint?'<p>'+esc(o.countsHint)+'</p>':'');
    if(window.Ordering) h+='<details class="wmore"><summary>All Stores, Logins &amp; Amazon Lists</summary><div>'+Ordering.html(o.mode||'full',prices,o.logins).replace(/<h1>Ordering<\/h1>/,'')+'</div></details>';
    return h+'</div>';
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('[data-wto]'); if(!b) return;
    view=b.dataset.wto; const box=b.closest('.wto'); if(!box) return;
    box.querySelectorAll('[data-wto]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    box.querySelectorAll('[data-wtov]').forEach(x=>{x.hidden=x.dataset.wtov!==view});
  });
  window.WhatToOrder={html,storeOf,arrives};
})();
