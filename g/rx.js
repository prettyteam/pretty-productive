/* RX consultation cards (Alexandra, Oct 2026). The artist enters the guest's budget, what she's hoping for, her
   routine and what her hair, scalp or skin is going through right now. The card suggests two options for today
   (Option 1 inside the budget, Option 2 the full look), home maintenance in both totals, and a lighter
   maintenance visit. The artist keeps or edits everything, saves, and the guest scans a QR on screen.
   Nothing about the guest leaves this device except inside the QR link, and the link's part after # never
   reaches a server. Uses the host page's h(), store and render(); S.mine.staff is the artist. */

/* Service prices: the median price for each service in the salon's own bookings, Oct 2026. */
const RX_SVC={
  hair:[['Female Haircut',70],['Male Haircut',45],['Haircut Leaving Wet',45],['Blow Dry',50],['Blowdry Plus',65],
    ['Single Process',70],['Shadow Root',60],['Glaze',45],['Additional Mix',25],['Face Frame/Spot Highlight',100],['Minimum Foil',85],
    ['Half Foil',150],['Full Foil',175],['Minimum Balayage',125],['Half Head Balayage',185],['Full Head Balayage',325],
    ['Base Lightener',55],['K18 Bond Protection',25],['Goldwell Leave-In Treatment',20],['Permanent Wave',100],['Formal Style',105]],
  skin:[['Taffeta Facial',130],['Express Acne Treatment',99],['Hydration Boost',99],['Brightening Mini Facial',99],
    ['Mini Redness Reversal',99],['Anti-Aging Express',99],['Dermaplaning',60],['Dermaplaning Add-On',40],
    ['Nano Needling Facial',199],['Microdermabrasion',150],['Brow Sculpt Maintenance',25],['Brow Tint',25],['Brow Lamination',85],['Lip Wax',15]]
};
const rxPrice=(k,n)=>{const r=RX_SVC[k].find(x=>x[0]===n);return r?r[1]:0};

/* Home care: one product per need, from the Taffeta product guide (brand list prices, Oct 2026; ring up from the POS). */
const RX_PROD={
  colorSafe:['Oribe Shampoo for Beautiful Color',49,'Keeps color from fading wash after wash'],
  glazeKeep:['Oribe Shampoo for Beautiful Color',49,'Helps your glaze stay glossy longer'],
  uv:['Oribe Invisible Defense Universal Protection Spray',44,'Daily heat and UV protection so your tone doesn’t fade'],
  heat:['Oribe Invisible Defense Universal Protection Spray',44,'Heat protection every time you blow-dry or use hot tools'],
  brassy:['Oribe Bright Blonde Shampoo',49,'Keeps blonde bright and cancels brassiness'],
  airDry:['Oribe Supershine Moisturizing Cream',54,'Smooth, soft air-dried hair with no blow-dry'],
  airCurl:['Oribe Curl Gloss Hydration & Hold',46,'Defines waves and curls as they air dry'],
  frizz:['Brazilian Blowout Daily Smoothing Serum',43,'Tames frizz and humidity'],
  dry:['Davines NOUNOU Shampoo',38,'Deep moisture for dry hair'],
  breakage:['K18 Leave-In Repair Mask (mini)',29,'Repairs breakage from the inside'],
  flat:['Davines Volume Boosting Mousse',37,'Lift and body that lasts'],
  oily:['Oribe Gold Lust Dry Shampoo',52,'Soaks up oil so you can stretch between washes'],
  scalp:['Oribe Serene Scalp Soothing Leave-On',48,'Calms an itchy or flaky scalp'],
  grays:['Oribe Root Touch Up Spray',36,'Covers grays between color visits'],
  blowLast:['Oribe Dry Texturizing Spray',52,'Makes your blowout last longer'],
  skBreak:['Biologique Recherche Lotion P50 (1.7 oz)',45,'Clears congestion and helps prevent breakouts'],
  skSens:['Biologique Recherche Lotion P50W (1.7 oz)',45,'Gentle exfoliation for dry or sensitive skin'],
  skBright:['Biologique Recherche Lotion P50 PIGM 400 (1.7 oz)',45,'Evens tone and brightens dullness'],
  skAge:['Biologique Recherche Sérum Grand Millésime (0.3 oz)',115,'Firms and softens fine lines'],
  skClean:['Biologique Recherche Lait VIP O2 (1.7 oz)',35,'A gentle cleansing milk to start a real routine'],
  skMask:['Biologique Recherche Masque VIVANT',95,'Weekly mask for oily, blemish-prone skin']
};
const RX_TRY=3; /* Try Me bottle: 1 oz of any backbar product */
/* Home care price list artists learn and star their go-tos from (product guide brand list prices, Oct 2026).
   Taffeta Refillable is our backbar shampoo + conditioner in Taffeta bottles: new bottle or a refill into her own bottle (Paired Plus, Oct 15 2026). */
const RX_PRICES={
  hair:[['Taffeta Refillable Shampoo, new bottle',39],['Taffeta Refillable Shampoo, refill',34],['Taffeta Refillable Conditioner, new bottle',42],['Taffeta Refillable Conditioner, refill',37],['Oribe Shampoo for Beautiful Color',49],['Oribe Conditioner for Beautiful Color',52],
    ['Oribe Bright Blonde Shampoo',49],['Oribe Gold Lust Repair & Restore Shampoo',56],['Oribe Gold Lust Repair & Restore Conditioner',59],
    ['Oribe Gold Lust Masque',72],['Oribe Gold Lust Nourishing Oil',59],['Oribe Invisible Defense Universal Protection Spray',44],
    ['Oribe Royal Blowout Heat Styling Spray',72],['Oribe Imperial Blowout',69],['Oribe Supershine Moisturizing Cream',54],
    ['Oribe Curl Gloss Hydration & Hold',46],['Oribe Dry Texturizing Spray',52],['Oribe Gold Lust Dry Shampoo',52],
    ['Oribe Grandiose Hair Plumping Mousse',42],['Oribe Maximista Thickening Spray',42],['Oribe Superfine Hairspray',46],
    ['Oribe Root Touch Up Spray',36],['Oribe Serene Scalp Soothing Leave-On',48],
    ['Davines NOUNOU Shampoo',38],['Davines NOUNOU Conditioner',43],['Davines LOVE Smoothing Shampoo',38],['Davines LOVE Smoothing Conditioner',43],
    ['Davines Volume Boosting Mousse',37],['K18 Leave-In Repair Mask (mini)',29],['K18 Leave-In Repair Mask',75],['K18 Damage Shield Shampoo',39],
    ['Brazilian Blowout Anti-Frizz Shampoo + Conditioner',80],['Brazilian Blowout Daily Smoothing Serum',43],['Brazilian Blowout Ionic Bonding Spray',34],
    ['Rossano Ferretti Vivace Everyday Active Shampoo',36],['Rossano Ferretti Heat Protector Spray',59],['Aluram Daily Shampoo',20.99],['Aluram Daily Conditioner',20.99]],
  skin:[['Biologique Recherche Lotion P50 (1.7 oz)',45],['Biologique Recherche Lotion P50W (1.7 oz)',45],['Biologique Recherche Lotion P50 PIGM 400 (1.7 oz)',45],
    ['Biologique Recherche Lotion P50V (1.7 oz)',45],['Biologique Recherche Lait VIP O2 (1.7 oz)',35],['Biologique Recherche Masque VIVANT',95],
    ['Biologique Recherche Crème Dermopurifiante',135],['Biologique Recherche Sérum Grand Millésime (0.3 oz)',115],['Biologique Recherche Crème Grand Millésime',225],
    ['Biologique Recherche Sérum TEWL (0.3 oz)',85],['Biologique Recherche Sérum Erythros',140],['Biologique Recherche Dermopore (0.3 oz)',60],
    ['Biologique Recherche Crème MSR-H',330],['BR Skin Box (Youth, Standard or Blemish)',50]]
};
const rxFavKey=()=>'pp-rxfav:'+rxSlug();
function rxFavs(){ try{return JSON.parse(store.get(rxFavKey())||'[]')}catch(e){return []} }
let RX_FAVT=null;
function rxFavToggle(n){ const f=rxFavs(), i=f.indexOf(n); i<0?f.push(n):f.splice(i,1); store.set(rxFavKey(),JSON.stringify(f));
  clearTimeout(RX_FAVT); RX_FAVT=setTimeout(()=>rxSync({favs:rxFavs()}),800) }

/* Her stars and saved cards follow her (Alexandra, Oct 2026): the team app signs in with her link, the salon iPad with
   the key it got from her iPad PIN. Without either (or before the front desk script has it) they stay on this device. */
function rxAuth(){
  const st=S.mine&&S.mine.staff; if(!st||!window.TAFFETA_ENDPOINT) return null;
  if(st.tk) return {slug:st.slug,tk:st.tk};
  if(st.t&&typeof HUB!=='undefined'&&HUB.data&&HUB.data.rx) return {slug:st.slug,t:st.t};
  return null;
}
function rxTake(j){
  if(Array.isArray(j.favs)) store.set(rxFavKey(),JSON.stringify(j.favs));
  if(Array.isArray(j.cards)){
    const mine=rxSaved(), by={}; mine.forEach(c=>by[c.id]=c); j.cards.forEach(c=>{if(c&&c.id)by[c.id]=Object.assign(c,{up:1})});
    store.set(rxSavedKey(),JSON.stringify(Object.values(by).sort((a,b)=>String(b.id).localeCompare(String(a.id))).slice(0,300)));
  }
}
async function rxSync(body){
  const a=rxAuth(); if(!a) return false;
  try{const r=await fetch(window.TAFFETA_ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({type:'rxsync',...a,...(body||{})})});
    const j=await r.json(); if(!j.ok) return false; rxTake(j); return true}
  catch(e){return false}
}
/* Once per artist per visit: send up anything made on this device before, take her stars and cards from the server. */
let RX_PULLED='';
async function rxPull(){
  const a=rxAuth(); if(!a||RX_PULLED===a.slug) return; RX_PULLED=a.slug;
  const local=rxFavs(), up=rxSaved().filter(c=>!c.up).slice(0,50);
  if(!await rxSync(up.length?{cards:up}:{})) {RX_PULLED='';return}
  const both=[...new Set([...rxFavs(),...local])];
  if(both.length!==rxFavs().length) await rxSync({favs:both});
  render();
}
let RX_PQ='';
/* Price list with stars: her go-tos float to the top of every "+ Add" menu */
function rxPriceList(kind){
  const favs=rxFavs(), q=RX_PQ.trim().toLowerCase();
  const items=RX_PRICES[kind].filter(([n])=>!q||n.toLowerCase().includes(q)).sort((a,b)=>(favs.includes(b[0])-favs.includes(a[0])));
  const s=h('input',{type:'search',id:'rxpq',value:RX_PQ,placeholder:'Search a product',autocomplete:'off'});
  s.addEventListener('input',()=>{RX_PQ=s.value;const pos=s.selectionStart;render();const n=document.getElementById('rxpq');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
  const d=h('details',{class:'invg',id:'rxpl'},h('summary',{},h('h2',{},'Home care prices'),h('span',{class:'soft invc'},favs.length?favs.length+' starred':''),h('span',{class:'tplus','aria-hidden':'true'},'+')),
    h('div',{class:'sec2'},h('p',{class:'soft'},'Know what your favorites cost so you can build them into her budget. Star your go-tos and they show first when you add home care.'),
      h('label',{class:'fld'},s),
      ...items.map(([n,p])=>h('div',{class:'rxl'},
        h('button',{type:'button',class:'rxstar','aria-pressed':String(favs.includes(n)),'aria-label':(favs.includes(n)?'Unstar ':'Star ')+n,onclick:()=>{rxFavToggle(n);render();const x=document.getElementById('rxpl');if(x)x.open=true}},favs.includes(n)?'★':'☆'),
        h('div',{class:'rxn'},h('b',{},n.replace(/^Biologique Recherche /,'BR '))),h('span',{class:'num'},rxMoney(p)))),
      h('p',{class:'soft'},'Try Me bottle: 1 oz of any backbar product, $3. Prices are brand list prices; ring up from the POS.')));
  if(q) d.open=true;
  return d;
}

/* Balayage (Alexandra, Oct 15 2026): the glaze is already in the balayage price, so it is never added on top (Additional
   Mix $25 is the add-on instead), and anyone getting a balayage comes back for a balayage: Minimum Balayage. */
const RX_BAL=/balayage/i;
const RX_BAL_M=[['Minimum Balayage','Female Haircut'],'10–12 weeks','A minimum balayage and a trim. Your glaze is included.'];
/* What she's hoping for → service packages, fullest first. */
const RX_GOAL={
  hair:{
    'Lived-in blonde (balayage)':{p:[['Full Head Balayage','Female Haircut'],['Half Head Balayage','Female Haircut'],['Minimum Balayage','Female Haircut'],['Minimum Balayage']],
      m:RX_BAL_M},
    'Brighter blonde (foils)':{p:[['Full Foil','Glaze','Female Haircut'],['Half Foil','Glaze','Female Haircut'],['Minimum Foil','Glaze','Female Haircut'],['Face Frame/Spot Highlight','Glaze'],['Minimum Foil','Glaze']],
      m:[['Minimum Foil','Glaze','Female Haircut'],'8–10 weeks','Foils around the part and hairline, a glaze and a trim.']},
    'Root touch-up or gray coverage':{p:[['Single Process','Glaze','Female Haircut','Blow Dry'],['Single Process','Glaze','Female Haircut'],['Single Process','Female Haircut'],['Single Process']],
      m:[['Single Process'],'4–6 weeks','Roots only. Add a cut every other visit.']},
    'Shine and tone refresh (glaze)':{p:[['Glaze','Female Haircut','Blow Dry'],['Glaze','Female Haircut'],['Glaze']],
      m:[['Glaze'],'6–8 weeks','A glaze to bring the shine and tone back.']},
    'New cut or shape':{p:[['Female Haircut','Blow Dry'],['Female Haircut'],['Haircut Leaving Wet']],
      m:[['Female Haircut'],'6–8 weeks','A trim to keep the shape.']},
    'Big change (transformation)':{p:[['Full Head Balayage','Female Haircut','Blow Dry'],['Full Foil','Glaze','Female Haircut'],['Half Head Balayage','Female Haircut'],['Half Foil','Glaze','Female Haircut']],
      m:[['Face Frame/Spot Highlight','Glaze','Female Haircut'],'8–10 weeks','A big change can take more than one visit. Next time: face-framing foils, a glaze and a trim.']},
    'Blowout or style':{p:[['Blowdry Plus'],['Blow Dry']],m:[['Blow Dry'],'1–2 weeks','A blowout for your next event.']}
  },
  skin:{
    'Clear breakouts':{p:[['Taffeta Facial'],['Express Acne Treatment']],m:[['Express Acne Treatment'],'4 weeks','A focused 30-minute treatment to stay clear.']},
    'Calm redness':{p:[['Taffeta Facial'],['Mini Redness Reversal']],m:[['Mini Redness Reversal'],'4 weeks','A calming 30-minute treatment.']},
    'Brighten or even tone':{p:[['Taffeta Facial','Dermaplaning Add-On'],['Taffeta Facial'],['Brightening Mini Facial']],m:[['Brightening Mini Facial'],'4 weeks','A 30-minute brightening treatment.']},
    'Hydrate':{p:[['Taffeta Facial'],['Hydration Boost']],m:[['Hydration Boost'],'4 weeks','A 30-minute moisture boost.']},
    'Fine lines and firmness':{p:[['Nano Needling Facial'],['Taffeta Facial'],['Anti-Aging Express']],m:[['Anti-Aging Express'],'4 weeks','A 30-minute treatment for firmness and fine lines.']},
    'Overall glow':{p:[['Taffeta Facial'],['Hydration Boost']],m:[['Taffeta Facial'],'4–6 weeks','Your facial every 4 to 6 weeks keeps skin on track.']}
  }
};

/* Consultation questions (Alexandra's method: learn her weekly routine first). Hair approved as drafted; skin is a first draft. */
const RX_Q={
  hair:[
    ['wash','How often does she wash?',['Daily','Every other day','Every 2–3 days','Once a week']],
    ['feel','How does her hair feel?',['Dry','Oily','Frizzy','Flat','Curly or wavy','Just right'],1],
    ['style','How does she style it?',['Air dry','Blow-dry with a brush','Hot tools daily']],
    ['color','Is it color-treated?',['No','Yes','Yes, with a glaze that fades','Blonde that turns brassy'],1],
    ['prod','What does she use now?',['Professional','Drugstore','Not sure']],
    ['love','Does she love it?',['Yes','No']]],
  skin:[
    ['feel','How does her skin feel?',['Dry or tight','Oily','Combination','Sensitive','Normal']],
    ['steps','Her routine now',['Nothing','Cleanser only','A few steps','Full routine']],
    ['spf','Daily sunscreen?',['Yes','No']],
    ['prod','What does she use now?',['Professional','Drugstore','Not sure']],
    ['love','Does she love it?',['Yes','No']]]
};
const RX_NOW={
  hair:['Color fading','Brassiness','Frizz','Breakage','Dryness','Oily scalp','Flat, no volume','Grays showing','Itchy or flaky scalp','Hard to style','Nothing new, just maintaining'],
  skin:['Breakouts','Redness','Dullness or uneven tone','Dark spots','Dehydration','Fine lines','Large pores','Nothing new, just maintaining']
};

const rxKind=()=>(S.mine&&S.mine.role==='esthetician')?'skin':'hair';
const rxSlug=()=>(S.mine&&S.mine.staff&&S.mine.staff.slug)||(S.mine&&S.mine.slug)||'x';
const rxKey=()=>'pp-rx:'+rxSlug(), rxSavedKey=()=>'pp-rxsaved:'+rxSlug();
const rxBlank=k=>({kind:k||rxKind(),guest:'',budget:'',nob:false,goal:'',a:{},now:[],opts:null,m:null,refresh:'',id:''});
let RX=null, RX_VIEW='build', RX_FIND='', RX_SHOW=null, RX_MSG='';
function rxLoad(){ if(RX) return RX; try{RX=Object.assign(rxBlank(),JSON.parse(store.get(rxKey())||'{}'))}catch(e){RX=rxBlank()} return RX }
function rxSave(){ store.set(rxKey(),JSON.stringify(RX)) }
function rxSaved(){ try{return JSON.parse(store.get(rxSavedKey())||'[]')}catch(e){return []} }
const rxMoney=n=>'$'+(Math.round(n*100)/100).toLocaleString('en-US',{maximumFractionDigits:2});
const rxFirst=n=>String(n||'').trim().split(/\s+/)[0]||'';

/* Genuine needs only, most important first, at most two. "Right now" leads, then her routine. */
function rxNeeds(R){
  const a=R.a||{}, now=R.now||[], out=[], add=k=>{if(!out.includes(k)&&RX_PROD[k]) out.push(k)};
  const notHappy=a.prod&&a.prod!=='Professional'||a.love==='No';
  if(R.kind==='skin'){
    if(now.includes('Breakouts')||now.includes('Large pores')) add('skBreak');
    if(now.includes('Redness')||a.feel==='Sensitive') add('skSens');
    if(now.includes('Dullness or uneven tone')||now.includes('Dark spots')) add('skBright');
    if(now.includes('Dehydration')||a.feel==='Dry or tight') add('skSens');
    if(now.includes('Fine lines')) add('skAge');
    if(!out.length&&(notHappy||a.steps==='Nothing'||a.steps==='Cleanser only')) add('skClean');
    return out.slice(0,2);
  }
  const feel=[].concat(a.feel||[]), color=[].concat(a.color||[]);
  const colored=color.some(c=>c&&c!=='No');
  if(now.includes('Color fading')||color.includes('Yes, with a glaze that fades')){ add(colored&&notHappy?'colorSafe':'glazeKeep'); add('uv') }
  if(now.includes('Brassiness')||color.includes('Blonde that turns brassy')) add('brassy');
  if(now.includes('Breakage')) add('breakage');
  if(now.includes('Frizz')) add(a.style==='Air dry'?(feel.includes('Curly or wavy')?'airCurl':'airDry'):'frizz');
  if(now.includes('Dryness')) add('dry');
  if(now.includes('Oily scalp')) add('oily');
  if(now.includes('Flat, no volume')) add('flat');
  if(now.includes('Itchy or flaky scalp')) add('scalp');
  if(now.includes('Grays showing')) add('grays');
  if(now.includes('Hard to style')) add(a.style==='Air dry'?(feel.includes('Curly or wavy')?'airCurl':'airDry'):'blowLast');
  /* from the routine, only when nothing above already covers it */
  if(colored&&notHappy) add('colorSafe');
  if(a.style==='Hot tools daily'||a.style==='Blow-dry with a brush') add('heat');
  if(a.style==='Air dry'&&!out.some(k=>k==='airDry'||k==='airCurl')) add(feel.includes('Curly or wavy')?'airCurl':'airDry');
  if(feel.includes('Oily')&&a.wash==='Daily') add('oily');
  return out.slice(0,2);
}

/* Every blonding service gets K18 sprayed in before the lightener: a backbar charge from $25 (up to $50 by amount used),
   and one pump of K18 leave-in after (Alexandra, Oct 2026). */
const RX_BLOND=/foil|balayage|highlight|lightener/i;
const rxSvcLines=(k,names)=>{if(names.some(n=>RX_BAL.test(n))) names=names.filter(n=>n!=='Glaze');
  const L=names.map(n=>({n,p:rxPrice(k,n),t:'s'}));
  if(k==='hair'&&names.some(n=>RX_BLOND.test(n))&&!names.includes('K18 Bond Protection')) L.push({n:'K18 Bond Protection',p:rxPrice('hair','K18 Bond Protection'),t:'s'});
  return L};
const rxProdLines=(keys,mode)=>keys.map((k,i)=>{const [n,p,why]=RX_PROD[k];const t=mode==='try'||(mode==='first'&&i>0);return {n,p:t?RX_TRY:p,t:t?'t':'p',why,full:p}});
const rxTotal=L=>L.reduce((s,x)=>s+(Number(x.p)||0),0);

/* Option 1 fits inside the budget (lighter service, or Try Me bottles before dropping home care); Option 2 is the full look. */
function rxGenerate(R){
  const g=(RX_GOAL[R.kind]||{})[R.goal]; if(!g) return null;
  const needs=rxNeeds(R), P=g.p, b=R.nob?null:Number(R.budget)||null;
  /* Goldwell leave-in backbar treatment: a no-downtime add-on for color that fades, blonde repair or dry, damaged hair.
     $20, or $10–15 when only half the bottle is used (Alexandra, Oct 2026). Offered in the full look. */
  const now=R.now||[], leave=R.kind==='hair'&&(now.some(x=>/Color fading|Brassiness|Breakage|Dryness/.test(x))||P[0].some(n=>RX_BLOND.test(n)));
  const o2=[...rxSvcLines(R.kind,P[0]),...(leave?rxSvcLines('hair',['Goldwell Leave-In Treatment']):[]),...rxProdLines(needs,'full')];
  let o1=null;
  const tryPkg=i=>{for(const mode of ['full','first','try']){const L=[...rxSvcLines(R.kind,P[i]),...rxProdLines(needs,mode)];if(rxTotal(L)<=b) return L}return null};
  if(b==null) o1=[...rxSvcLines(R.kind,P[Math.min(1,P.length-1)]),...rxProdLines(needs,'full')];
  else{ for(let i=P.length>1?1:0;i<P.length&&!o1;i++) o1=tryPkg(i);
    if(!o1) o1=[...rxSvcLines(R.kind,P[P.length-1]),...rxProdLines(needs,'try')]; }
  const [ms,mw,mt]=[o1,o2].some(L=>L.some(l=>RX_BAL.test(l.n)))?RX_BAL_M:g.m;
  return {opts:[{title:'Option 1',lines:o1},{title:'Option 2',lines:o2}],
    m:{lines:rxSvcLines(R.kind,ms),when:mw,text:mt},refresh:mw,keep:!needs.length};
}

/* ---- the card in a link: compact JSON → base64url after # ---- */
function rxPack(R,me,day){
  const o={v:1,k:R.kind,g:rxFirst(R.guest),a:rxFirst(me),d:day||new Date().toISOString().slice(0,10),b:R.nob?null:(Number(R.budget)||null),
    w:R.goal,n:(R.now||[]).filter(x=>!/^Nothing new/.test(x)),
    /* home care shows on her card as one "Maintenance" line, the way Alexandra writes cards by hand,
       so she sees the investment, not a list of products to say no to */
    o:R.opts.map(x=>{const sv=x.lines.filter(l=>l.t==='s').map(l=>[l.n,Number(l.p)||0]), hc=x.lines.filter(l=>l.t!=='s').reduce((a,l)=>a+(Number(l.p)||0),0);
      return [x.title,hc?[...sv,['Maintenance',hc]]:sv]}),
    m:[R.m.lines.map(l=>[l.n,Number(l.p)||0]),R.m.when,R.m.text],r:R.refresh};
  return o;
}
/* deflated so the QR stays easy to scan; "z" marks a compressed card */
async function rxLink(R,me,day){
  let bytes=new TextEncoder().encode(JSON.stringify(rxPack(R,me,day))), pre='';
  try{ if(window.CompressionStream){bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());pre='z'} }catch(e){}
  let s='';bytes.forEach(c=>s+=String.fromCharCode(c));
  return (window.RX_GUEST_URL||'https://prettyteam.taffetadesign.com/rx/')+'#'+pre+btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function rxQR(text){
  const q=qrcode(0,'L'); q.addData(unescape(encodeURIComponent(text))); q.make();
  const n=q.getModuleCount(), s=4, pad=4, c=document.createElement('canvas'); c.width=c.height=(n+pad*2)*s;
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.fillStyle='#000';
  for(let r=0;r<n;r++)for(let k=0;k<n;k++) if(q.isDark(r,k)) x.fillRect((k+pad)*s,(r+pad)*s,s,s);
  c.className='rxqr'; c.setAttribute('role','img'); c.setAttribute('aria-label','QR code for the guest’s RX card'); return c;
}

function rxView(){
  rxPull();
  const R=rxLoad(), me=(S.mine&&(S.mine.name||(S.mine.staff&&S.mine.staff.name)))||'';
  const tabs=h('div',{class:'seg',style:'justify-content:center'},
    h('button',{type:'button','aria-pressed':String(RX_VIEW!=='saved'),onclick:()=>{RX_VIEW='build';render()}},'Build a card'),
    h('button',{type:'button','aria-pressed':String(RX_VIEW==='saved'),onclick:()=>{RX_VIEW='saved';RX_SHOW=null;render()}},'Saved cards'));
  const head=h('div',{},h('span',{class:'lbl'},'Customer cards'),h('h1',{style:'font-size:28px'},'RX consultation card'),
    h('p',{class:'soft',style:'margin-top:6px'},'For new guests and anyone ready for a big change. Two options for today, home care in both, and what her next visit looks like.'));
  if(RX_VIEW==='saved') return [h('div',{class:'hub'},head,tabs,rxSavedView(me))];
  if(RX_VIEW==='qr'&&RX_SHOW) return [h('div',{class:'hub'},head,rxQrView(RX_SHOW))];
  return [h('div',{class:'hub'},head,tabs,...rxBuild(R,me))];
}

function rxBuild(R,me){
  const chips=(opts,isOn,onTap)=>h('div',{class:'seg'},opts.map(o=>h('button',{type:'button','aria-pressed':String(!!isOn(o)),onclick:()=>{onTap(o);rxSave();render()}},o)));
  const kindRow=h('div',{class:'fld'},'Card for',chips(['Hair','Skin'],o=>R.kind===o.toLowerCase(),o=>{const k=o.toLowerCase();if(k!==R.kind){RX=Object.assign(rxBlank(k),{guest:R.guest,budget:R.budget,nob:R.nob})}}));
  const gIn=h('input',{type:'text',value:R.guest,placeholder:'First name',autocomplete:'off',autocapitalize:'words'});
  gIn.addEventListener('input',()=>{R.guest=gIn.value;rxSave()});
  const bIn=h('input',{type:'number',inputmode:'decimal',min:'0',step:'5',value:R.budget,placeholder:'$',disabled:R.nob?'':null});
  bIn.addEventListener('input',()=>{R.budget=bIn.value;rxSave()});
  const s1=h('section',{class:'card2'},h('span',{class:'lbl'},'1 · Your guest'),kindRow,
    h('label',{class:'fld'},'Guest’s first name',gIn),
    h('label',{class:'fld'},'Her budget for today, home care included',bIn),
    chips(['No set budget'],()=>R.nob,()=>{R.nob=!R.nob}),
    h('div',{class:'fld'},'What is she hoping for?',chips(Object.keys(RX_GOAL[R.kind]),o=>R.goal===o,o=>{R.goal=R.goal===o?'':o})),
    rxPriceList(R.kind));
  const s2=h('section',{class:'card2'},h('span',{class:'lbl'},'2 · Her routine'),
    ...RX_Q[R.kind].map(([key,q,opts,multi])=>h('div',{class:'fld'},q,chips(opts,
      o=>multi?[].concat(R.a[key]||[]).includes(o):R.a[key]===o,
      o=>{if(multi){const a=[].concat(R.a[key]||[]);const i=a.indexOf(o);i<0?a.push(o):a.splice(i,1);R.a[key]=a}else R.a[key]=R.a[key]===o?'':o}))));
  const s3=h('section',{class:'card2'},h('span',{class:'lbl'},'3 · Right now'),
    h('p',{class:'soft'},R.kind==='skin'?'Her Skin Instant: what is her skin going through right now, this season?':'What is her hair or scalp going through right now, this season?'),
    chips(RX_NOW[R.kind],o=>R.now.includes(o),o=>{const i=R.now.indexOf(o);i<0?R.now.push(o):R.now.splice(i,1)}));
  const ready=R.goal&&(R.nob||Number(R.budget)>0)&&R.now.length;
  const gen=h('button',{type:'button',class:'obtn',disabled:ready?null:'',onclick:()=>{const g=rxGenerate(R);if(!g)return;Object.assign(R,g);rxSave();render();setTimeout(()=>{const n=document.getElementById('rxopts');if(n)n.scrollIntoView({behavior:'smooth'})},50)}},R.opts?'Suggest again':'Suggest options');
  const s4=h('section',{class:'card2',style:'align-items:center;text-align:center'},gen,
    h('small',{class:'soft'},ready?'Suggestions follow the Taffeta consultation: only what she needs, inside her budget.':'Pick what she’s hoping for, her budget and what’s going on right now.'));
  const out=[s1,s2,s3,s4];
  if(R.opts) out.push(...rxEditor(R,me));
  return out;
}

function rxEditor(R,me){
  const b=R.nob?null:Number(R.budget)||null;
  const favs=rxFavs(), plist=RX_PRICES[R.kind];
  const lineRow=(L,l)=>{
    const p=h('input',{type:'number',inputmode:'decimal',min:'0',value:String(l.p),class:'rxp','aria-label':'Price for '+l.n});
    p.addEventListener('change',()=>{l.p=Number(p.value)||0;rxSave();render()});
    return h('div',{class:'rxl'},
      h('div',{class:'rxn'},h('b',{},l.t==='t'?'Try Me: '+l.n:l.n),l.t==='s'?null:h('small',{class:'soft'},l.t==='t'?'1 oz Try Me bottle':'Home care'+(l.why?' · '+l.why:''))),
      l.t==='s'?null:h('button',{type:'button',class:'tab rxtry',onclick:()=>{if(l.t==='t'){l.t='p';l.p=l.full||(RX_PRICES[R.kind].find(x=>x[0]===l.n)||[0,l.p])[1]}else{l.full=l.full||l.p;l.t='t';l.p=RX_TRY}rxSave();render()}},l.t==='t'?'Full size':'Try Me $3'),
      p,h('button',{type:'button',class:'rgx','aria-label':'Remove '+l.n,onclick:()=>{L.splice(L.indexOf(l),1);rxSave();render()}},'×'));
  };
  const adder=L=>{const sel=h('select',{'aria-label':'Add a service or product'},h('option',{value:''},'+ Add a service or product'),
      favs.length?h('optgroup',{label:'My go-tos'},plist.filter(x=>favs.includes(x[0])).map(([n,p])=>h('option',{value:n},n+' · '+rxMoney(p)))):null,
      h('optgroup',{label:'Services'},RX_SVC[R.kind].filter(([n])=>!(n==='Glaze'&&L.some(l=>RX_BAL.test(l.n)))).map(([n,p])=>h('option',{value:n},n+' · '+rxMoney(p)))),
      h('optgroup',{label:'Home care'},plist.map(([n,p])=>h('option',{value:n},n+' · '+rxMoney(p)))),
      h('optgroup',{label:'Try Me'},h('option',{value:'__try'},'Try Me bottle · $3')));
    sel.addEventListener('change',()=>{const n=sel.value;if(!n)return;if(n==='__try'){const what=prompt('Which product goes in the Try Me bottle?');if(what)L.push({n:what.trim(),p:RX_TRY,t:'t'});rxSave();render();return}
      const sv=RX_SVC[R.kind].find(x=>x[0]===n);const pr=plist.find(x=>x[0]===n);const ex=Object.values(RX_PROD).find(x=>x[0]===n);
      L.push(sv?{n,p:sv[1],t:'s'}:{n,p:pr[1],t:'p',why:ex?ex[2]:'',full:pr[1]});rxSave();render()});return h('label',{class:'fld'},sel)};
  const badge=t=>b==null?null:h('span',{class:'rxbadge '+(t<=b?'ok':'over')},t<=b?rxMoney(b-t)+' under budget':rxMoney(t-b)+' over budget');
  const opts=R.opts.map((o,i)=>{const t=rxTotal(o.lines);
    return h('section',{class:'card2 out'},h('span',{class:'lbl'},o.title+(i===0?(b==null?' · a lighter start':t<=b?' · within her budget':' · closest to her budget'):' · the full look')),
      ...o.lines.map(l=>lineRow(o.lines,l)),
      !o.lines.some(l=>l.t!=='s')?h('p',{class:'soft'},'Home care: keep her current routine.'):null,
      o.lines.some(l=>l.n==='K18 Bond Protection')?h('small',{class:'soft'},'K18 goes on before the lightener ($25 to $50 by amount used). Finish with one pump of K18 leave-in.'):null,
      o.lines.some(l=>l.t!=='s')?h('small',{class:'soft'},'Her card shows home care as one line: Maintenance '+rxMoney(o.lines.filter(l=>l.t!=='s').reduce((a,l)=>a+(Number(l.p)||0),0))+'.'):null,
      adder(o.lines),
      h('div',{class:'rxtot'},badge(t),h('b',{},rxMoney(t))));
  });
  const mw=h('input',{type:'text',value:R.m.when}); mw.addEventListener('input',()=>{R.m.when=mw.value;rxSave()});
  const mt=h('textarea',{class:'rgta',rows:'2'}); mt.value=R.m.text; mt.addEventListener('input',()=>{R.m.text=mt.value;rxSave()});
  const rf=h('input',{type:'text',value:R.refresh}); rf.addEventListener('input',()=>{R.refresh=rf.value;rxSave()});
  const maint=h('section',{class:'card2'},h('span',{class:'lbl'},'Her next visit'),
    ...R.m.lines.map(l=>lineRow(R.m.lines,l)),adder(R.m.lines),
    h('div',{class:'rxtot'},h('span',{class:'soft'},'Next visit'),h('b',{},rxMoney(rxTotal(R.m.lines)))),
    h('label',{class:'fld'},'In about',mw),h('label',{class:'fld'},'What it looks like',mt),
    h('label',{class:'fld'},'Refresh in',rf));
  const save=h('button',{type:'button',class:'obtn',onclick:()=>rxStore(R,me)},'Save & show QR');
  const clear=h('button',{type:'button',class:'tab',onclick:()=>{if(!confirm('Start a new card? This clears the one on screen.'))return;RX=rxBlank(R.kind);rxSave();render();window.scrollTo(0,0)}},'Start a new one');
  const done=h('section',{class:'card2',style:'align-items:center;text-align:center'},save,clear,
    h('small',{class:'soft'},'She scans the QR with her camera and the card opens on her phone. No texting, no phone number.'));
  const wrap=h('div',{id:'rxopts',style:'display:flex;flex-direction:column;gap:26px'},...opts,maint,done);
  return [wrap];
}

async function rxStore(R,me){
  if(!R.guest.trim()){alert('Add her first name first.');return}
  const link=await rxLink(R,me), list=rxSaved(), id=R.id||String(Date.now());
  const row={id,guest:rxFirst(R.guest),date:new Date().toISOString().slice(0,10),kind:R.kind,budget:R.nob?null:Number(R.budget)||null,
    totals:R.opts.map(o=>rxTotal(o.lines)),link,draft:JSON.parse(JSON.stringify(R))};
  const i=list.findIndex(x=>x.id===id); i<0?list.unshift(row):list.splice(i,1,row);
  store.set(rxSavedKey(),JSON.stringify(list.slice(0,300)));
  rxSync({cards:[row]});
  R.id=id; rxSave(); RX_SHOW={link,guest:row.guest}; RX_VIEW='qr'; render(); window.scrollTo(0,0);
}

/* a saved card's QR is rebuilt from its draft, so cards saved before a change (like home care showing as one
   Maintenance line) open the current way; keeps the day it was made */
async function rxRelink(x,me){
  const d=x.draft;
  if(!d||!Array.isArray(d.opts)||!d.m||!d.opts.every(o=>(o.lines||[]).every(l=>l&&l.t))) return x.link;
  try{return await rxLink(Object.assign(rxBlank(d.kind),d),me,x.date)}catch(e){return x.link}
}
function rxQrView(x){
  return h('section',{class:'card2 out',style:'align-items:center;text-align:center'},
    h('h2',{},rxFirst(x.guest)+'’s RX card'),rxQR(x.link),
    h('p',{class:'rxscript'},'Scan with your camera'),
    h('small',{class:'soft'},'It opens her two options and what her next visit looks like on her own phone.'),
    h('a',{href:x.link,target:'_blank',rel:'noopener',class:'tab'},'Open her card'),
    h('button',{type:'button',class:'obtn',onclick:()=>{RX_VIEW='build';RX_SHOW=null;render()}},'Done'));
}

function rxSavedView(me){
  const list=rxSaved(), q=RX_FIND.trim().toLowerCase();
  const s=h('input',{type:'search',id:'rxfind',value:RX_FIND,placeholder:'Search by guest’s name',autocomplete:'off'});
  s.addEventListener('input',()=>{RX_FIND=s.value;const pos=s.selectionStart;render();const n=document.getElementById('rxfind');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
  const hits=q?list.filter(x=>x.guest.toLowerCase().includes(q)):[];
  return h('section',{class:'card2'},h('label',{class:'fld'},s),
    !list.length?h('p',{class:'soft'},'Cards you save show up here. Search by her name.'):null,
    q&&!hits.length?h('p',{class:'soft'},'No saved card for “'+RX_FIND+'”.'):null,
    ...hits.slice(0,20).map(x=>h('div',{class:'rxl'},
      h('div',{class:'rxn'},h('b',{},x.guest),h('small',{class:'soft'},(x.kind==='skin'?'Skin':'Hair')+' · '+new Date(x.date+'T12:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+(x.budget?' · budget '+rxMoney(x.budget):'')+' · '+x.totals.map(rxMoney).join(' / '))),
      h('button',{type:'button',class:'tab',onclick:async()=>{RX_SHOW={link:await rxRelink(x,me),guest:x.guest};RX_VIEW='qr';render();window.scrollTo(0,0)}},'QR'),
      h('button',{type:'button',class:'tab',onclick:()=>{RX=Object.assign(rxBlank(x.kind),x.draft);rxSave();RX_VIEW='build';render();window.scrollTo(0,0)}},'Edit'))));
}
