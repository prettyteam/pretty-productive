/* At-home regimen tab (Alexandra, Oct 2026): after a service the artist taps the products she recommends,
   how and when to use them, a few aftercare notes and the next visit, then texts the guest a Taffeta PDF.
   Estheticians get the skin list, hair stylists the hair list (never skin advice from a stylist or the reverse).
   Uses the page's h(), S, store and render(). The PDF is made on the phone with jsPDF, loaded only when needed. */

const RG_WHEN={
  skin:['AM & PM','AM','PM','2–3x a week','Once a week','As needed'],
  hair:['Every wash','Before heat styling','When styling','Daily','Once a week','As needed']
};
/* PDF sections, in order: each "when" lands in one or more of them */
const RG_GROUPS={
  skin:[['Every morning',['AM & PM','AM']],['Every evening',['AM & PM','PM']],['2–3 times a week',['2–3x a week']],['Once a week',['Once a week']],['As needed',['As needed']]],
  hair:[['Every wash',['Every wash']],['Before heat styling',['Before heat styling']],['When styling',['When styling']],['Daily',['Daily']],['Once a week',['Once a week']],['As needed',['As needed']]]
};

const RG_HOW={
  milk:'With dry hands and a dry face, cleanse with 1 pump in the morning and 2–3 pumps at night. Massage over face and neck for 1–2 minutes. Remove with a wet cloth, then rinse with cool water. At night, if you’re wearing makeup, double cleanse to remove the first layer.',
  p50:'After cleansing, put 1–2 pumps of P50 on a cotton pad and sweep over face and neck, upward and outward. A light tingle is normal. Do not rinse.',
  serum:'After your P50, press a few drops between your fingertips and pat into face and neck. Let it sink in before your cream.',
  cream:'Warm a pea-size amount between your fingertips and press into face and neck as your last step.',
  eye:'Tap a rice-grain amount around the orbital bone with your ring finger, from the inner corner out.',
  mask:'Apply an even layer to clean skin, avoiding the eyes. Leave on 10–15 minutes, then rinse with lukewarm water.',
  hairsh:'Massage into wet scalp, work through to the ends and rinse. Repeat for a deeper clean.',
  haircond:'After shampoo, comb through mid-lengths and ends. Leave on 2–3 minutes and rinse with cool water.',
  hairmask:'After shampoo, squeeze out water and work through mid-lengths and ends. Leave on 5–10 minutes, then rinse.',
  heat:'Mist evenly over damp or dry hair before blow-drying, curling or flat ironing.',
  style:'Work a small amount through damp hair, roots to ends, then style as usual.',
  finish:'Hold 8–10 inches away and mist over finished hair.',
  oil:'Warm 1–2 drops between your palms and smooth over ends, damp or dry.',
  dry:'Shake, spray at the roots in sections, wait a minute, then massage and brush through.'
};

/* Products we carry (from the Oct 2026 retail list). [name, how] — how is a starting point she can edit per guest. */
const RG_LIST={
  skin:[
    ['Cleanse',[
      ['Biologique Recherche Lait VIP O2',RG_HOW.milk],
      ['Biologique Recherche Lait Dermo-S',RG_HOW.milk],
      ['Biologique Recherche Lait E.V.',RG_HOW.milk],
      ['Biologique Recherche Lait U',RG_HOW.milk],
      ['Biologique Recherche Lait S.R.','With dry hands and a dry face, cleanse with 1 pump in the morning and 2–3 pumps at night. Massage over face and neck for 1–2 minutes. Remove with a wet cloth, then rinse with cool water. At night, if you’re wearing makeup, double cleanse to remove the first layer.'],
      ['Biologique Recherche Solution Démaquillante',"Soak a cotton pad and hold over closed eyes for a few seconds, then gently wipe away eye makeup."],
      ['Biologique Recherche L’Eauxygénante','Mist over face after cleansing or any time skin feels tight.']]],
    ['Tone (Lotion P50)',[
      ['Biologique Recherche Lotion P50',RG_HOW.p50],
      ['Biologique Recherche Lotion P50 1970',RG_HOW.p50],
      ['Biologique Recherche Lotion P50T',RG_HOW.p50],
      ['Biologique Recherche Lotion P50W',RG_HOW.p50],
      ['Biologique Recherche Lotion P50V',RG_HOW.p50],
      ['Biologique Recherche Lotion P50 PIGM 400',RG_HOW.p50],
      ['Biologique Recherche Lotion MC 110','Use 2–3 times a week. Apply 1–2 pumps to a cotton round and tap onto the affected areas. Also great for fine lines.','2–3x a week']]],
    ['Serums',[
      ['Biologique Recherche Sérum Collagène Originel',RG_HOW.serum],
      ['Biologique Recherche Elastine Sérum',RG_HOW.serum],
      ['Biologique Recherche Sérum Progeskin',RG_HOW.serum],
      ['Biologique Recherche Sérum A-Glyca',RG_HOW.serum],
      ['Biologique Recherche Sérum Biosensible',RG_HOW.serum],
      ['Biologique Recherche Sérum Vivant','Apply 2–3 drops onto blemished areas and pat into skin.','PM'],
      ['Biologique Recherche Sérum Erythros',RG_HOW.serum],
      ['Biologique Recherche Sérum PIGM 400',RG_HOW.serum],
      ['Biologique Recherche Sérum Liposmose',RG_HOW.serum],
      ['Biologique Recherche Iso-Placenta',RG_HOW.serum],
      ['Biologique Recherche Amniotique','After your P50, apply 2–3 drops directly onto skin. Gently pat to spread the product evenly over face and neck.'],
      ['Biologique Recherche Colostrum Sérum Authentique',RG_HOW.serum],
      ['Biologique Recherche Spectral Sérum Authentique',RG_HOW.serum],
      ['Biologique Recherche Complexe Iribiol',RG_HOW.serum],
      ['Biologique Recherche Dermopore',RG_HOW.serum],
      ['Biologique Recherche Oligo-Protéines Marines',RG_HOW.serum],
      ['Biologique Recherche Silk Plus',RG_HOW.serum],
      ['Biologique Recherche Le Grand Sérum',RG_HOW.serum],
      ['Cool Cucumber Hydralixir','Pat 2–3 drops into clean skin before your moisturizer.']]],
    ['Moisturize',[
      ['Biologique Recherche Crème Verte Espoir','Use a pea-size amount all over face and neck. Emulsify between your fingers and press into skin. Use a little more if needed.'],
      ['Biologique Recherche Crème Elastine',RG_HOW.cream],
      ['Biologique Recherche Crème ADN Elastine Marine Collagène',RG_HOW.cream],
      ['Biologique Recherche Crème Hydravits',RG_HOW.cream],
      ['Biologique Recherche Crème M.E.C.',RG_HOW.cream],
      ['Biologique Recherche Crème PIGM 400',RG_HOW.cream],
      ['Biologique Recherche Crème Grand Millésime',RG_HOW.cream],
      ['Cool Cucumber Soothe Operator','Smooth over skin that feels warm, red or irritated.']]],
    ['Eyes',[
      ['Biologique Recherche Crème Contour des Yeux VIP O2',RG_HOW.eye],
      ['Biologique Recherche Crème Contour des Yeux Biofixine',RG_HOW.eye],
      ['Biologique Recherche Crème Contour des Yeux Biosensible',RG_HOW.eye]]],
    ['Masks',[
      ['Biologique Recherche Masque Vivant',RG_HOW.mask],
      ['Biologique Recherche Masque VIP O2',RG_HOW.mask],
      ['Biologique Recherche Masque Biofixine',RG_HOW.mask],
      ['Biologique Recherche Masque Visolastine',RG_HOW.mask],
      ['Biologique Recherche Masque Caviar Vert',RG_HOW.mask]]],
    ['Protect & glow',[
      ['Mineral Sheer Tint','Smooth over your moisturizer every morning. Reapply sunscreen every 2 hours outdoors.'],
      ['Mineral Liquid Powder SPF 15','Sweep over moisturizer or makeup for light coverage and extra sun protection.'],
      ['Aluram Golden Glow Body Lotion','Smooth over body after showering while skin is still slightly damp.']]]
  ],
  hair:[
    ['Shampoo',[
      ['Oribe Gold Lust Repair & Restore Shampoo',RG_HOW.hairsh],
      ['Oribe Shampoo for Beautiful Color',RG_HOW.hairsh],
      ['Oribe Shampoo for Magnificent Volume',RG_HOW.hairsh],
      ['Oribe Supershine Hydrating Shampoo',RG_HOW.hairsh],
      ['Oribe Signature Shampoo',RG_HOW.hairsh],
      ['Oribe Hair Alchemy Resilience Shampoo',RG_HOW.hairsh],
      ['Oribe Serene Scalp Balancing Shampoo',RG_HOW.hairsh],
      ['Oribe Serene Scalp Densifying Shampoo',RG_HOW.hairsh],
      ['Oribe Bright Blonde Shampoo','Use once or twice a week in place of your regular shampoo. Leave on 1–3 minutes to tone brassiness, then rinse.'],
      ['Oribe Eternal Curl Moisturizing Shampoo',RG_HOW.hairsh],
      ['Oribe Oil Control Shampoo',RG_HOW.hairsh],
      ['Oribe Run-Through Detangling Shampoo',RG_HOW.hairsh],
      ['K18 Triple Bright Purple Shampoo','Use once or twice a week in place of your regular shampoo. Leave on 1–3 minutes to tone brassiness, then rinse.'],
      ['Olaplex Purple Shampoo','Use once or twice a week in place of your regular shampoo. Leave on 1–3 minutes to tone brassiness, then rinse.'],
      ['Davines Love Smoothing Shampoo',RG_HOW.hairsh],
      ['Davines NouNou Shampoo',RG_HOW.hairsh],
      ['Brazilian Blowout Anti-Frizz Shampoo','Sulfate-free, so your smoothing treatment lasts. Massage in, rinse and repeat.'],
      ['Aluram Moisture Shampoo',RG_HOW.hairsh],
      ['Aluram Daily Shampoo',RG_HOW.hairsh]]],
    ['Condition',[
      ['Oribe Gold Lust Repair & Restore Conditioner',RG_HOW.haircond],
      ['Oribe Conditioner for Beautiful Color',RG_HOW.haircond],
      ['Oribe Conditioner for Magnificent Volume',RG_HOW.haircond],
      ['Oribe Supershine Hydrating Conditioner',RG_HOW.haircond],
      ['Oribe Signature Conditioner',RG_HOW.haircond],
      ['Oribe Hair Alchemy Resilience Conditioner',RG_HOW.haircond],
      ['Oribe Serene Scalp Balancing Conditioner',RG_HOW.haircond],
      ['Oribe Eternal Curl Intense Conditioner',RG_HOW.haircond],
      ['Davines Love Conditioner',RG_HOW.haircond],
      ['Davines NouNou Conditioner',RG_HOW.haircond],
      ['Brazilian Blowout Anti-Frizz Conditioner',RG_HOW.haircond],
      ['Aluram Moisture Conditioner',RG_HOW.haircond],
      ['Aluram Daily Conditioner',RG_HOW.haircond]]],
    ['Treat & repair',[
      ['K18 Leave-In Molecular Repair Mask','Shampoo (skip conditioner), towel-dry, then work 1–2 pumps through mid-lengths and ends. Wait 4 minutes, then style. Do not rinse.'],
      ['Oribe Gold Lust Masque',RG_HOW.hairmask],
      ['Oribe Mirror Rinse Glass Hair Treatment','After shampoo, apply to wet hair, leave on 3–5 minutes and rinse for a glassy shine.'],
      ['Oribe Gold Lust Restorative Night Crème','Smooth a small amount through dry ends before bed. Style as usual in the morning.'],
      ['IGK Antisocial Bond Building Dry Mask','Mist over dry hair, leave on at least 10 minutes or overnight, then style or wash.'],
      ['Oribe Serene Scalp Thickening Treatment Spray','Part damp hair in sections and mist directly onto the scalp. Massage in. Do not rinse.'],
      ['Oribe Serene Scalp Soothing Leave-On','Apply to the scalp in sections after washing and massage in.'],
      ['Oribe Oil Control Treatment Mist','Mist onto the scalp between washes and massage in.']]],
    ['Prep & heat protect',[
      ['Oribe Run-Through Detangling Primer','Mist over towel-dried hair and comb through before styling.'],
      ['Oribe Royal Blowout Heat Styling Spray',RG_HOW.heat],
      ['Oribe Gold Lust Dry Heat Protection Spray',RG_HOW.heat],
      ['Oribe Balm d’Or Heat Styling Shield','Work a small amount through damp hair before heat styling.'],
      ['K18 Heatbounce Heat Protectant',RG_HOW.heat],
      ['K18 Astro Lift Reparative Spray',RG_HOW.heat],
      ['IGK Good Behavior 4-in-1 Prep Spray','Mist through damp hair and comb through before styling.'],
      ['Brazilian Blowout Ionic Bonding Spray',RG_HOW.heat]]],
    ['Style',[
      ['Oribe Imperial Blowout',RG_HOW.style],
      ['Oribe Grandiose Hair Plumping Mousse','Shake, dispense a golf-ball size into your palm and work through damp roots. Blow-dry.'],
      ['Oribe Maximista Thickening Spray','Mist at the roots and through damp hair, then blow-dry.'],
      ['Oribe Supershine Moisturizing Cream',RG_HOW.style],
      ['Oribe Light Supershine Moisturizing Cream',RG_HOW.style],
      ['Oribe Featherless Balm',RG_HOW.style],
      ['Oribe Curl Gloss',"Scrunch through wet curls and air-dry or diffuse. Don't touch until fully dry."],
      ['Oribe Eternal Curl Polish + Protect',"Scrunch through wet curls and air-dry or diffuse. Don't touch until fully dry."],
      ['Oribe Matte Waves Texture Lotion',RG_HOW.style],
      ['Oribe Hair Alchemy Heatless Styling Balm',RG_HOW.style],
      ['IGK Beach Club Style Memory Blowout Cream',RG_HOW.style],
      ['IGK Beach Club Blowout Serum',RG_HOW.style],
      ['IGK Big Time Volume Mousse','Shake, dispense a golf-ball size into your palm and work through damp roots. Blow-dry.'],
      ['IGK Good Spin Curl Gelée',"Scrunch through wet curls and air-dry or diffuse. Don't touch until fully dry."],
      ['Davines Volume Boosting Mousse','Shake, dispense a golf-ball size into your palm and work through damp roots. Blow-dry.'],
      ['Aluram Smoothing Balm Stick','Glide over flyaways and part lines for a polished finish.']]],
    ['Finish',[
      ['Oribe Gold Lust Nourishing Hair Oil',RG_HOW.oil],
      ['Oribe Superfine Hair Spray',RG_HOW.finish],
      ['Oribe Superfine Strong Hair Spray',RG_HOW.finish],
      ['Oribe Dry Texturizing Spray','Spray in sections at the roots and mid-lengths of dry hair, then tousle with your fingers.'],
      ['Oribe Après Beach Wave & Shine Spray','Mist over damp or dry hair and scrunch for soft, beachy waves.'],
      ['Oribe Mystify Restyling Spray','Mist over dry hair to refresh and restyle second-day hair.'],
      ['Oribe Anti-Humidity Spray','Mist over finished hair to lock out frizz.'],
      ['Oribe Flash Form Finishing Spray Wax','Spray onto your fingertips or directly on pieces for piecey texture.'],
      ['Oribe Rough Luxury Soft Molding Paste','Warm a small amount in your palms and work through dry hair.'],
      ['Oribe Fiber Groom Elastic Texture Paste','Warm a small amount in your palms and work through dry hair.'],
      ['Oribe Gold Lust Dry Shampoo',RG_HOW.dry],
      ['Oribe Oil Control Dry Shampoo Powder',RG_HOW.dry],
      ['K18 AirWash Dry Shampoo',RG_HOW.dry],
      ['IGK Expensive Clear Gloss Top Coat',RG_HOW.oil],
      ['IGK Beach Club Touchable Texture Spray','Spray in sections at the roots and mid-lengths of dry hair, then tousle with your fingers.'],
      ['IGK Texture Powder','Tap a little onto the roots and massage in for lift.'],
      ['Davines Paste','Warm a small amount in your palms and work through dry hair.']]],
    ['Tools',[
      ['Ergo Ionic Ceramic Round Brush','Blow-dry in sections, rolling the brush from roots to ends with the dryer nozzle pointed down.'],
      ['EHP Hair Extension Brush','Hold your hair at the root and brush from the ends up, twice a day.'],
      ['EHP Knotty or Nice Brush Set','Brush gently from the ends up.'],
      ['Jolie Filtered Showerhead','Filters out chlorine and minerals that fade color. Change the filter every 3 months.']]]
  ]
};

const RG_NOTES={
  skin:['Wear SPF 30+ every morning and reapply every 2 hours outdoors','No retinol, acids or scrubs for 48–72 hours','Skip makeup for 12–24 hours','Avoid saunas, hot yoga and hard workouts for 24 hours','Don’t pick or peel, let skin shed on its own','Sleep on a fresh pillowcase tonight','Drink extra water for the next few days'],
  hair:['Wait 48–72 hours before your first shampoo','Wash 2–3 times a week to keep color longer','Rinse with cool or lukewarm water','Use heat protectant every time you heat style','Sleep on a silk pillowcase','Wet hair and add leave-in before the pool or ocean','Brush extensions from the ends up, twice a day','Skip drugstore and clarifying shampoos']
};
const RG_SERV={
  skin:['Facial','Dermaplaning','Nano Needling','Peel','Brow Sculpt','Lift & Tint','Waxing','Gel mani/pedi','Makeup'],
  hair:['Color','Glaze','Balayage / foils','Cut','Blowout','Extensions','Smoothing','K18 treatment']
};
const RG_SKINTYPE=['Dehydrated / aging','Acne-prone / oily','Rosacea / sensitive','Normal / combination'];
const RG_NEXT=['2 weeks','3 weeks','4 weeks','6 weeks','8 weeks','10–12 weeks'];
const RG_PHONE='(609) 383-5504', RG_SITE='taffetadesign.com';

const rgKind=()=>(S.mine&&S.mine.role==='esthetician')?'skin':'hair';
const rgKey=()=>'pp-regimen:'+((S.mine&&S.mine.staff&&S.mine.staff.slug)||(typeof ID!=='undefined'?ID:'x'));
const rgBlank=()=>({guest:'',services:[],type:'',picks:[],notes:[],own:'',next:'',nextDate:'',msg:''});
/* "Come back to see us …" line for the PDF and text, from a picked date or an "in about" chip */
function rgBack(R){
  if(R.nextDate){const [y,m,d]=R.nextDate.split('-').map(Number);return 'on '+new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
  return R.next?'in about '+R.next:'';
}
let RG=null, RG_Q='', RG_OPEN=null, RG_TOAST='';
function rgLoad(){ if(RG) return RG; try{RG=Object.assign(rgBlank(),JSON.parse(store.get(rgKey())||'{}'))}catch(e){RG=rgBlank()} return RG }
function rgSave(){ store.set(rgKey(),JSON.stringify(RG)) }
const rgToggle=(a,v)=>{const i=a.indexOf(v); i<0?a.push(v):a.splice(i,1)};
const rgFirst=n=>String(n||'').trim().split(/\s+/)[0]||'';

function regimenView(){
  const kind=rgKind(), R=rgLoad(), whens=RG_WHEN[kind];
  const me=(S.mine&&(S.mine.name||(S.mine.staff&&S.mine.staff.name)))||'';
  const chips=(opts,isOn,onTap)=>h('div',{class:'seg'},opts.map(o=>h('button',{type:'button','aria-pressed':String(!!isOn(o)),onclick:()=>{onTap(o);rgSave();render()}},o)));
  const picked=n=>R.picks.find(p=>p.n===n);

  const head=h('div',{},h('span',{class:'lbl'},kind==='skin'?'Spa':'Salon'),h('h1',{style:'font-size:28px'},'At-home regimen'),
    h('p',{class:'soft',style:'margin-top:6px'},'Tap what you recommend and save. The front desk texts her a Taffeta PDF of her routine.'),
    RG_TOAST&&/^Saved/.test(RG_TOAST)?h('div',{class:'card2',style:'margin-top:14px;text-align:center;border-color:var(--ink)'},h('p',{},'✓ '+RG_TOAST)):null);

  /* 1 · guest */
  const gIn=h('input',{type:'text',value:R.guest,placeholder:'First name',autocomplete:'off',autocapitalize:'words'});
  gIn.addEventListener('input',()=>{R.guest=gIn.value;rgSave()});
  const guest=h('section',{class:'card2'},h('span',{class:'lbl'},'1 · Your guest'),
    h('label',{class:'fld'},'Guest’s name',gIn),
    h('div',{class:'fld'},'Today’s service',chips(RG_SERV[kind],o=>R.services.includes(o),o=>rgToggle(R.services,o))),
    kind==='skin'?h('div',{class:'fld'},'Skin type',chips(RG_SKINTYPE,o=>R.type===o,o=>{R.type=R.type===o?'':o})):null);

  /* 2 · products */
  const q=RG_Q.trim().toLowerCase();
  const sIn=h('input',{type:'search',value:RG_Q,placeholder:'Search a product',autocomplete:'off'});
  sIn.addEventListener('input',()=>{RG_Q=sIn.value;const pos=sIn.selectionStart;render();const n=document.getElementById('rgq');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
  sIn.id='rgq';
  const groups=RG_LIST[kind].map(([step,items])=>{
    const shown=items.filter(([n])=>!q||n.toLowerCase().includes(q));
    if(!shown.length) return null;
    const count=items.filter(([n])=>picked(n)).length;
    const d=h('details',{class:'invg'},h('summary',{},h('h2',{},step),h('span',{class:'soft invc'},count?count+' picked':items.length+''),h('span',{class:'tplus','aria-hidden':'true'},'+')),
      h('div',{class:'sec2'},shown.map(([n,how,w0])=>{
        const p=picked(n);
        return h('button',{type:'button',class:'rgp','aria-pressed':String(!!p),onclick:()=>{
          if(p) R.picks=R.picks.filter(x=>x!==p); else R.picks.push({n,how,when:w0&&whens.includes(w0)?w0:whens[0],step});
          RG_OPEN=step; rgSave(); render();}},h('span',{class:'rgbox','aria-hidden':'true'}),h('span',{},n.replace(/^Biologique Recherche /,'')));
      })));
    if(q||RG_OPEN===step) d.open=true;
    return d;
  });
  const products=h('section',{class:'card2'},h('span',{class:'lbl'},'2 · Products'),
    h('label',{class:'fld'},sIn),...groups,
    q&&!groups.some(Boolean)?h('p',{class:'soft'},'Nothing matches “'+RG_Q+'”. Add it under your own notes below.'):null);

  /* 3 · how & when, one card per pick, in the order of the routine */
  const order=RG_LIST[kind].flatMap(([,items])=>items.map(([n])=>n));
  R.picks.sort((a,b)=>order.indexOf(a.n)-order.indexOf(b.n));
  const plan=h('section',{class:'card2'},h('span',{class:'lbl'},'3 · How & when'),
    R.picks.length?R.picks.map(p=>{
      const ta=h('textarea',{class:'rgta',rows:'3'}); ta.value=p.how;
      ta.addEventListener('input',()=>{p.how=ta.value;rgSave()});
      return h('div',{class:'rgitem'},
        h('div',{class:'rgitem-h'},h('b',{},p.n),h('button',{type:'button',class:'rgx','aria-label':'Remove '+p.n,onclick:()=>{R.picks=R.picks.filter(x=>x!==p);rgSave();render()}},'×')),
        chips(whens,o=>p.when===o,o=>{p.when=o}),
        h('label',{class:'fld'},h('small',{class:'soft'},'How to use (edit for her if you like)'),ta));
    }):h('p',{class:'soft'},'Tap products above and they show up here with how and when to use them.'));

  /* 4 · aftercare & next visit */
  const own=h('textarea',{class:'rgta',rows:'3',placeholder:kind==='skin'?'Anything else she should know…':'Anything else she should know, like her formula reminder or a styling tip…'}); own.value=R.own;
  own.addEventListener('input',()=>{R.own=own.value;rgSave()});
  const msg=h('textarea',{class:'rgta',rows:'2',placeholder:'A short note from you (optional)'}); msg.value=R.msg;
  msg.addEventListener('input',()=>{R.msg=msg.value;rgSave()});
  const care=h('section',{class:'card2'},h('span',{class:'lbl'},'4 · Aftercare & next visit'),
    h('div',{class:'fld'},'Aftercare',h('div',{class:'rgnotes'},RG_NOTES[kind].map(t=>h('button',{type:'button',class:'rgp','aria-pressed':String(R.notes.includes(t)),onclick:()=>{rgToggle(R.notes,t);rgSave();render()}},h('span',{class:'rgbox','aria-hidden':'true'}),h('span',{},t))))),
    h('label',{class:'fld'},'Other notes',own),
    h('div',{class:'fld'},'When should she come back?',chips(RG_NEXT,o=>R.next===o,o=>{R.next=R.next===o?'':o;R.nextDate=''})),
    (()=>{const di=h('input',{type:'date',value:R.nextDate||''});di.addEventListener('change',()=>{R.nextDate=di.value;if(di.value)R.next='';rgSave();render()});
      return h('label',{class:'fld'},h('small',{class:'soft'},'Or pick an exact date'),di)})(),
    h('label',{class:'fld'},'Note from you',msg));

  /* 5 · send */
  const ready=R.picks.length||R.notes.length||R.own.trim();
  const toast=h('p',{class:'toast'},RG_TOAST);
  const send=h('button',{type:'button',class:'obtn',disabled:ready?null:'',onclick:()=>rgSave2(me,toast,send)},'Save & send to desk');
  const prev=h('button',{type:'button',class:'tab',disabled:ready?null:'',onclick:()=>rgPreview(me,toast,RG,kind)},'Preview PDF');
  const clear=h('button',{type:'button',class:'tab',onclick:()=>{if(!confirm('Start a new regimen? This clears the one on screen.'))return;RG=rgBlank();RG_TOAST='';rgSave();render();window.scrollTo(0,0)}},'Start a new one');
  const out=h('section',{class:'card2',style:'align-items:center;text-align:center'},h('span',{class:'lbl'},'5 · Save it'),
    send,h('div',{class:'seg',style:'justify-content:center'},prev,clear),toast,
    h('small',{class:'soft'},'Save sends it to the front desk, and they text it to her. Your screen clears for your next guest.'));

  return [h('div',{class:'hub'},head,guest,products,plan,care,out)];
}

/* what goes on the PDF: sections in routine order */
function rgSections(kind,R){
  return RG_GROUPS[kind].map(([title,ws])=>[title,R.picks.filter(p=>ws.includes(p.when))]).filter(([,a])=>a.length);
}
const rgDate=()=>new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

let RG_LIB=null, RG_LOGO=null;
function rgLib(){
  if(window.jspdf) return Promise.resolve(window.jspdf);
  return RG_LIB||(RG_LIB=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=()=>ok(window.jspdf);s.onerror=()=>{RG_LIB=null;no(new Error('lib'))};document.head.appendChild(s)}));
}
function rgLogo(){
  if(RG_LOGO) return Promise.resolve(RG_LOGO);
  return fetch((window.RG_BASE||'')+'g/logo.png').then(r=>r.blob()).then(b=>new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(RG_LOGO=f.result);f.readAsDataURL(b)})).catch(()=>null);
}

/* Half-letter page (5.5 × 8.5 in), easy to read on a phone. Cream page, Taffeta wreath, serif headings. */
async function rgPdf(me,R,kind){
  R=R||RG; kind=kind||rgKind();
  const [lib,logo]=await Promise.all([rgLib(),rgLogo()]);
  const doc=new lib.jsPDF({unit:'pt',format:[396,612]});
  const W=396, H=612, M=34, CW=W-M*2, ink=[18,18,18], soft=[95,91,85], choc=[74,52,38], line=[226,222,213];
  let y=0;
  const bg=()=>{doc.setFillColor(248,246,240);doc.rect(0,0,W,H,'F')};
  const foot=()=>{doc.setDrawColor(...line);doc.line(M,H-40,W-M,H-40);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...soft);
    doc.text('Taffeta Salon & Spa  ·  219 Bellevue Ave, Hammonton NJ  ·  '+RG_PHONE+'  ·  '+RG_SITE,W/2,H-26,{align:'center'})};
  const page=()=>{foot();doc.addPage([396,612]);bg();y=M+6};
  const need=n=>{if(y+n>H-52)page()};
  const para=(t,size,font,style,color,gap,indent)=>{doc.setFont(font,style);doc.setFontSize(size);doc.setTextColor(...color);
    const lines=doc.splitTextToSize(t,CW-(indent||0)), lh=size*1.32;
    lines.forEach(l=>{need(lh);doc.text(l,M+(indent||0),y+size);y+=lh});y+=gap||0};
  const label=t=>{need(30);y+=6;doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...choc);doc.setCharSpace(1.6);doc.text(t.toUpperCase(),M,y+8);doc.setCharSpace(0);
    doc.setDrawColor(...line);doc.line(M,y+13,W-M,y+13);y+=22};

  bg();
  if(logo) doc.addImage(logo,'PNG',W/2-34,24,68,68);
  y=104;
  doc.setFont('times','italic');doc.setFontSize(22);doc.setTextColor(...ink);
  doc.text('Your at-home '+(kind==='skin'?'skincare':'hair care'),W/2,y+18,{align:'center'});y+=30;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...soft);
  const who=[R.guest.trim()?'For '+R.guest.trim():'',me?'from '+me:'',rgDate()].filter(Boolean).join('  ·  ');
  doc.text(who,W/2,y+10,{align:'center'});y+=18;
  const meta=[R.services.length?'Today: '+R.services.join(', '):'',kind==='skin'&&R.type?'Skin type: '+R.type:''].filter(Boolean).join('  ·  ');
  if(meta){doc.text(doc.splitTextToSize(meta,CW),W/2,y+10,{align:'center'});y+=18}
  y+=6;

  const seen=new Set();
  rgSections(kind,R).forEach(([title,items])=>{
    label(title);
    items.forEach((p,i)=>{
      need(40);
      doc.setFont('times','normal');doc.setFontSize(11.5);doc.setTextColor(...choc);doc.text(String(i+1),M,y+11);
      para(p.n,11.5,'times','bold',ink,1,16);
      if(seen.has(p)) para('Same as above.',9.5,'helvetica','italic',soft,6,16);
      else if(p.how.trim()) para(p.how.trim(),9.5,'helvetica','normal',soft,8,16); else y+=6;
      seen.add(p);
    });
  });

  const notes=R.notes.concat(R.own.trim()?R.own.trim().split(/\n+/):[]);
  if(notes.length){label('Aftercare');notes.forEach(n=>{need(16);doc.setTextColor(...choc);doc.setFontSize(9.5);doc.text('•',M+2,y+9.5);para(n,9.5,'helvetica','normal',ink,3,14)})}

  if(rgBack(R)||R.msg.trim()){
    y+=10; need(70);
    const top=y; y+=12;
    if(R.msg.trim()) para('“'+R.msg.trim()+'”',11,'times','italic',ink,6,12);
    if(rgBack(R)) para('Come back to see us '+rgBack(R)+'. Call or text '+RG_PHONE+' to book.',9.5,'helvetica','bold',choc,2,12);
    y+=8; doc.setDrawColor(...choc); doc.setLineWidth(.8); doc.line(M,top,M,y); doc.setLineWidth(.2);
  }
  if(kind==='skin'&&R.picks.some(p=>/^Biologique Recherche/.test(p.n))){y+=10;para('Remember, Biologique Recherche is very concentrated, so only a small amount is needed. If you have questions, reach out any time!',9.5,'helvetica','italic',soft,2)}
  y+=12; need(20);
  doc.setFont('times','italic');doc.setFontSize(13);doc.setTextColor(...choc);doc.text(kind==='skin'?(me?'Pretty Skin by '+rgFirst(me):'Pretty Skin by Taffeta'):'xo, '+(me||'Taffeta')+'  ·  Hi Pretty',W/2,y+12,{align:'center'});
  foot();
  return doc.output('blob');
}
const rgFile=(R,kind)=>'Taffeta '+(kind==='skin'?'Skincare':'Hair Care')+' Regimen'+(R.guest.trim()?' - '+rgFirst(R.guest):'')+'.pdf';
/* Share sheet (used by the front desk to text it to the guest) */
async function rgShare(me,R,kind,toast){
  toast.textContent='Making her PDF…';
  try{
    const blob=await rgPdf(me,R,kind), file=new File([blob],rgFile(R,kind),{type:'application/pdf'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:'Your Taffeta at-home regimen'});toast.textContent='Sent? Tap Mark sent.'}
      catch(e){toast.textContent=e&&e.name==='AbortError'?'':'Couldn’t open the share sheet. Try Preview.'}
    } else {const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=rgFile(R,kind);document.body.appendChild(a);a.click();a.remove();toast.textContent='Saved the PDF. Attach it to your text.'}
  }catch(e){toast.textContent='Couldn’t make the PDF. Check the Wi-Fi and try again.'}
}
async function rgPreview(me,toast,R,kind){
  toast.textContent='Making the preview…';
  const w=window.open('','_blank');
  try{const url=URL.createObjectURL(await rgPdf(me,R,kind)); if(w) w.location=url; else location.href=url; toast.textContent=''}
  catch(e){if(w) w.close(); toast.textContent='Couldn’t make the PDF. Check your signal and try again.'}
}
/* Artist taps Save PDF: the regimen goes to the Home care list in the front desk app, and her screen clears for the next guest */
/* Off until the Front Desk Apps Script has the Home care handler. The old script answers ok to any post,
   so saving before then would clear the artist's screen without anything reaching the desk. */
const RG_DESK_ON=false;
async function rgSave2(me,toast,btn){
  if(!RG_DESK_ON){toast.textContent='The front desk list isn’t switched on yet. Your regimen stays saved on this screen, so tap again once it is.';return}
  const st=(S.mine&&S.mine.staff)||{}, kind=rgKind();
  if(!RG.guest.trim()){toast.textContent='Add her name first so the desk knows who it’s for.';return}
  btn.disabled=true; toast.textContent='Saving…';
  try{
    const r=await fetch(window.TAFFETA_ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({type:'regimen',slug:st.slug,t:st.t,artist:me,guest:RG.guest.trim(),kind,data:RG})});
    const j=await r.json();
    if(!j.ok) throw new Error(j.error||'no');
    const who=rgFirst(RG.guest);
    RG=rgBlank(); RG_Q=''; RG_OPEN=null; rgSave();
    RG_TOAST='Saved. '+who+'’s PDF is on the front desk list to text her.'; render(); window.scrollTo(0,0);
  }catch(e){btn.disabled=false; toast.textContent='That didn’t save. Check your signal and try again.'}
}
