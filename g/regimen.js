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
  p50:'After cleansing, put 1–2 drops of your P50 on a cotton round and press it into your face and neck in an upward motion. No rubbing. Avoid the eye area. A light tingle is normal. Don’t rinse.',
  /* serum and cream in Carolyn's own words (Oct 14 2026) */
  serum:'After your P50, apply 2–3 drops directly onto skin. Gently pat to spread the product evenly over face and neck.',
  cream:'Use a pea-size amount all over face and neck. Emulsify between your fingers and press into skin. Use a little more if needed.',
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
/* sign-off follows today's service: brows or lashes only say Pretty Brows / Pretty Lashes instead of Pretty Skin (Alexandra, Oct 20 2026) */
const rgPretty=(kind,sv)=>{if(kind!=='skin')return 'Pretty Hair by ';const b=sv.includes('Brow Sculpt'),l=sv.includes('Lift & Tint');
  return sv.length&&sv.every(x=>x==='Brow Sculpt'||x==='Lift & Tint')?(b&&l?'Pretty Brows & Lashes by ':b?'Pretty Brows by ':'Pretty Lashes by '):'Pretty Skin by '};
const RG_PHONE='(609) 383-5504', RG_SITE='taffetadesign.com', RG_IG={skin:'spa.taffeta',hair:'taffetasalonandspa'};   /* Instagram for the PDF footer: the spa account on skin sheets, the salon's on hair (Oct 20 2026) */

const rgKind=()=>(S.mine&&S.mine.role==='esthetician')?'skin':'hair';
const rgKey=()=>'pp-regimen:'+((S.mine&&S.mine.staff&&S.mine.staff.slug)||(typeof ID!=='undefined'?ID:'x'));
const rgBlank=()=>({guest:'',services:[],type:'',picks:[],notes:[],own:'',next:'',nextDate:'',msg:''});
/* "Come back to see us …" line for the PDF and text, from a picked date or an "in about" chip */
function rgBack(R){
  if(R.nextDate){const [y,m,d]=R.nextDate.split('-').map(Number);return 'on '+new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
  return R.next?'in about '+R.next:'';
}
let RG=null, RG_Q='', RG_OPEN=null, RG_TOAST='';
const RG_SKIN_BRANDS=['Biologique Recherche','Cool Cucumber','Taffeta','Aluram','Oribe'];
const RX_BRANDS_ORDER=b=>{const L=typeof RX_BRANDS!=='undefined'?RX_BRANDS:[];return L.indexOf(b)+1||99};
function rgLoad(){ if(RG) return RG; try{RG=Object.assign(rgBlank(),JSON.parse(store.get(rgKey())||'{}'))}catch(e){RG=rgBlank()} return RG }
function rgSave(){ store.set(rgKey(),JSON.stringify(RG)) }
const rgToggle=(a,v)=>{const i=a.indexOf(v); i<0?a.push(v):a.splice(i,1)};
const rgFirst=n=>String(n||'').trim().split(/\s+/)[0]||'';

/* Every retail product we sell (RX_PRICES in g/rx.js, Alexandra Oct 17 2026), merged with the hand-written list above:
   a product already in RG_LIST keeps its step and wording; the rest get a step and a starter how-to from their name. */
const rgNorm=n=>String(n).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/hair ?spray/g,'hairspray').replace(/[^a-z0-9]/g,'');
const rgBase=n=>String(n).replace(/\s*\([^)]*\)\s*$/,'').replace(/,\s*(new bottle|refill|mini|travel|[\d.]+"?\s*(oz|ml)?)$/i,'').trim();
function rgGuess(kind,n){
  const t=n.toLowerCase(), H=RG_HOW;
  if(kind==='skin'){
    if(/masque|mask|patch/.test(t)) return ['Masks',/patch/.test(t)?H.eye:H.mask];
    if(/eye|yeux|concealer/.test(t)) return ['Eyes',H.eye];
    if(/lait|micellaire|cleans|démaquill/.test(t)) return ['Cleanse',H.milk];
    if(/mc 110/.test(t)) return ['Tone (Lotion P50)',H.mc110];
    if(/p50/.test(t)) return ['Tone (Lotion P50)',H.p50];
    if(/box/.test(t)) return ['Kits & more',''];
    if(/u\.v\.|spf|teint|kiss|hand|body|oil|tint/.test(t)) return ['Protect & glow',''];
    if(/crème|creme|émulsion|emulsion/.test(t)) return ['Moisturize',H.cream];
    if(/sérum|serum|fluide|extraits|tensil|collag|lastine|placenta|eauxyg/.test(t)) return ['Serums',/eauxyg/.test(t)?'Mist over face after cleansing or any time skin feels tight.':H.serum];
    return ['Kits & more',''];
  }
  if(/holiday|\bset\b|collection/.test(t)) return ['Sets & travel',''];
  if(/hand & nail|parfum/.test(t)) return ['More',''];
  if(/dry shampoo|airwash|dry volume/.test(t)) return ['Finish',H.dry];
  if(/pre-shampoo/.test(t)) return ['Treat & repair',H.hairmask];
  if(/shampoo|cleanse\b|wash/.test(t)) return ['Shampoo',H.hairsh];
  if(/leave-in/.test(t)) return ['Condition','After washing, spray or smooth through damp mid-lengths and ends. Do not rinse.'];
  if(/conditioner/.test(t)) return ['Condition',H.haircond];
  if(/brush|iron|dryer|curl id|curl x|pillowcase|showerhead|filter|kit|wand/.test(t)) return ['Tools',''];
  if(/oil\b|oil,/.test(t)) return ['Treat & repair',H.oil];
  if(/heat|protect|primer|blowout spray|defense/.test(t)) return ['Prep & heat protect',H.heat];
  if(/mask|treatment|drops|repair|scalp|serum/.test(t)) return ['Treat & repair',H.hairmask];
  if(/foam|mousse|pomade|balm|butter|gelée|cr[eè]me|cream/.test(t)) return ['Style',H.style];
  if(/spray|shine|gloss|hold/.test(t)) return ['Finish',H.finish];
  if(/gel|textur|dust|powder/.test(t)) return ['Style',H.style];
  return ['More',''];
}
const RG_CAT={};
function rgCatalog(kind){
  if(RG_CAT[kind]) return RG_CAT[kind];
  const out=[], by=new Map();
  RG_LIST[kind].forEach(([step,items])=>items.forEach(([n,how,w0])=>{const it={n,how,w0,step,sizes:[]};out.push(it);by.set(rgNorm(n),it)}));
  const rx=(typeof RX_PRICES!=='undefined'&&RX_PRICES[kind])||[];
  rx.forEach(([full])=>{
    const b=rgBase(full).replace(/^Hydralixir/,'Cool Cucumber Hydralixir'), k=rgNorm(b);
    let it=by.get(k)||[...by.entries()].find(([x])=>x.length>8&&(k.startsWith(x)||x.startsWith(k)))?.[1];
    if(!it){const [step,how]=rgGuess(kind,b);it={n:b,how,w0:'',step,sizes:[]};out.push(it);by.set(k,it)}
    it.sizes.push(full);
  });
  const steps=[...RG_LIST[kind].map(x=>x[0]),'Sets & travel','Kits & more','More'];
  out.forEach(it=>{it.brand=typeof rxBrand==='function'?rxBrand(it.n):'More';if(it.brand==='More'&&/^Mineral /.test(it.n))it.brand='Cool Cucumber'});
  out.sort((a,b)=>(steps.indexOf(a.step)+1||99)-(steps.indexOf(b.step)+1||99));
  return RG_CAT[kind]=out;
}
/* Her stars from the price list and RX cards (stored per size there): any size starred stars the product */
const rgFavs=()=>typeof rxFavs==='function'?rxFavs():[];
const rgStarred=(it,f)=>f.includes(it.n)||it.sizes.some(z=>f.includes(z));
function rgStarToggle(it){
  if(typeof rxFavToggle!=='function') return;
  const f=rgFavs();
  if(rgStarred(it,f)) [it.n,...it.sizes].filter(z=>rgFavs().includes(z)).forEach(z=>rxFavToggle(z));
  else rxFavToggle(it.sizes[0]||it.n);
}
let RG_VIEW=(()=>{try{return store.get('pp-rgview')||'brand'}catch(e){return 'brand'}})();

function regimenView(){
  const kind=rgKind(), R=rgLoad(), whens=RG_WHEN[kind];
  const me=(S.mine&&(S.mine.name||(S.mine.staff&&S.mine.staff.name)))||'';
  /* each word capitalized, "or" lowercase (Alexandra, Oct 15 2026); saved values keep their spelling */
  const rgTitle=o=>String(o).replace(/(^|[\s(\-\/])([a-z])/g,(m,p,c)=>p+c.toUpperCase()).replace(/ Or /g,' or ');
  const chips=(opts,isOn,onTap)=>h('div',{class:'seg'},opts.map(o=>h('button',{type:'button','aria-pressed':String(!!isOn(o)),onclick:()=>{onTap(o);rgSave();render()}},rgTitle(o))));
  const picked=n=>R.picks.find(p=>p.n===n);

  const head=h('div',{},h('span',{class:'lbl'},kind==='skin'?'Spa':'Salon'),h('h1',{style:'font-size:28px'},'At Home Regimen'),
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
  const cat=rgCatalog(kind), favs=rgFavs(), hasStar=typeof rxFavToggle==='function';
  const shown=cat.filter(it=>!q||it.n.toLowerCase().includes(q)||it.brand.toLowerCase().includes(q));
  const row=it=>{
    const p=picked(it.n);
    const pick=h('button',{type:'button',class:'rgp','aria-pressed':String(!!p),style:'flex:1',onclick:()=>{
      if(p) R.picks=R.picks.filter(x=>x!==p); else R.picks.push({n:it.n,how:it.how,when:it.w0&&whens.includes(it.w0)?it.w0:whens[0],step:it.step});
      rgSave(); render();}},h('span',{class:'rgbox','aria-hidden':'true'}),h('span',{},it.n.replace(/^Biologique Recherche /,'')));
    if(!hasStar) return pick;
    const on=rgStarred(it,favs);
    return h('div',{style:'display:flex;align-items:center;gap:2px'},
      h('button',{type:'button',class:'rxstar','aria-pressed':String(on),'aria-label':(on?'Unstar ':'Star ')+it.n,onclick:()=>{rgStarToggle(it);render()}},on?'★':'☆'),pick);
  };
  const box=(title,items,key,open)=>{
    const count=items.filter(it=>picked(it.n)).length;
    const d=h('details',{class:'invg'},h('summary',{onclick:()=>{RG_OPEN=d.open?(RG_OPEN===key?null:RG_OPEN):key}},h('h2',{},title),h('span',{class:'soft invc'},count?count+' picked':items.length+''),h('span',{class:'tplus','aria-hidden':'true'},'+')),
      h('div',{class:'sec2'},items.map(row)));
    if(open||(q&&items.length<=40)||RG_OPEN===key) d.open=true;
    return d;
  };
  const mine=shown.filter(it=>rgStarred(it,favs)), rest=shown.filter(it=>!rgStarred(it,favs));
  const bucket=f=>{const g=new Map();rest.forEach(it=>{const k=f(it);g.has(k)||g.set(k,[]);g.get(k).push(it)});return [...g]};
  const lists=RG_VIEW==='brand'
    ?bucket(it=>it.brand).sort((a,b)=>kind==='skin'?((RG_SKIN_BRANDS.indexOf(a[0])+1||99)-(RG_SKIN_BRANDS.indexOf(b[0])+1||99)):RX_BRANDS_ORDER(a[0])-RX_BRANDS_ORDER(b[0]))
    :bucket(it=>it.step);
  const groups=[mine.length?box('★ Your stars',mine,'star',true):null,...lists.map(([t,L])=>box(t,L,RG_VIEW+':'+t,false))];
  const viewSeg=h('div',{class:'seg'},[['brand','By brand'],['step','By step']].map(([k,l])=>h('button',{type:'button','aria-pressed':String(RG_VIEW===k),
    onclick:()=>{RG_VIEW=k;RG_OPEN=null;try{store.set('pp-rgview',k)}catch(e){}render()}},l)));
  const products=h('section',{class:'card2'},h('span',{class:'lbl'},'2 · Products'),
    h('label',{class:'fld'},sIn),viewSeg,
    !mine.length&&!q&&hasStar?h('small',{class:'soft'},'Tap ☆ next to the products you recommend most. They stay at the top here and on your price list.'):null,
    ...groups,
    q&&!groups.some(Boolean)?h('p',{class:'soft'},'Nothing matches “'+RG_Q+'”. Add it under your own notes below.'):null);

  /* 3 · how & when, one card per pick, in the order of the routine */
  const order=cat.map(it=>it.n);
  R.picks.sort((a,b)=>order.indexOf(a.n)-order.indexOf(b.n));
  const plan=h('section',{class:'card2'},h('span',{class:'lbl'},'3 · How & when'),
    R.picks.length?R.picks.map(p=>{
      const ta=h('textarea',{class:'rgta',rows:'3'}); ta.value=p.how;
      ta.addEventListener('input',()=>{p.how=ta.value;rgSave()});
      return h('div',{class:'rgitem'},
        h('div',{class:'rgitem-h'},h('b',{},p.n),h('button',{type:'button',class:'rgx','aria-label':'Remove '+p.n,onclick:()=>{R.picks=R.picks.filter(x=>x!==p);rgSave();render()}},'×')),
        chips(whens,o=>p.when===o,o=>{p.when=o}),
        h('label',{class:'fld'},h('small',{class:'soft'},p.how?'How to use (edit for her if you like)':'How to use (type it for her)'),ta));
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
  const S=RG_GROUPS[kind].map(([title,ws])=>[title,R.picks.filter(p=>ws.includes(p.when))]).filter(([,a])=>a.length);
  /* skin: when morning and evening are the same products, one "Morning & Night" section instead of "Same as above" (Oct 20 2026) */
  if(kind==='skin'&&S.length>1&&S[0][0]==='Every morning'&&S[1][0]==='Every evening'&&S[0][1].length===S[1][1].length&&S[0][1].every((p,i)=>p===S[1][1][i])) return [['Morning & Night',S[0][1]],...S.slice(2)];
  return S;
}
const rgDate=()=>new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

let RG_LIB=null, RG_LOGO=null;
function rgLib(){
  if(window.jspdf) return Promise.resolve(window.jspdf);
  return RG_LIB||(RG_LIB=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=()=>ok(window.jspdf);s.onerror=()=>{RG_LIB=null;no(new Error('lib'))};document.head.appendChild(s)}));
}
/* daintier script for the PDF headings and sign-off: Cormorant Garamond Light Italic (falls back to Times italic if it can't load) */
let RG_SCRIPT=null;
function rgScriptFont(){
  if(RG_SCRIPT!==null) return Promise.resolve(RG_SCRIPT);
  return fetch((window.RG_BASE||'')+'g/cormorant-garamond-300-italic.ttf').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(b=>{const u=new Uint8Array(b);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return RG_SCRIPT=btoa(s)})
    .catch(()=>RG_SCRIPT='');
}
function rgLogo(){
  if(RG_LOGO) return Promise.resolve(RG_LOGO);
  return fetch((window.RG_BASE||'')+'g/logo.png').then(r=>r.blob()).then(b=>new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(RG_LOGO=f.result);f.readAsDataURL(b)})).catch(()=>null);
}

const rgNamePic=n=>{const k=String(n||'').toLowerCase();if(!k)return Promise.resolve(null);
  return fetch((window.RG_BASE||'')+'g/names/'+k+'.png').then(r=>r.ok?r.blob():null).then(b=>b?new Promise(ok=>{const f=new FileReader();f.onload=()=>{const im=new Image();im.onload=()=>{/* solid black ink, so the name prints as dark as the text */try{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const D=x.getImageData(0,0,c.width,c.height),a=D.data;for(let i=0;i<a.length;i+=4){a[i]=a[i+1]=a[i+2]=18;a[i+3]=Math.min(255,a[i+3]*2)}x.putImageData(D,0,0);ok({d:c.toDataURL('image/png'),w:im.width,h:im.height})}catch(e){ok({d:f.result,w:im.width,h:im.height})}};im.onerror=()=>ok(null);im.src=f.result};f.readAsDataURL(b)}):null).catch(()=>null)};
/* Half-letter page (5.5 × 8.5 in), easy to read on a phone. Cream page, Taffeta wreath, serif headings. */
async function rgPdf(me,R,kind){
  R=R||RG; kind=kind||rgKind();
  const [lib,logo,script]=await Promise.all([rgLib(),rgLogo(),rgScriptFont()]);
  /* laid out twice: once to measure, then for real with the spare room shared evenly between the sections, so a
     short sheet fills the page instead of bunching at the top (Alexandra, Oct 20 2026) */
  const mk=()=>{const d=new lib.jsPDF({unit:'pt',format:[396,612]});
    if(script){try{d.addFileToVFS('CormorantLightItalic.ttf',script);d.addFont('CormorantLightItalic.ttf','CormorantLI','italic');SF='CormorantLI'}catch(e){SF='times'}}return d};
  let SF='times', doc=mk(), pad=0, gaps=0;
  const np=me?await rgNamePic(rgFirst(me)):null;
  const big=SF==='times'?1:1.12;
  const W=396, H=612, M=34, CW=W-M*2, ink=[18,18,18], soft=[95,91,85], choc=[18,18,18], line=[226,222,213];
  let y=0;
  const bg=()=>{doc.setFillColor(248,246,240);doc.rect(0,0,W,H,'F');doc.setFillColor(255,255,255);doc.rect(12,12,W-24,H-24,'F');
    /* the app's double frame: a thin black line and a finer charcoal line just inside (Alexandra, Oct 15 2026) */
    doc.setDrawColor(18,18,18);doc.setLineWidth(.7);doc.rect(12,12,W-24,H-24,'S');doc.setDrawColor(43,42,40);doc.setLineWidth(.3);doc.rect(17,17,W-34,H-34,'S');doc.setLineWidth(.2)};
  const foot=()=>{doc.setDrawColor(...line);doc.line(M,H-40,W-M,H-40);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...soft);
    /* the logo already says Taffeta Salon & Spa (Alexandra, Oct 20 2026) */
    doc.setFontSize(7);doc.text(['219 Bellevue Ave, Hammonton NJ 08037',RG_PHONE,RG_SITE,'@'+(RG_IG[kind]||RG_IG.hair)].join('  ·  '),W/2,H-26,{align:'center'})};
  const page=()=>{foot();doc.addPage([396,612]);bg();y=M+6};
  const need=n=>{if(y+n>H-52)page()};
  const para=(t,size,font,style,color,gap,indent)=>{doc.setFont(font,style);doc.setFontSize(size);doc.setTextColor(...color);
    const lines=doc.splitTextToSize(t,CW-(indent||0)), lh=size*1.32;
    lines.forEach(l=>{need(lh);doc.text(l,M+(indent||0),y+size);y+=lh});y+=gap||0};
  const label=t=>{gaps++;y+=pad;need(64);y+=4;doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...ink);doc.setCharSpace(1.6);
    const T=t.toUpperCase(), tw=doc.getTextWidth(T)+1.6*T.length; doc.text(T,W/2-tw/2,y+8);doc.setCharSpace(0);
    /* centered label between two short dashes, like MENU in the app */
    doc.setDrawColor(18,18,18);doc.setLineWidth(.4);doc.line(W/2-tw/2-30,y+5.5,W/2-tw/2-10,y+5.5);doc.line(W/2+tw/2+10,y+5.5,W/2+tw/2+30,y+5.5);doc.setLineWidth(.2);y+=20};

  const draw=()=>{
  bg();
  if(logo) doc.addImage(logo,'PNG',W/2-34,24,68,68);
  y=104;
  doc.setFont(SF,'italic');doc.setFontSize(22*big);doc.setTextColor(...ink);
  doc.text('Home Maintenance',W/2,y+18,{align:'center'});y+=30;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...soft);
  /* just what she had (her name, the artist and the date are at the bottom) */
  const meta=[R.services.length?R.services.join(', '):'',kind==='skin'&&R.type?'Skin type: '+R.type:''].filter(Boolean).join('  ·  ');
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
      else if(p.how.trim()){
        /* step by step bullets instead of a paragraph (Alexandra, Oct 20 2026): one line per step, or per sentence */
        const t=p.how.trim(), steps=t.split(/\n+/).flatMap(x=>/^[A-Z][\w ]{1,18}:\s/.test(x)||/:$/.test(x.trim())?[x]:x.split(/(?<=[.!])\s+(?=[A-Z0-9“"])/).reduce((o,y)=>{if(o.length&&y.length<30&&!/:\s/.test(o[o.length-1].slice(0,20)))o[o.length-1]+=' '+y;else o.push(y);return o},[]));   /* short sentences join the step before */
        steps.map(x=>x.trim()).filter(Boolean).forEach((x,k,a)=>{const lead=k===0&&a.length>1&&/:$/.test(x);
          if(lead){para(x,9.5,'helvetica','italic',soft,2,16);return}
          need(14);doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...soft);doc.text('•',M+18,y+9.5);
          const m=x.match(/^([A-Z][\w ]{1,18}):\s+(.*)$/);
          if(m){doc.setFont('helvetica','bold');doc.setFontSize(9.5);const lw=doc.getTextWidth(m[1]+':')+doc.getTextWidth('  ');doc.setTextColor(...ink);doc.text(m[1]+':',M+28,y+9.5);
            const L=doc.splitTextToSize(m[2],CW-28);doc.setFont('helvetica','normal');doc.setTextColor(...soft);
            /* fill the first line word by word, so no letters get lost at the wrap (Oct 20 2026) */
            const ws=m[2].split(/\s+/);let first='';while(ws.length&&doc.getTextWidth((first?first+' ':'')+ws[0])<=CW-28-lw)first+=(first?' ':'')+ws.shift();
            doc.text(first,M+28+lw,y+9.5);y+=9.5*1.32;
            const rest=ws.join(' '); if(rest) para(rest,9.5,'helvetica','normal',soft,0,28); y+=2}
          else para(x,9.5,'helvetica','normal',soft,2,28)});
        y+=6}
      else y+=6;
      seen.add(p);
    });
  });

  const notes=R.notes.concat(R.own.trim()?R.own.trim().split(/\n+/):[]);
  if(notes.length){label('Aftercare');notes.forEach(n=>{need(16);doc.setTextColor(...choc);doc.setFontSize(9.5);doc.text('•',M+2,y+9.5);para(n,9.5,'helvetica','normal',ink,3,14)})}

  gaps++; y+=pad;
  if(rgBack(R)||R.msg.trim()){
    y+=10; need(70);
    const top=y; y+=12;
    if(R.msg.trim()) para('“'+R.msg.trim()+'”',11*big,SF,'italic',ink,6,12);
    /* centered in the box, with the phone number kept on one line (Alexandra, Oct 20 2026) */
    if(rgBack(R)){doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(...choc);
      ['We look forward to seeing you '+rgBack(R)+'.','Call or text '+RG_PHONE+' to reserve.'].forEach(t=>doc.splitTextToSize(t,CW-12).forEach(l=>{need(13);doc.text(l,W/2,y+9.5,{align:'center'});y+=9.5*1.32}));y+=2}
    y+=8; doc.setDrawColor(43,42,40); doc.setLineWidth(.4); doc.rect(M-8,top,CW+16,y-top,'S'); doc.setLineWidth(.2);
  }
  if(kind==='skin'&&R.picks.some(p=>/^Biologique Recherche/.test(p.n))){y+=10;para('Remember, Biologique Recherche is very concentrated, so only a small amount is needed. If you have questions, reach out any time!',9.5,'helvetica','italic',soft,2)}
  y+=12; need(20);
  /* sign-off with the artist's first name in Antoinetta (a picture, as the font license allows) */
  doc.setFont(SF,'italic');doc.setFontSize(13*big);doc.setTextColor(...choc);
  if(np){need(38);const nh=30, nw=nh*np.w/np.h;doc.setFont(SF,'italic');doc.setFontSize(13*big);doc.setTextColor(...choc);
    /* "Pretty Hair by [name] xo" */
    const pre=rgPretty(kind,R.services), post=' xo';
    const pw=doc.getTextWidth(pre), qw=doc.getTextWidth(post), x0=W/2-(pw+nw+qw)/2;
    doc.text(pre,x0,y+21);doc.addImage(np.d,'PNG',x0+pw,y+2,nw,nh);doc.text(post,x0+pw+nw,y+21);y+=34}
  else{doc.text(rgPretty(kind,R.services)+(me?rgFirst(me):'Taffeta')+' xo',W/2,y+12,{align:'center'});y+=20}
  need(14);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...soft);doc.text(rgDate(),W/2,y+8,{align:'center'});
  foot()};
  draw();
  /* the extra room goes before each section and the sign-off; if that tips it onto a second page, ease off until it fits */
  if(doc.getNumberOfPages()===1&&gaps){const room=Math.min(70,Math.max(0,(H-60-y)/gaps));
    for(const f of [1,.75,.5,0]){pad=room*f;doc=mk();gaps=0;draw();if(doc.getNumberOfPages()===1)break}}
  return doc.output('blob');
}
const rgFile=(R,kind)=>'Taffeta '+(kind==='skin'?'Skincare':'Hair Care')+' Regimen'+(R.guest.trim()?' - '+rgFirst(R.guest):'')+'.pdf';
/* Share sheet (used by the front desk to text it to the guest) */
async function rgShare(me,R,kind,toast){
  toast.textContent='Making her PDF…';
  try{
    const blob=await rgPdf(me,R,kind), file=new File([blob],rgFile(R,kind),{type:'application/pdf'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      const first=String(R.guest||'').trim().split(/\s+/)[0];
      try{await navigator.share({files:[file],title:'Your Taffeta at-home regimen',text:'Hi'+(first?' '+first:'')+'! Here’s your Taffeta at-home routine from today: your products and how to use them.'});toast.textContent='Sent? Tap Mark sent.'}
      catch(e){toast.textContent=e&&e.name==='AbortError'?'':'Couldn’t open the share sheet. Try Preview.'}
    } else {const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=rgFile(R,kind);document.body.appendChild(a);a.click();a.remove();toast.textContent='Saved the PDF. Attach it to your text.'}
  }catch(e){toast.textContent='Couldn’t make the PDF. Check the Wi-Fi and try again.'}
}
async function rgPreview(me,toast,R,kind){
  toast.textContent='Making the preview…';
  /* opens on top of the app with a Back button, so she never gets stuck on the PDF (Alexandra, Oct 16 2026) */
  try{const blob=await rgPdf(me,R,kind); toast.textContent=''; window.pdfOverlay(blob,rgFile(R,kind))}
  catch(e){toast.textContent='Couldn’t make the PDF. Check your signal and try again.'}
}
/* Artist taps Save PDF: the regimen goes to the Home care list in the front desk app, and her screen clears for the next guest */
/* On once the live Apps Script has the Home care handler: its staff reply carries regimen:true. The old script answers ok
   to any post, so saving before then would clear the artist's screen without anything reaching the desk. */
/* on the salon iPad there's no HUB, but her PIN sign-in (tk) can save to the desk (Alexandra, Oct 20 2026) */
const rgDeskOn=()=>(typeof HUB!=='undefined'&&!!(HUB.data&&HUB.data.regimen))||!!(S.mine&&S.mine.staff&&S.mine.staff.tk&&window.TAFFETA_ENDPOINT);
async function rgSave2(me,toast,btn){
  if(!rgDeskOn()){toast.textContent='The front desk list isn’t switched on yet. Your regimen stays saved on this screen, so tap again once it is.';return}
  const st=(S.mine&&S.mine.staff)||{}, kind=rgKind();
  if(!RG.guest.trim()){toast.textContent='Add her name first so the desk knows who it’s for.';return}
  btn.disabled=true; toast.textContent='Saving…';
  try{
    const r=await fetch(window.TAFFETA_ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({type:'regimen',slug:st.slug,t:st.t,tk:st.tk,artist:me,guest:RG.guest.trim(),kind,data:RG})});
    const j=await r.json();
    if(!j.ok) throw new Error(j.error||'no');
    const who=rgFirst(RG.guest);
    RG=rgBlank(); RG_Q=''; RG_OPEN=null; rgSave();
    RG_TOAST='Saved. '+who+'’s PDF is on the front desk list to text her.'; render(); window.scrollTo(0,0);
  }catch(e){btn.disabled=false; toast.textContent='That didn’t save. Check your signal and try again.'}
}
