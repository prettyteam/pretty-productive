/* Ordering page (Alexandra, Oct 28 2026): back bar store links, Rossano Ferretti email order, what we order where,
   best prices from the color report, and the Hi Pretty Amazon lists. Shared by the staff app, Front Desk and Pretty Life.
   No logins or passwords live here: each button opens the store's own sign-in, and the device's saved password fills it in.
   Ordering.html(mode, prices) returns the page as HTML. mode 'full' = everything (Rose, Front Desk, Alexandra);
   'spa' = Amazon lists only (Carolyn). prices = the color report's [[item, store, price]] rows, when the viewer has them.
   logins = [{label, site, user, pw}] store logins, only ever passed in from sealed data (the desk guide, or a sealed staff page);
   they are never written in this file or the repo. Passwords stay hidden until Show is tapped. */
(function(){
  const STORES=[
    ['DePasquale','https://cl.depasqualesalonsystems.com','Goldwell Topchic, Colorance & developers · Alter Ego 10 min color · gloves · IGK retail'],
    ['SalonCentric','https://www.saloncentric.com','K18'],
    ['Paramount','https://www.paramountbeauty.com','All Brazilian Blowout'],
    ['Ethos','https://www.ethosbeauty.com','Davines'],
    ['CosmoProf','https://www.cosmoprofbeauty.com/login','Blondor · foils · Procare developer · perms']];
  const RF={to:'Valentina@rossanoferrettigroup.com',cc:'Operations@rossanoferrettigroup.com,Alex@rossanoferrettigroup.com',
    subject:'Rossano Ferretti Parma – Taffeta Salon Order',
    body:'Hi Valentina,\n\nPlease see our attached order form for Taffeta Salon & Spa, 219 Bellevue Ave, Hammonton, NJ 08037.\n\nPlease send the draft order and payment link when ready.\n\nThank you!\nTaffeta Salon & Spa\n(609) 383-5504',
    form:'https://docs.google.com/spreadsheets/d/1GKdP_sT8BY3r9iGj6uDuZadvpmedPnJg/edit',
    formName:'January 2026 Non RF US SALONS ONLY Standard Pricelist'};
  const AMZ='https://www.amazon.com/shop/taffetaweddings';
  const LISTS=[
    ['Spa Supplies',AMZ+'/list/1ZINQ9LH8C90O','spa'],
    ['Salon Supplies',AMZ+'/list/331OUHMPQPTVJ','spa'],
    ['Beauty Professionals',AMZ+'/list/3E4UF3RYKN0QA'],
    ['Toiletries',AMZ+'/list/2CQXLO97DEI1N'],
    ['Health & Wellness',AMZ+'/list/1WBZAAHR6H9RA']];
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const css='<style>.ord{display:grid;gap:22px;max-width:640px}.ord h1{margin:0}.ord .osec{display:grid;gap:10px;border-top:1px solid var(--line,#e2ded5);padding-top:16px}'
    +'.ord h2{margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600}.ord p{margin:0;font-size:13.5px;color:var(--soft,#5f5b55)}'
    +'.ord .ordbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}'
    +'.ord a.ordb{display:block;text-decoration:none;color:var(--ink,#121212);background:var(--card,#fff);border:1px solid var(--line,#e2ded5);border-radius:4px;padding:12px 10px;text-align:center;font-size:14.5px;font-weight:500}'
    +'.ord a.ordb.dk{background:var(--ink,#121212);color:#fff;border-color:var(--ink,#121212)}.ord a.ordb:focus-visible{outline:2px solid var(--gold,#4a3426);outline-offset:2px}'
    +'.ord .orow{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--line,#e2ded5);font-size:14px}.ord .orow:last-child{border-bottom:0}'
    +'.ord .olg{border:1px solid var(--line,#e2ded5);border-radius:4px;padding:10px 12px;display:grid;gap:6px;font-size:14px;background:var(--card,#fff)}.ord .olg .r{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.ord .olg .r>span:first-child{width:70px;color:var(--soft,#5f5b55);font-size:12.5px}.ord .olg .r>span:nth-child(2){flex:1;min-width:0;overflow-wrap:anywhere}.ord .olg button{font:inherit;font-size:12px;letter-spacing:.08em;text-transform:uppercase;background:none;border:1px solid var(--line,#e2ded5);border-radius:3px;padding:4px 8px;cursor:pointer;color:var(--ink,#121212)}'
    +'.ord .orow small{display:block;color:var(--soft,#5f5b55);font-size:12.5px}.ord .orow>span{min-width:0}</style>';
  const btn=(label,href,dark)=>'<a class="ordb'+(dark?' dk':'')+'" href="'+esc(href)+'"'+(/^mailto:/.test(href)?'':' target="_blank" rel="noopener"')+'>'+esc(label)+'</a>';
  const shown={};
  const lrow=(k,v,copy)=>v?'<div class="r"><span>'+k+'</span><span>'+esc(v)+'</span>'+(copy?'<button type="button" data-ocopy="'+esc(v)+'">Copy</button>':'')+'</div>':'';
  function loginCard(l,i){
    const show=!!shown[i];
    return '<div class="olg"><b>'+esc(l.label)+'</b>'+lrow('Site',l.site)+lrow('User',l.user,1)
      +(l.pw?'<div class="r"><span>Password</span><span>'+(show?esc(l.pw):'••••••••')+'</span><button type="button" data-oshow="'+i+'">'+(show?'Hide':'Show')+'</button><button type="button" data-ocopy="'+esc(l.pw)+'">Copy</button></div>':'')+'</div>';
  }
  /* Show / Copy work in every app that shows this page, without each app wiring them up */
  document.addEventListener('click',e=>{
    const sh=e.target.closest&&e.target.closest('[data-oshow]');
    if(sh){const i=sh.dataset.oshow;shown[i]=!shown[i];const box=sh.closest('.olg');if(box&&LAST[i])box.outerHTML=loginCard(LAST[i],i);return}
    const cp=e.target.closest&&e.target.closest('[data-ocopy]');
    if(cp){const v=cp.dataset.ocopy,done=()=>{cp.textContent='Copied';setTimeout(()=>{cp.textContent='Copy'},1200)};
      try{navigator.clipboard.writeText(v).then(done,()=>{})}catch(_){}}
  });
  let LAST=[];
  function html(mode,prices,logins){
    const full=mode!=='spa', lists=full?LISTS:LISTS.filter(l=>l[2]==='spa');
    const amazon='<section class="osec"><h2>Hi Pretty Amazon Lists</h2><p>Tap a list to open it on Amazon.</p><div class="ordbs">'+lists.map(l=>btn(l[0],l[1])).join('')+'</div></section>';
    if(!full) return css+'<div class="ord"><h1>Ordering</h1>'+amazon+'</div>';
    const mail='mailto:'+RF.to+'?cc='+encodeURIComponent(RF.cc)+'&subject='+encodeURIComponent(RF.subject)+'&body='+encodeURIComponent(RF.body);
    const best=prices&&prices.length?'<section class="osec"><h2>Best Price Right Now</h2><p>From this week’s color report.</p><div>'
      +prices.map(([i,s,p])=>'<div class="orow"><span><b>'+esc(i)+'</b><small>'+esc(s)+'</small></span><b>'+esc(p)+'</b></div>').join('')+'</div></section>':'';
    return css+'<div class="ord"><h1>Ordering</h1>'
      +'<section class="osec"><h2>Salon Back Bar</h2><p>Tap a store to sign in and order.</p><div class="ordbs">'+STORES.map(s=>btn(s[0],s[1])).join('')+'</div></section>'
      +best
      +(LAST=logins||[],LAST.length?'<section class="osec"><h2>Store Logins</h2><p>For the team only. Please don’t share or screenshot.</p>'+LAST.map(loginCard).join('')+'</section>':'')
      +'<section class="osec"><h2>What We Order Where</h2><div>'+STORES.map(s=>'<div class="orow"><span><b>'+esc(s[0])+'</b><small>'+esc(s[2])+'</small></span></div>').join('')
        +'<div class="orow"><span><b>Rossano Ferretti</b><small>By email with the order form</small></span></div></div></section>'
      +'<section class="osec"><h2>Rossano Ferretti</h2><p>Fill in the order form, download it, then tap Email The Order and attach it. They reply with a draft order and a payment link.</p><div class="ordbs">'
        +btn('Open Order Form',RF.form)+btn('Email The Order',mail,true)+'</div><p>Sends to '+esc(RF.to)+'</p></section>'
      +amazon+'</div>';
  }
  window.Ordering={html};
})();
