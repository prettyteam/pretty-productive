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
  /* where each retail brand is bought (Alexandra, Oct 28 2026; Hot Like Me from DePasquale, Nov 16). A brand not listed here shows under "Ask Alex Where To Order". */
  const STORE_OF=[[/k18/i,'SalonCentric'],[/davines/i,'Ethos'],[/igk/i,'DePasquale'],[/hot like me|\bhlm\b/i,'DePasquale'],[/goldwell|alter ego/i,'DePasquale'],[/brazilian blowout/i,'Paramount'],
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
    +'.wto .wgot{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px}.wto .wgotb{font:inherit;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;cursor:pointer;background:var(--ink,#121212);color:#fff;border:1px solid var(--ink,#121212);border-radius:6px;padding:12px 18px;min-height:44px}.wto .wnotb{background:none;color:var(--ink,#121212)}.wto .wgotb:disabled{opacity:.6;cursor:default}.wto .wgotm{font-size:13px;color:var(--soft,#5f5b55)}.wupd{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 16px;border:1px solid var(--line,#e2ded5);border-radius:6px}.wupd b{display:block;font-size:15px}.wupd small{display:block;color:var(--soft,#5f5b55);font-size:13px;margin-top:2px}.wto .wst.wgone{opacity:.55}'
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
    +'.wto .wfr{display:grid;grid-template-columns:1fr 52px 64px;gap:6px;align-items:center;padding:9px 0;border-top:1px solid var(--line,#e2ded5);font-size:14px}.wto .wfr>span:first-child{min-width:0}.wto .wfr small{display:block;color:var(--soft,#5f5b55);font-size:12px}.wto .wfr .wfv{text-align:center;font-family:var(--display,Georgia,serif);font-size:18px;line-height:1.1}.wto .wfr .wfv em{font-style:normal;font-family:inherit;font-size:13px;display:inline-block;min-width:30px;padding:3px 8px}.wto .wfhd{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft,#5f5b55);padding:6px 0;border-top:0}.wto .wfhd span:not(:first-child){text-align:center}'+'.wto .wfe{cursor:pointer}.wto .wfe:focus-visible{outline:2px solid currentColor;outline-offset:2px}.wto .wfe[aria-expanded=true]{background:rgba(0,0,0,.03)}.wto .wfed{padding:10px 0 14px;font-size:14px}.wto .wfed p{margin:0 0 10px}.wto .wfed label{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.wto .wfed input{width:120px;font:inherit;padding:8px 10px;border:1px solid var(--line,#e2ded5);border-radius:8px;background:#fff}.wto .wfk{display:flex;align-items:center;gap:12px;margin-bottom:12px}.wto .wfk span{flex:1}.wto .wfk b{font-family:var(--display,Georgia,serif);font-size:20px;min-width:28px;text-align:center}.wto .wfk button{width:40px;height:40px;border-radius:50%;border:1px solid var(--line,#e2ded5);background:#fff;font-size:20px;line-height:1;color:inherit}.wto .wfb{display:flex;gap:10px}.wto .wfb button{flex:1;padding:10px;border-radius:8px;font:inherit;font-weight:600;border:1px solid var(--ink,#2b2722)}.wto .wfs{background:var(--ink,#2b2722);color:#fff}.wto .wfx{background:transparent;color:inherit}.wto .wfmsg{display:block;margin-top:8px;color:var(--soft,#5f5b55)}.wto .wfed.err .wfmsg{color:#8a2a22}'+'.wto .wfam>summary{gap:10px}.wto .wfam .wfn{margin-left:auto;font-size:10.5px;padding:3px 9px}.wto .wfam .wfn+*{margin-left:0}.wto .wfam>summary:has(.wfn):after{margin-left:0}.wto .wfo b{color:#8a2a22}.wto .wfh{margin-top:8px}'
    +'.wto .wpick button:focus-visible,.wto .wst a:focus-visible{outline:2px solid var(--gold,#4a3426);outline-offset:2px}</style>';
  /* not used at Taffeta, never on a list (Alexandra, Nov 2 2026) */
  const NOUSE=/color\s*renew|6n\s*@\s*gb/i;
  /* Rose, Nov 3 2026: no "used more than was counted Oct 12–14 ... so these were restocked" lines on the lists */
  const DROPNOTE=/used more|restocked|counted 0 or 1/i;
  /* Count These First, Rose, Nov 3 2026: each brand in its own section, shades in level order, one row per shade.
     "Shades EQ 06N Moroccan Sand" and "Shades EQ 6N" are the same shade (leading zero and the color's name don't count),
     and every Blondor item (Free Lites powder and so on) is one row, "Wella Blondor". */
  const BRANDS=[[/shades\s*eq/i,'Redken Shades EQ'],[/colorance/i,'Goldwell Colorance'],[/topchic/i,'Goldwell Topchic'],[/alter\s*ego/i,'Alter Ego'],
    [/blondor(?!plex)/i,'Wella Blondor'],[/developer|\bvol\b/i,'Developer']];
  /* brand found last-to-first, so "Topchic 20 vol developer" lands under Developer */
  /* Alexandra, Nov 3 2026: Shades EQ lightest to darkest (level 10 first); the other color lines darkest to lightest */
  const SHADE_DIR=b=>b==='Redken Shades EQ'?1:-1;
  const shadeOf=nm=>{const t=String(nm||'').trim(),b=BRANDS.slice().reverse().find(([re])=>re.test(t)),brand=b?b[1]:(t.split(/\s+/)[0]||'Other');
    if(brand==='Wella Blondor')return{brand,key:brand,lvl:0,code:'',name:'Wella Blondor'};
    const m=/(?:^|\s)0*(\d{1,2})(\/\d+|[A-Z@]*[A-Z])?(?=\s|$)/.exec(t.replace(/\b(redken|goldwell|wella)\b/ig,''));
    const code=m?(m[1]+(m[2]||'')).toUpperCase():'',lvl=m?+m[1]:0;
    /* developers are told apart by name, not by volume: Alter Ego 20 vol and Redken 20 vol are different bottles (Nov 12 2026) */
    return{brand,key:brand+'|'+(brand==='Developer'?t.toLowerCase():(code||t.toLowerCase())),lvl,code,name:t}};
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
  /* Alexandra Nov 27 2026: "we only order 20 vol goldwell in gallons" */
  const unitOf=n=>/^Topchic 20 Volume$/i.test(String(n).trim())?'Gallons only (System Cream Developer 20 vol Gallon)':'';
  const qrow=(name,qty,detail)=>'<div class="wr"><span><b>'+esc(name)+'</b>'+((detail||unitOf(name))?'<small>'+esc([detail,unitOf(name)].filter(Boolean).join(' · '))+'</small>':'')+'</span>'+(qty?'<span class="qty">×'+esc(qty)+'</span>':'')+'</div>';
  const note=t=>'<div class="wnote">'+esc(t)+'</div>';
  const storeCard=(st,rows,note)=>'<div class="wst"><div class="top"><h2>'+esc(st)+'</h2>'+(URL[st]?'<a href="'+esc(URL[st])+'" target="_blank" rel="noopener">Open Store</a>':'')+'</div>'+(note?'<p>'+esc(note)+'</p>':'')+rows.join('')+'</div>';
  const byStore=list=>{const g={};list.forEach(([st,r])=>(g[st]||=[]).push(r));
    const keys=Object.keys(g).sort((a,b)=>(a===ASK)-(b===ASK)||a.localeCompare(b));return keys.map(k=>[k,g[k]])};
  const left=(oh,w)=>oh<0?'Paired Plus shows '+oh+', count the shelf':(oh+' on hand'+(w>0&&w<8?' · about '+Math.max(1,Math.round(w))+' wk left':''));
  let view='retail';
  const WMON={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  const whenMs=t=>{const m=String(t||'').match(/([A-Z][a-z]{2}) (\d+), (\d{4}) (\d+):(\d+) ?([AP]M)/);if(!m)return 0;
    return new Date(+m[3],WMON[m[1]],+m[2],(+m[4]%12)+(m[6]==='PM'?12:0),+m[5]).getTime()};
  const askAt=()=>{try{const v=+localStorage.getItem('wtoAsk')||0;return Date.now()-v<3*3600000?v:0}catch(x){return 0}};
  const clock=ms=>new Date(ms).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
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
    /* Nov 9 2026: Rose's Backbar counts ('b:Brand|Line|Shade', from her Inventory tab) count here too, and the newest count wins (ts from the script) */
    const BLBL=(b,l)=>b==='Redken'?'Shades EQ':/^Colorance Canister$/.test(l)?'Colorance':/^Topchic Canister/.test(l)?'Topchic':l==='Fast Color 10'?'Alter Ego 10-minute':/blondor(?!plex)/i.test(l+b)?'Wella Blondor':'';
    const bIds={};Object.keys(C).forEach(k=>{if(k.slice(0,2)!=='b:')return;const [b,l,sh]=k.slice(2).split('|');const lb=BLBL(b,l||'');if(!lb||!sh)return;
      const key=shadeOf(lb==='Wella Blondor'?'Wella Blondor':lb+' '+sh.split(' ')[0]).key;(bIds[key]||=[]).push(k)});
    const crow=(name,detail,ids)=>{const id='c:'+norm(name),all=(ids||[id]).concat(bIds[shadeOf(name).key]||[]),
      c=all.map(k=>C[k]).filter(Boolean).sort((a,b)=>(+b.ts||0)-(+a.ts||0))[0];
      return '<div class="wr wc" data-cid="'+esc(id)+'" data-citem="'+esc(name)+'"><span><b>'+esc(name)+'</b><small>'+esc(detail)+'</small>'
        +'<small class="cdone"'+(c?'':' hidden')+'>'+(c?'Counted '+esc(c.n)+(c.at?' · '+esc(c.at):''):'')+'</small></span>'
        +'<button type="button" class="q b wcbtn"'+(o.canCount?'':' disabled')+'>'+(c?'Recount':'Count')+'</button>'
        +'<span class="wcin" hidden><input type="number" inputmode="numeric" min="0" max="9999" aria-label="How many on the shelf and in the back room"><button type="button" class="wcsave">Save</button></span></div>'};
    /* every shade to count (order list + fastest-used), merged by brand and shade code, then grouped and sorted */
    const toCount=[];
    ((R&&R.order)||[]).forEach(([s,x])=>parseList(x).items.filter(it=>!NOUSE.test(it.name)).forEach(it=>toCount.push({nm:it.name,det:(/recount/i.test(s)?'Recount':s)+(it.qty?' · order '+it.qty:'')})));
    fast.forEach(([l,p,u])=>{const x=ohOf(l,p);toCount.push({nm:l+' '+p,det:'About '+u+' used a week'+(x?' · estimate '+fmt(x[4])+' on hand':'')})});
    /* Nov 12 2026 (Alexandra said yes): used on the SureTint scale but never counted, so the app can't track them yet.
       Once counted here, the daily color refresh starts tracking them from that count. */
    ((R&&R.countNew)||[]).filter(nm=>!NOUSE.test(nm)).forEach(nm=>toCount.push({nm,det:'New · used on the scale, never counted'}));
    /* Alexandra, Nov 27 2026 ("my list still shows a lot to count ... like the whole thing"): a shade counted since the
       weekly report (R.countedSince, from the daily color refresh) leaves this list, unless it says Recount or New */
    const done=new Set(((R&&R.countedSince)||[]).map(nm=>shadeOf(nm).key));
    const merged=[];
    toCount.forEach(t=>{if(done.has(shadeOf(t.nm).key)&&!/^(Recount|New)/.test(t.det))return;const sh=shadeOf(t.nm),had=merged.find(m=>m.key===sh.key);
      if(!had){merged.push({...sh,ids:['c:'+norm(t.nm)],det:t.det});return}
      had.ids.push('c:'+norm(t.nm));
      if(sh.brand!=='Wella Blondor'&&sh.name.length<had.name.length)had.name=sh.name;   /* keep the plain "6N" name, not "6N Moroccan Sand" */
      if(!/order/.test(had.det)&&/order/.test(t.det))had.det=t.det});
    merged.forEach(m=>{const k='c:'+norm(m.name);m.ids=[k].concat(m.ids.filter(x=>x!==k))});
    const bOrder=b=>{const i=BRANDS.findIndex(x=>x[1]===b);return i<0?BRANDS.length:i};
    merged.sort((a,b)=>bOrder(a.brand)-bOrder(b.brand)||a.brand.localeCompare(b.brand)
      ||(a.brand==='Developer'?a.lvl-b.lvl:SHADE_DIR(a.brand)*(b.lvl-a.lvl))||a.code.localeCompare(b.code));
    let lastB='';
    const cfRows=merged.map(m=>{const head=m.brand!==lastB?'<h3 class="wbr">'+esc(m.brand)+'</h3>':'';lastB=m.brand;return head+crow(m.name,m.det,m.ids)}).join('');
    const nRe=merged.filter(m=>/^Recount/.test(m.det)).length, nNew=merged.filter(m=>/^New/.test(m.det)).length;
    /* Alexandra, Nov 27 2026: "can the count these first be minimized and w a plus or minus so i dont have to scroll a
       whole list": closed by default, and it stays open after a Count is saved (the page redraws) */
    /* Update What To Order (Alexandra, Nov 27 2026): after counting, Rose or Alex taps it so they know the list is current.
       It saves a 'req:update' row in Stock Counts (the refresh ignores it), and the color list catch-up check sees a row
       newer than the last refresh and runs the refresh. The card shows when the list was last updated. */
    const upd=R&&R.refreshed&&window.WhatToOrder.saveCount?(()=>{const t=whenMs(R.refreshed),ask=askAt();
      const wait=ask&&t&&ask>t;
      return '<div class="wupd"><span><b>Color list updated '+esc(String(R.refreshed).replace(/,\s*\d{4}/,','))+'</b><small class="wupdm">'
        +(wait?'You asked for an update at '+esc(clock(ask))+'. It can take up to an hour. Then close the app and open it again, and the time above changes.'
          :'Done counting? Tap Update What To Order. It can take up to an hour. Then close the app and open it again, and the time above changes.')
        +'</small></span><button type="button" class="wgotb wupdb"'+(o.canCount&&!wait?'':' disabled')+'>'+(wait?'Asked':'Update What To Order')+'</button></div>'})():'';
    const countFirst=merged.length?'<details class="wmore" data-cf'+(window.__wtoCfOpen?' open':'')+'><summary>Count These First ('+merged.length+')</summary><div>'
      +'<p>'+(nRe?nRe+' say <b>Recount</b>: the app’s number looks off, so it needs a real count. ':'')+(nNew?nNew+' say <b>New</b>: used on the scale but never counted yet. ':'')
      +'The rest are on the order list or used the most. For each one, count the shelf and the back room together, tap Count, type the total, and tap Save. Once a shade is counted, it drops off this list after the next update.</p>'
      +cfRows+'</div></details>':'';
    /* Color on hand (R.onHand, Nov 2 2026): [line, shade, counted, used since, on hand, per week, weeks left] */
    const OH=((R&&R.onHand)||[]).filter(r=>!NOUSE.test(r.join(' ')));
    /* Full Color List (Alexandra, Nov 27 2026: "a drop down tab per color room brand that shows us an entire list of the
       colors we use/order so we can compare the entire inventory to what the order list is suggesting").
       One closed drop-down per brand. Each shade: on hand, how many to keep, and the suggested order (0 if none).
       Rows from the color refresh: [line, shade, counted, used since, on hand, per week, weeks left, keep, on the way, order (-1 = recount)].
       A shade never counted and never used isn't carried, so it's left off. */
    const ordQ={};((R&&R.order)||[]).forEach(([s,x])=>{if(/recount/i.test(s))return;parseList(x).items.forEach(it=>{ordQ[shadeOf(it.name).key]=(ordQ[shadeOf(it.name).key]||0)+n(it.qty)})});
    const reQ=new Set();((R&&R.order)||[]).forEach(([s,x])=>{if(/recount/i.test(s))parseList(x).items.forEach(it=>reQ.add(shadeOf(it.name).key))});
    const FAM=l=>/shades\s*eq/i.test(l)?'Redken Shades EQ':/blonde\s*idol/i.test(l)?'Redken Blonde Idol':/colorance/i.test(l)?'Goldwell Colorance':/topchic/i.test(l)?'Goldwell Topchic':
      /alter\s*ego/i.test(l)?'Alter Ego':/wella|blondor/i.test(l)?'Wella Blondor & Lighteners':/developer/i.test(l)?'Developers':l;
    const FAMS=['Redken Shades EQ','Redken Blonde Idol','Goldwell Colorance','Goldwell Topchic','Alter Ego','Wella Blondor & Lighteners','Developers'];
    const fams={};
    OH.forEach(r=>{const [l,sh,c,u,oh,pw,wl,keep0,way,q,fid]=r,keep=fid&&C['k:'+fid]?+C['k:'+fid].n:keep0,f=FAM(String(l)),
        sub=String(l).replace(/^(Redken|Goldwell|Wella|Alter Ego|General)\s+/,'').replace(/^(Shades EQ|Blonde Idol|Colorance Canister|Topchic Canister|Fast Color 10|Goldwell Developers|General Developers|Wella Lighteners)\s*/i,''),
        sub2=sub.replace(/^Topchic\s+/i,'').replace(/^Tubes\b/i,'Tube').replace(/^Canister\s*/i,''),
        nm=(sub2&&!String(sh).toLowerCase().startsWith(sub2.toLowerCase())?sub2+' ':'')+sh,
        key=shadeOf((f==='Developers'?'':String(l).replace(/^(Redken|Goldwell|Wella)\s+/,'')+' ')+sh).key,
        ord=q==null?(reQ.has(key)?-1:(ordQ[key]||0)):+q;
      if(!(+pw>=0.05)&&!(+oh>0)&&!ord&&!(+way>0))return;   /* not on the shelf, not used, not ordered: not carried */
      (fams[f]||=[]).push({nm,oh:+oh||0,keep,way:+way||0,pw:+pw||0,ord,sh:shadeOf(f+' '+sh),fid:fid||'',cnt:fid?C['b:'+fid]:null})});
    const famCards=Object.keys(fams).sort((a,b)=>((FAMS.indexOf(a)+1)||99)-((FAMS.indexOf(b)+1)||99)||a.localeCompare(b)).map(f=>{
      const rs=fams[f].sort((a,b)=>f==='Developers'?a.nm.localeCompare(b.nm):((a.sh.lvl?0:1)-(b.sh.lvl?0:1))||(SHADE_DIR(f)*(b.sh.lvl-a.sh.lvl))||a.sh.code.localeCompare(b.sh.code)||a.nm.localeCompare(b.nm));
      const nOrd=rs.filter(r=>r.ord>0).length,nRe=rs.filter(r=>r.ord<0).length;
      return '<details class="wmore wfam"><summary>'+esc(f)+' ('+rs.length+')'+(nOrd?'<span class="q wfn">'+nOrd+' to order</span>':'')+'</summary><div>'
        +'<div class="wfr wfhd"><span>Shade</span><span>Keep</span><span>To order</span></div>'
        +rs.map(r=>{const sub=[r.way?fmt(r.way)+' on the way':'',r.pw>=0.05?'uses about '+fmt(r.pw)+' a week':''].filter(Boolean).join(' · ');
          const ed=o.canCount&&r.fid;
          return '<div class="wfr'+(r.ord>0?' wfo':'')+(ed?' wfe':'')+'"'+(ed?' role="button" tabindex="0" aria-expanded="false" data-fid="'+esc(r.fid)+'" data-nm="'+esc(r.nm)+'" data-oh="'+r.oh+'" data-way="'+r.way+'" data-keep="'+(r.keep!=null?r.keep:'')+'"':'')+'><span><b>'+esc(r.nm)+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</span>'
          +'<span class="wfv">'+(r.keep!=null?fmt(r.keep):'–')+'</span>'
          +'<span class="wfv">'+(r.ord<0?'<em class="q b">Count</em>':r.ord>0?'<em class="q r">'+r.ord+'</em>':'<em class="q g">0</em>')+'</span></div>'
          +(ed?'<div class="wfed" hidden><p>In stock now: about <b>'+fmt(r.oh)+'</b>'+(r.cnt?' · last count '+esc(r.cnt.n)+(r.cnt.at?' on '+esc(r.cnt.at):''):'')+'</p>'
            +'<label>Shelf count<input type="number" inputmode="numeric" min="0" max="9999" placeholder="Count"></label>'
            +'<div class="wfk"><span>Keep</span><button type="button" class="wfm" aria-label="Keep one less">−</button><b>'+(r.keep!=null?r.keep:0)+'</b><button type="button" class="wfp" aria-label="Keep one more">+</button></div>'
            +'<div class="wfb"><button type="button" class="wfs">Save</button><button type="button" class="wfx">Cancel</button></div><small class="wfmsg" hidden></small></div>':'')}).join('')
        +'</div></details>'});
    const ohCard=famCards.length?'<h2 class="wfh">Full Color List</h2><p>Every shade we carry, by brand. Tap a brand to open it. Each shade shows 2 numbers: <b>Keep</b> is how many we always want on the shelf. <b>To order</b> is how many to buy to get back to that number.'+(o.canCount?' Tap a shade to change its shelf count or its Keep number.':'')+''
      +'</p>'+famCards.join(''):'';
    const backCards=byStore(back).filter(([s])=>!(countFirst&&/recount/i.test(s))).map(([s,rs])=>storeCard(s,rs.map(r=>typeof r==='string'?r:crow(r.cnt,'Count the shelf and back room')).concat(prices.filter(p=>String(p[1]).toLowerCase()===s.toLowerCase()).map(([i,,p])=>row(i,'Best price here',p,'g')))));
    /* On The Way: one card per order */
    const ords={};oo.forEach(q=>(ords[q[1]+'|'+q[2]+'|'+q[0]]||=[]).push(q));
    const wayCards=Object.keys(ords).map(k=>{const [st,num,d]=k.split('|'),its=ords[k],s=its[0][5]||'Ordered',a=arrives(s);
      return '<div class="wst"><div class="top"><h2>'+esc(st)+'</h2><span class="q '+(a?'g':'b')+'">'+esc(a?'Arrives '+a:/ship/i.test(s)?'Shipped':s)+'</span></div><p>Ordered '+esc(day(d))+(num?' · #'+esc(num):'')+'</p>'
        +its.map(q=>row(q[3],'',q[4]?'Qty '+q[4]:'','g')).join('')
        +(window.WhatToOrder&&window.WhatToOrder.gotIt?'<div class="wgot"><button type="button" class="wgotb" data-gd="'+esc(d)+'" data-gs="'+esc(st)+'" data-gn="'+esc(num)+'">Got It</button><span class="wgotm" hidden></span></div>':'')+'</div>'});
    /* Just Came In (Nov 27 2026): orders marked received, or past their normal delivery time, in the last 10 days.
       Not Delivered puts one back on On The Way. D.arrived rows: [date, store, order #, item, qty, how ('got'|'auto')] */
    const arr={};((D&&D.arrived)||[]).forEach(q=>(arr[q[1]+'|'+q[2]+'|'+q[0]]||=[]).push(q));
    const gotCards=Object.keys(arr).map(k=>{const [st,num,d]=k.split('|'),its=arr[k],auto=its.some(q=>q[5]==='auto');
      return '<div class="wst"><div class="top"><h2>'+esc(st)+'</h2><span class="q g">'+(auto?'Should be here':'Came in')+'</span></div><p>Ordered '+esc(day(d))+(num?' · #'+esc(num):'')+'</p>'
        +its.map(q=>row(q[3],'',q[4]?'Qty '+q[4]:'','g')).join('')
        +(window.WhatToOrder&&window.WhatToOrder.notHere?'<div class="wgot"><button type="button" class="wgotb wnotb" data-gd="'+esc(d)+'" data-gs="'+esc(st)+'" data-gn="'+esc(num)+'">Not Delivered</button><span class="wgotm" hidden></span></div>':'')+'</div>'});
    const gotSec=gotCards.length?'<details class="wmore"><summary>Just Came In ('+gotCards.length+')</summary><div><p>Orders from the last 10 days that came in, or should have by now. If one never showed up, tap Not Delivered and it goes back on the list.</p>'+gotCards.join('')+'</div></details>':'';
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
      +v('back',noColor||(upd+countFirst+(backCards.length?'<p>Suggested from this week’s color report. Check the shelf and back room first, and only order what we really don’t have.</p>'+backCards.join(''):'<p>Nothing on this week’s color order list.</p>')+ohCard))
      +v('way',(wayCards.length?'<p>From the order emails in info@. Don’t order these again. When a box comes in, tap Got It and receive it in Paired Plus. An order also leaves this list on its own once its normal delivery time has passed.</p>'+wayCards.join(''):'<p>Nothing on the way right now.</p>')+gotSec)
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
  /* Full Color List edits (Alexandra, Nov 27 2026: "an option for us to adjust those counts when we want"): tap a shade to
     type a new shelf count (saved as 'b:Brand|Line|Shade', same as Backbar counts) or change its Keep (saved as
     'k:Brand|Line|Shade'; the color refresh orders up to exactly that number). To Order updates here right away. */
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('.wfe,.wfm,.wfp,.wfs,.wfx'); if(!t) return;
    if(t.classList.contains('wfe')){const ed=t.nextElementSibling;if(!ed||!ed.classList.contains('wfed'))return;
      ed.hidden=!ed.hidden;t.setAttribute('aria-expanded',String(!ed.hidden));if(!ed.hidden){const i=ed.querySelector('input');if(i)i.focus()}return}
    const ed=t.closest('.wfed'),row=ed.previousElementSibling,kb=ed.querySelector('.wfk b'),msg=ed.querySelector('.wfmsg'),inp=ed.querySelector('input');
    if(t.classList.contains('wfm')||t.classList.contains('wfp')){kb.textContent=String(Math.max(0,Math.min(99,(+kb.textContent||0)+(t.classList.contains('wfp')?1:-1))));return}
    if(t.classList.contains('wfx')){ed.hidden=true;row.setAttribute('aria-expanded','false');kb.textContent=row.dataset.keep||'0';inp.value='';msg.hidden=true;return}
    const keep=+kb.textContent, keepCh=String(keep)!==String(row.dataset.keep), cnt=inp.value===''?null:Number(inp.value);
    if(cnt!=null&&!(cnt>=0&&cnt<=9999&&Math.floor(cnt)===cnt)){inp.focus();return}
    if(!keepCh&&cnt==null){ed.hidden=true;row.setAttribute('aria-expanded','false');return}
    const save=window.WhatToOrder.saveCount, id=row.dataset.fid, nm=row.dataset.nm;
    if(!save) return;
    t.disabled=true;t.textContent='Saving';
    Promise.all([cnt!=null?save('b:'+id,nm,cnt):null,keepCh?save('k:'+id,'Keep: '+nm,keep):null])
      .then(()=>{const oh=cnt!=null?cnt:+row.dataset.oh,q=Math.max(0,Math.ceil(Math.round((keep-oh-(+row.dataset.way||0)-0.25)*100)/100)),v=row.querySelectorAll('.wfv');
        row.dataset.keep=String(keep);row.dataset.oh=String(oh);v[0].textContent=String(keep);
        v[1].innerHTML=q>0?'<em class="q r">'+q+'</em>':'<em class="q g">0</em>';row.classList.toggle('wfo',q>0);
        ed.classList.remove('err');inp.value='';ed.querySelector('p').innerHTML='In stock now: about <b>'+oh+'</b>'+(cnt!=null?' · counted '+cnt+' just now':'');
        msg.textContent='Saved. The order list catches up within the hour.';msg.hidden=false})
      .catch(()=>{ed.classList.add('err');msg.textContent='Didn’t save. Check the Wi-Fi and tap Save again.';msg.hidden=false})
      .then(()=>{t.disabled=false;t.textContent='Save'});
  });
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('wfe')){e.preventDefault();e.target.click()}
    else if(e.key==='Enter'&&e.target.closest&&e.target.closest('.wfed')&&e.target.tagName==='INPUT'){e.target.closest('.wfed').querySelector('.wfs').click()}});
  /* Got It (Nov 27 2026): marks the whole order Received on the On Order sheet; the counts and color list pick it up from there */
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('.wgotb'); if(!b) return;
    const not=b.classList.contains('wnotb'), fn=not?window.WhatToOrder.notHere:window.WhatToOrder.gotIt; if(!fn) return;
    const card=b.closest('.wst'), m=b.parentNode.querySelector('.wgotm'), label=b.textContent;
    b.disabled=true; b.textContent='Saving';
    Promise.resolve(fn(b.dataset.gd,b.dataset.gs,b.dataset.gn))
      .then(()=>{b.hidden=true;m.textContent=not?'Okay. This order is back on the On The Way list.':'Got it. This order leaves the list and its boxes get added to the counts.';m.hidden=false;card.classList.add('wgone')})
      .catch(()=>{b.disabled=false;b.textContent=label;m.textContent='Didn’t save. Check the Wi-Fi and tap '+label+' again.';m.hidden=false});
  });
  document.addEventListener('toggle',e=>{if(e.target&&e.target.matches&&e.target.matches('details[data-cf]'))window.__wtoCfOpen=e.target.open},true);
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
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('.wupdb'); if(!b||!window.WhatToOrder.saveCount) return;
    const m=b.closest('.wupd').querySelector('.wupdm'); b.disabled=true; b.textContent='Asking';
    Promise.resolve(window.WhatToOrder.saveCount('req:update','Update What To Order',1))
      .then(()=>{const now=Date.now();try{localStorage.setItem('wtoAsk',String(now))}catch(x){}
        b.textContent='Asked';m.textContent='Got it. The list is updating now with your counts. It can take up to an hour. Then close the app and open it again, and the time above changes.'})
      .catch(()=>{b.disabled=false;b.textContent='Update What To Order';m.textContent='Didn’t go through. Check the Wi-Fi and tap it again.'});
  });
  window.WhatToOrder=Object.assign(window.WhatToOrder||{},{html,storeOf,arrives});
})();
