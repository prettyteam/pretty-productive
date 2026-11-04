/* Prices tab (Alexandra, Oct 2026): every artist can look up our starting service prices and retail prices,
   so they know what things cost before they build a budget with a guest. Services are the starting prices on
   taffetadesign.com/salon-and-spa-menu (read Oct 15 2026), updated Oct 20 2026 from Alexandra's marked-up menu card; Nov 4 2026 Brazilian Blowout, Formal style, Signature and Gel manicure set to the website prices (Alexandra: the website prices are right); Nov 4 2026: matches taffetadesign.com menu, except Gentleman's facial $160 per Alexandra; Nov 4 2026 menu cleanup: strip lash, specialty waxing, clip-in and keratin removed, one Refresh balayage $220+, Color Lock $20 added; retail is the home care list in g/rx.js (RX_PRICES).
   Uses the host page's h() and render(). No costs here, only what the guest pays. */
const PR_MENU=[
  ['Hair cutting',[['Female haircut','$65+'],['Female haircut, leaving wet','$45+'],['Male haircut','$45+'],['Child haircut','$35+']]],
  ['Hair color',[['Single process','$70+'],['Gloss','$45+'],['Base break','$55+'],['Shadow root','$55+'],['Face frame highlight','$100+'],
    ['Minimal highlight','$125+'],['Half highlight','$200+'],['Full highlight','$250+'],['Double process','$100+'],
    ['K18 bond protection','$45']]],
  ['Lived-in color packages',[['Full balayage · 3–4 hrs, 1–3x a year','$325+'],['Refresh balayage · 2–3 hrs, every 6–12 weeks','$220+'],
    ['Babylight technique, per package','+$50']],'Packages include shadow root and gloss. Price varies with length and thickness.'],
  ['Hair treatments',[['Brazilian Blowout smoothing','$285+'],['Oribe Mirror Glass Shine','$35'],['Color Lock','$20'],['Goldwell leave-in treatment (backbar)','$20; $10–15 for half a bottle']]],
  ['Extensions',[['Tape-in extensions','Upon consultation'],['Invisible bead / hand-tied','Upon consultation'],['Extension removal','$75']]],
  ['Styling',[['Wash & blow dry','$50+'],['Formal style','$105']]],
  ['Makeup & lashes',[['Full face, traditional foundation','$85'],['Full face, airbrush foundation','$95'],['Just eyes (shadow & strip lash)','$70'],
    ['Individual false lashes','$25'],['Lash lift & tint','$125'],['Eyelash extensions','Upon consultation']]],
  ['Brows & waxing',[['Brow mapping & sculpt','$25'],['Maintenance brow sculpt','$25'],['Brow tint','$25'],['Brow lamination (with kit)','$85'],
    ['Lamination package (tint, sculpt, laminate)','$150'],['Lip or chin','$15'],['Arm','$40'],['Leg','$70'],['Bikini','$50']]],
  ['Facials',[['New guest treatment & take-home regimen · 30 min','$130'],['Taffeta Facial · 60 min','$130'],['Taffeta HydroDiamond Facial · 60 min','$225'],['Taffeta HydroDiamond Express · 30 min','$99'],['Brightening · 75 min','$160'],
    ['Anti-aging · 75 min','$160'],['Acne · 60 min','$160'],['Gentleman’s · 60 min','$160'],
    ['Express Targeted Treatment · 30–35 min','$99'],['Biologique Recherche Lift & Remodel · 90 min','$200'],['Biologique Recherche Cure All · 90 min','$250']]],
  ['Facial enhancements',[['Microdermabrasion add-on','$50'],['Microdermabrasion only · 45 min','$120'],['Dermaplaning add-on','$40'],['Dermaplaning only · 45 min','$60'],['Cold seaweed masque','$50'],['Cryo stick therapy','$50'],
    ['High frequency','$25'],['LED light therapy','$50'],['Peel','$50']]],
  ['Nails',[['Taffeta Signature Pedicure','$60'],['Signature Pedicure with gel','$75'],['Express pedicure, polish / gel','$35 / $45+'],
    ['Festive pedicure','$80'],['Festive pedicure with gel','$90'],['Taffeta Signature Manicure','$35'],['Gel manicure','$55'],
    ['Express manicure, polish / gel','$15 / $25'],['Gel removal with polish','$40'],['French tip','$10'],['Nail enhancements','$10+'],
    ['Full set acrylic','$100+'],['Acrylic rebalance','$55+'],['Soft gel overlay','$100+'],['Soft gel rebalance','$70+'],['Add gel polish','$10']]]
];
let PR_Q='', PR_SIDE='svc';
function pricesView(){
  rxPull();
  const q=PR_Q.trim().toLowerCase(), hit=t=>!q||t.toLowerCase().includes(q);
  const s=h('input',{type:'search',id:'prq',value:PR_Q,placeholder:PR_SIDE==='svc'?'Search a service':'Search a product',autocomplete:'off'});
  s.addEventListener('input',()=>{PR_Q=s.value;const pos=s.selectionStart;render();const n=document.getElementById('prq');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
  const seg=h('div',{class:'seg',style:'justify-content:center'},
    [['svc','Services'],['ret','Home Care']].map(([k,l])=>h('button',{type:'button','aria-pressed':String(PR_SIDE===k),onclick:()=>{PR_SIDE=k;PR_Q='';render()}},l)));
  // each word of a service starts with a capital (Alexandra, Oct 2026)
  const prTitle=n=>String(n).replace(/(^|[\s(\/-])([a-z])/g,(m,a,b)=>a+b.toUpperCase());
  const row=(n,p)=>h('div',{class:'rxl'},h('div',{class:'rxn'},h('span',{},n)),h('b',{class:'num',style:'font-weight:500;white-space:nowrap'},p));
  let body;
  if(PR_SIDE==='svc'){
    const groups=PR_MENU.map(([g,items,note])=>{const shown=items.filter(([n])=>hit(n)||hit(g));if(!shown.length)return null;
      return h('section',{class:'card2'},h('span',{class:'lbl'},g),...shown.map(([n,p])=>row(prTitle(n),p)),note?h('small',{class:'soft'},note):null)});
    body=groups.some(Boolean)?groups:[h('p',{class:'soft',style:'text-align:center'},'Nothing matches “'+PR_Q+'”.')];
    body.push(h('small',{class:'soft',style:'text-align:center'},'Starting prices from our website menu. “+” means starting at; final price depends on time, length and product.'));
  } else {
    /* Home Care (Alexandra, Oct 23 2026): the Maintenance list moved here from the RX card builder. Stars flip in place so
       she can star several in a row; her go-tos lead the take-home picks on RX cards and the Home Care tab. */
    const fmt=p=>'$'+(Number.isInteger(p)?p:p.toFixed(2)), favs=rxFavs(), all=[...RX_PRICES.hair,...RX_PRICES.skin];
    const skin=new Set(RX_PRICES.skin.map(([n])=>n));
    const star=n=>h('button',{type:'button',class:'rxstar','aria-pressed':String(favs.includes(n)),'aria-label':(favs.includes(n)?'Unstar ':'Star ')+n,
      onclick:e=>{rxFavToggle(n);const on=rxFavs().includes(n),b=e.currentTarget;b.textContent=on?'★':'☆';b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',(on?'Unstar ':'Star ')+n)}},favs.includes(n)?'★':'☆');
    const srow=(n,p)=>{const l=skin.has(n)&&typeof rxLasts==='function'?rxLasts(n):'';
      return h('div',{class:'rxl'},star(n),h('div',{class:'rxn'},h('span',{},n.replace(/^Biologique Recherche /,'BR ')),l?h('small',{class:'soft'},'Lasts '+l):null),h('b',{class:'num',style:'font-weight:500;white-space:nowrap'},fmt(p)))};
    const mine=all.filter(([n])=>favs.includes(n)&&hit(n));
    /* a drop-down per brand so there's less scrolling (Alexandra, Oct 15 2026); searching opens the matches */
    const lines=[['Hair',RX_PRICES.hair],['Skin',RX_PRICES.skin]].map(([g,items])=>{const shown=items.filter(([n])=>(hit(n)||hit(rxBrand(n)))&&!favs.includes(n));if(!shown.length)return null;
      return h('section',{class:'card2'},h('span',{class:'lbl'},g),...rxByBrand(shown).map(([b,L])=>{const d=h('details',{class:'invg'},
        h('summary',{},h('h2',{style:'font-size:17px'},b),h('span',{class:'soft invc'},String(L.length)),h('span',{class:'tplus','aria-hidden':'true'},'+')),
        h('div',{class:'sec2'},...L.map(([n,p])=>srow(n,p))));if(q)d.open=true;return d}))});
    body=[h('small',{class:'soft',style:'text-align:center'},'Her RX card builds home care into her budget for you. Know what your favorites cost, and star your go-tos: they come first when you pick what she takes home.'),
      mine.length?h('section',{class:'card2'},h('span',{class:'lbl'},'★ Your Go-Tos'),...mine.map(([n,p])=>srow(n,p))):
        (q?null:h('small',{class:'soft',style:'text-align:center'},'Tap ☆ on the products you reach for most. They move to the top here, on her take-home card and on Home Care, on your phone and the salon iPad.')),
      h('section',{class:'card2'},h('span',{class:'lbl'},'Sample Bottles'),row('Try Me Bottle · 1 oz of any hair backbar product','$6'),
        row('Taffeta BR Bottle · a BR product, about 2 weeks','$25'),h('small',{class:'soft'},'Skin has no Try Me bottles: the Taffeta BR Bottle is the skin version.')),...lines];
    body.push(h('small',{class:'soft',style:'text-align:center'},'Retail prices from Paired Plus. Always ring up from the POS.'));
  }
  return [h('div',{class:'hub'},h('div',{},h('span',{class:'lbl'},'Salon & spa'),h('h1',{style:'font-size:28px'},'Prices'),
    h('p',{class:'soft',style:'margin-top:6px'},'Know what things cost before you sit down with a guest, so her plan fits her budget.')),
    seg,h('label',{class:'fld'},s),...body)];
}
