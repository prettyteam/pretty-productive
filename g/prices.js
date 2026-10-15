/* Prices tab (Alexandra, Oct 2026): every artist can look up our starting service prices and retail prices,
   so they know what things cost before they build a budget with a guest. Services are the starting prices on
   taffetadesign.com/salon-and-spa-menu (read Oct 15 2026); retail is the home care list in g/rx.js (RX_PRICES).
   Uses the host page's h() and render(). No costs here, only what the guest pays. */
const PR_MENU=[
  ['Hair cutting',[['Female haircut','$65+'],['Female haircut, leaving wet','$45+'],['Male haircut','$45+'],['Child haircut','$35+']]],
  ['Hair color',[['Single process','$65+'],['Gloss','$45+'],['Base break','$55+'],['Shadow root','$55+'],['Face frame highlight','$55+'],
    ['Minimal highlight','$80+'],['Half highlight','$110+'],['Full highlight','$140+'],['Double process','Upon consultation'],
    ['K18 bond protection, every blonding service','$25 to $50']]],
  ['Lived-in color packages',[['Full balayage · 3–4 hrs, 1–3x a year','$320+'],['Maintenance balayage · 2–3 hrs, every 6–12 weeks','$220+'],
    ['Refresh balayage · 45 min–1.5 hrs, every 6–8 weeks','$120+'],['Babylight technique, per package','+$50']],'Packages include shadow root and gloss. Price varies with length and thickness.'],
  ['Hair treatments',[['Brazilian Blowout smoothing','$275+'],['Keratin smoothing','$275+'],['Olaplex','$50+'],['Goldwell leave-in treatment (backbar)','$20; $10–15 for half a bottle']]],
  ['Extensions',[['Clip-in extensions','$45+'],['Tape-in extensions','Upon consultation'],['Invisible bead / hand-tied','Upon consultation'],['Extension removal','$75+']]],
  ['Styling',[['Wash & blow dry','$50+']]],
  ['Makeup & lashes',[['Full face, traditional foundation','$85'],['Full face, airbrush foundation','$95'],['Just eyes (shadow & strip lash)','$70'],
    ['Individual false lashes','$25'],['Strip lash application','$15'],['Lash lift & tint','$125'],['Eyelash extensions','Upon consultation']]],
  ['Brows & waxing',[['First-time brow sculpt','$40'],['Maintenance brow sculpt','$25'],['Brow tint','$25'],['Brow lamination (with kit)','$85'],
    ['Lamination package (tint, sculpt, laminate)','$125'],['Lip or chin','$15'],['Arm','$40'],['Leg','$70'],['Bikini','$50'],['Specialty areas','$68']]],
  ['Facials',[['New guest treatment & take-home regimen · 30 min','$130'],['Taffeta Facial · 60 min','$130'],['Brightening · 60 min','$160'],
    ['Anti-aging · 60 min','$160'],['Acne · 60 min','$160'],['Gentleman’s · 60 min','$160'],
    ['Express Targeted Treatment · 30–35 min','$99'],['Biologique Recherche Lift & Remodel · 90 min','$200'],['Biologique Recherche Cure All · 90 min','$200']]],
  ['Facial enhancements',[['Microdermabrasion','$50'],['Dermaplaning','$50'],['Cold seaweed masque','$50'],['Cryo stick therapy','$50'],
    ['High frequency','$25'],['LED light therapy','$50'],['Peel','$50']]],
  ['Nails',[['Taffeta Signature Pedicure','$55+'],['Signature Pedicure with gel','$65+'],['Express pedicure, polish / gel','$35 / $45+'],
    ['Festive pedicure','$70+'],['Festive pedicure with gel','$80+'],['Taffeta Signature Manicure','$25'],['Gel manicure','$40'],
    ['Express manicure, polish / gel','$15 / $25'],['Gel removal with polish','$30'],['French tip','$5+'],['Nail enhancements','$10+'],
    ['Full set acrylic','$65+'],['Acrylic rebalance','$45+'],['Soft gel overlay','$90+'],['Soft gel rebalance','$70+'],['Add gel polish','$10']]]
];
let PR_Q='', PR_SIDE='svc';
function pricesView(){
  rxPull();
  const q=PR_Q.trim().toLowerCase(), hit=t=>!q||t.toLowerCase().includes(q);
  const s=h('input',{type:'search',id:'prq',value:PR_Q,placeholder:PR_SIDE==='svc'?'Search a service':'Search a product',autocomplete:'off'});
  s.addEventListener('input',()=>{PR_Q=s.value;const pos=s.selectionStart;render();const n=document.getElementById('prq');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
  const seg=h('div',{class:'seg',style:'justify-content:center'},
    [['svc','Services'],['ret','Retail']].map(([k,l])=>h('button',{type:'button','aria-pressed':String(PR_SIDE===k),onclick:()=>{PR_SIDE=k;PR_Q='';render()}},l)));
  const row=(n,p)=>h('div',{class:'rxl'},h('div',{class:'rxn'},h('span',{},n)),h('b',{class:'num',style:'font-weight:500;white-space:nowrap'},p));
  let body;
  if(PR_SIDE==='svc'){
    const groups=PR_MENU.map(([g,items,note])=>{const shown=items.filter(([n])=>hit(n)||hit(g));if(!shown.length)return null;
      return h('section',{class:'card2'},h('span',{class:'lbl'},g),...shown.map(([n,p])=>row(n,p)),note?h('small',{class:'soft'},note):null)});
    body=groups.some(Boolean)?groups:[h('p',{class:'soft',style:'text-align:center'},'Nothing matches “'+PR_Q+'”.')];
    body.push(h('small',{class:'soft',style:'text-align:center'},'Starting prices from our website menu. “+” means starting at; final price depends on time, length and product.'));
  } else {
    const fmt=p=>'$'+(Number.isInteger(p)?p:p.toFixed(2)), favs=rxFavs(), all=[...RX_PRICES.hair,...RX_PRICES.skin];
    const star=n=>h('button',{type:'button',class:'rxstar','aria-pressed':String(favs.includes(n)),'aria-label':(favs.includes(n)?'Unstar ':'Star ')+n,
      onclick:()=>{rxFavToggle(n);render()}},favs.includes(n)?'★':'☆');
    const srow=(n,p)=>h('div',{class:'rxl'},star(n),h('div',{class:'rxn'},h('span',{},n)),h('b',{class:'num',style:'font-weight:500;white-space:nowrap'},fmt(p)));
    const mine=all.filter(([n])=>favs.includes(n)&&hit(n));
    const lines=[['Hair',RX_PRICES.hair],['Skin',RX_PRICES.skin]].map(([g,items])=>{const shown=items.filter(([n])=>hit(n)&&!favs.includes(n));if(!shown.length)return null;
      return h('section',{class:'card2'},h('span',{class:'lbl'},g),...shown.map(([n,p])=>srow(n,p)))});
    body=[mine.length?h('section',{class:'card2'},h('span',{class:'lbl'},'★ Your go-tos'),...mine.map(([n,p])=>srow(n,p))):
        (q?null:h('small',{class:'soft',style:'text-align:center'},'Tap ☆ on the products you reach for most. They move to the top here and in the RX card menu, on your phone and the salon iPad.')),
      h('section',{class:'card2'},h('span',{class:'lbl'},'Try Me bottle'),row('1 oz of any backbar product','$3')),...lines];
    body.push(h('small',{class:'soft',style:'text-align:center'},'Brand list prices. Always ring up from the POS.'));
  }
  return [h('div',{class:'hub'},h('div',{},h('span',{class:'lbl'},'Salon & spa'),h('h1',{style:'font-size:28px'},'Prices'),
    h('p',{class:'soft',style:'margin-top:6px'},'Know what things cost before you sit down with a guest, so her plan fits her budget.')),
    seg,h('label',{class:'fld'},s),...body)];
}
