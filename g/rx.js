/* RX consultation cards (Alexandra, Oct 2026). The artist enters the guest's budget, what she's hoping for, her
   routine and what her hair, scalp or skin is going through right now. The card suggests two options for today
   (Option 1 inside the budget, Option 2 the full look), home maintenance in both totals, and a lighter
   maintenance visit. The artist keeps or edits everything, saves, and the guest scans a QR on screen.
   Nothing about the guest leaves this device except inside the QR link, and the link's part after # never
   reaches a server. Uses the host page's h(), store and render(); S.mine.staff is the artist. */

/* Masque add-on, $50: the esthetician picks which one (Alexandra, Oct 24 2026) */
const RX_MQ='Masque: ', RX_MASQUES=['Cold Seaweed','LED Light Mask','Cryo Stick Therapy','Microdermabrasion','PIGM 400 Mask','MC 110 Booster','VIP O2 Booster','BR Booster'];
/* Service prices: the median price for each service in the salon's own bookings, Oct 2026. */
const RX_SVC={
  hair:[['Female Haircut',75],['Male Haircut',45],['Haircut Leaving Wet',50],['Leave Wet (no haircut)',0],['Blow Dry',50],['Blowdry Plus',65],
    ['Single Process',65],['Shadow Root',60],['Glaze',45],['Additional Mix',25],['Face Frame/Spot Highlight',100],['Minimum Foil',85],
    ['Half Foil',150],['Full Foil',175],['Minimum Balayage',125],['Half Head Balayage',185],['Full Head Balayage',325],
    ['Base Lightener',55],['K18 Bond Protection',25],['Goldwell Leave-In Treatment',20],['Permanent Wave',100],['Formal Style',105]],
  skin:[['Taffeta Facial',130],['Express Acne Treatment',99],['Hydration Boost',99],['Brightening Mini Facial',99],
    ['Mini Redness Reversal',99],['Anti-Aging Express',99],['Dermaplaning',60],['Dermaplaning Add-On',40],
    ...RX_MASQUES.map(m=>[RX_MQ+m,50]),
    ['Nano Needling Facial',199],['Biologique Recherche Lift & Remodel',200],['Biologique Recherche Cure All',200],['Taffeta Facial with MC 110',130],['Microdermabrasion',150],['Brow Sculpt Maintenance',25],['Brow Tint',25],['Brow Lamination',85],['Lip Wax',15]]
};
/* Female haircut follows the artist's level (Alexandra, Oct 15 2026): newer artists $65, Alexandra $100, everyone else $75 */
const RX_CUT={Adriana:65,Ashley:65,Amanda:65,Isabella:65,Alexandra:100};
function rxSetCut(me){const f=String(me||'').trim().split(/\s+/)[0]||'', r=RX_SVC.hair.find(x=>x[0]==='Female Haircut'); if(r) r[1]=RX_CUT[f]||75}
/* Single process: each artist picks her own price, $65, $70, $80 or $100, and the card remembers it on her device (Alexandra, Oct 20 2026) */
const RX_SP=[65,70,80,100], rxSpKey=()=>'pp-rxsp:'+rxSlug();
function rxSetSP(){const v=Number(store.get(rxSpKey())), p=RX_SP.includes(v)?v:65, r=RX_SVC.hair.find(x=>x[0]==='Single Process'); if(r) r[1]=p; return p}
const rxRegPrice=(k,n)=>{const r=RX_SVC[k].find(x=>x[0]===n);return r?r[1]:0};
/* VIP family pricing (Alexandra, Oct 16 2026): a VIP service covers the artist's commission and the cost of the
   service, plus 10% for the house. VIP = (full price x her commission rate + $25 per color bowl) x 1.10, never more
   than the full price. Each artist's rate comes from her own sealed app data; 45% when it isn't there (salon iPad).
   Product charges (K18, Goldwell leave-in, Additional Mix) stay at their regular price. Home care is always regular price. */
const RX_BOWL=25;
const RX_BOWLS={'Single Process':1,'Shadow Root':1,'Glaze':1,'Face Frame/Spot Highlight':1,'Minimum Foil':1,'Half Foil':2,'Full Foil':2,
  'Minimum Balayage':1,'Half Head Balayage':2,'Full Head Balayage':2,'Base Lightener':1};
const RX_VIP_REG=['K18 Bond Protection','Goldwell Leave-In Treatment','Additional Mix','Leave Wet (no haircut)'];
let RX_VIPON=false, RX_RATE=45;
const rxVipPrice=(k,n)=>{const reg=rxRegPrice(k,n); if(!reg||RX_VIP_REG.includes(n)) return reg;
  const v=Math.round(((reg*RX_RATE/100)+(RX_BOWLS[n]||0)*RX_BOWL)*1.10*100)/100; return Math.min(reg,v)};
const rxPrice=(k,n)=>RX_VIPON?rxVipPrice(k,n):rxRegPrice(k,n);

/* Home care: one product per need, from the Taffeta product guide (brand list prices, Oct 2026; ring up from the POS). */
const RX_PROD={
  colorSafe:['Oribe Shampoo for Beautiful Color',49,'Keeps color from fading wash after wash'],
  glazeKeep:['Oribe Shampoo for Beautiful Color',49,'Helps your glaze stay glossy longer'],
  /* Alexandra's favorites (Oct 15 2026): Rossano Ferretti UV protect oil, wet or dry: tames flyaways, UV and heat protection */
  uv:['Rossano Ferretti Brillante Protect & Shine Oil',65,'UV and heat protection that tames flyaways, on wet or dry hair, so your tone doesn’t fade'],
  heat:['Rossano Ferretti Brillante Protect & Shine Oil',65,'Heat and UV protection that tames flyaways, on wet or dry hair, before you blow-dry or use hot tools'],
  brassy:['K18 Triple Bright Purple Shampoo',40,'Keeps blonde bright and stops brassiness coming through'],
  /* Alexandra (Oct 15 2026): every big blonding service (half or full balayage, half or full foils) goes home with the
     small K18 leave-in; AirWash for anyone who washes a couple of times a week and refreshes with a dryer and brush, and fine hair */
  /* clean, vegan guests get Rossano Ferretti, fruity-smelling shampoos and conditioners (Alexandra, Oct 15 2026) */
  colorSafeRF:['Rossano Ferretti Splendido Colour Protect Shampoo',56,'Clean, vegan color care with a fresh, fruity scent'],
  glazeKeepRF:['Rossano Ferretti Splendido Colour Protect Shampoo',56,'Clean, vegan and keeps your glaze glossy longer, with a fruity scent'],
  dryRF:['Rossano Ferretti Dolce Repair Nourish Shampoo',46,'Clean, vegan deep moisture with a fruity scent'],
  flatWashRF:['Rossano Ferretti Grandioso Extra Volume Shampoo',46,'Clean, vegan volume for fine or flat hair, with a fruity scent'],
  brassyRF:['Rossano Ferretti Splendido Purple Shampoo',49,'Clean, vegan purple shampoo that keeps blonde bright'],
  k18Home:['K18 Leave-In Molecular Repair Mask, 0.5 oz',29,'Keeps repairing your hair at home after a big blonding service'],
  airWash:['K18 AirWash Dry Shampoo, 4 oz',48,'Freshens your hair between washes with your blow dryer and brush; great for fine hair'],
  movement:['Oribe Après Beach Wave & Shine Spray',46,'Soft, touchable movement and shine at home'],
  movementAir:['Oribe Matte Waves Texture Lotion',44,'Effortless movement and soft waves as it air dries'],
  /* air drying, waves and blow-dry prep (Alexandra, Oct 15 2026) */
  airDry:['Oribe Hair Alchemy Heatless Styling Balm',48,'Smooth, polished air-dried hair with no heat'],
  airCurl:['IGK Rich Kid Wave Enhancing Air Dry Cream',25,'Brings out natural waves and perms as they air dry'],
  flyaway:['IGK Frizz & Flyaway Taming Wand',30,'Smooths flyaways and keeps sleek or slicked-back looks in place'],
  sleekStick:['Aluram Smoothing Balm Stick',19,'A wax stick for sleek looks and flyaways, easy to keep in your bag'],
  prep:['IGK Good Behavior 4-in-1 Prep Spray',34,'Preps hair before you blow-dry so it styles faster and smoother'],
  frizz:['Brazilian Blowout Daily Smoothing Serum',36,'That just-smoothed feeling wash to wash, with frizz control for medium to thick hair'],
  dry:['Davines NOUNOU Shampoo',30,'Deep moisture for dry hair'],
  breakage:['K18 Leave-In Molecular Repair Mask, 0.5 oz',29,'Repairs breakage from the inside'],
  /* fine or flat hair, or wants volume (Alexandra, Oct 15 2026): a volume shampoo (Oribe Magnificent Volume or Signature)
     plus Volume Boosting Mousse or Maximista */
  flat:['Davines Volume Boosting Mousse',35,'Lift and body that lasts, great for fine hair'],
  flatSpray:['Oribe Maximista Thickening Spray',42,'Builds volume and thickness in fine hair'],
  flatWash:['Oribe Shampoo for Magnificent Volume',49,'Volume from the first wash for fine or flat hair'],
  oily:['Oribe Gold Lust Dry Shampoo',52,'Soaks up oil so you can stretch between washes'],
  scalp:['Oribe Serene Scalp Soothing Leave-On',48,'Calms an itchy or flaky scalp'],
  grays:['Oribe Root Touch Up Spray',36,'Covers grays between color visits'],
  blowLast:['Oribe Dry Texturizing Spray',52,'Makes your blowout last longer'],
  skBreak:['Biologique Recherche Lotion P50 (1.7 oz)',45,'Clears congestion and helps prevent breakouts',['Biologique Recherche Lotion P50 (5.1 oz)',100]],
  skSens:['Biologique Recherche Lotion P50W (5 oz)',100,'Gentle exfoliation for dry or sensitive skin'],
  skBright:['Biologique Recherche Lotion P50 PIGM 400 (1.7 oz)',45,'Evens tone and brightens dullness',['Biologique Recherche Lotion P50 PIGM 400 (5 oz)',100]],
  skAge:['Biologique Recherche Sérum Grand Millésime (0.3 oz)',115,'Firms and softens fine lines'],
  /* when nothing in her answers calls for a specific product, the card still budgets for home care (Alexandra, Oct 16 2026) */
  basicWash:['Taffeta Refill Shampoo & Conditioner, new bottles',81,'Our salon shampoo and conditioner in full-size Taffeta bottles, so salon hair lasts at home'],
  basicWashRF:['Rossano Ferretti Vivace Everyday Hair & Body Shampoo',36,'Clean, vegan everyday shampoo with a fresh, fruity scent'],
  skP50V:['Biologique Recherche Lotion P50V (5 oz)',100,'Exfoliates gently while it hydrates, for dry or dull skin'],
  skSpectral:['Biologique Recherche Spectral Sérum Authentique (0.3 oz)',85,'Brightens dullness and softens fine lines fast'],
  skSerPigm:['Biologique Recherche Sérum PIGM 400 (0.3 oz)',115,'Fades dark spots and evens tone'],
  skSerSens:['Biologique Recherche Sérum Erythros',140,'Calms redness and comforts sensitive skin'],
  skSerPore:['Biologique Recherche Dermopore (0.3 oz)',60,'Tightens pores and keeps breakouts in check'],
  skLaitO2:['Biologique Recherche Lait VIP O2 (5.1 oz)',60,'The cleansing milk that goes with your P50'],
  skCreamGM:['Biologique Recherche Crème Grand Millésime',225,'Rich, firming cream for dry skin and fine lines'],
  /* anti-aging, the way Carolyn would recommend it (Oct 22 2026) */
  skCollagen:['Biologique Recherche Collagène Originel (0.3 oz)',85,'Firms and plumps. Sérum Grand Millésime works well too'],
  skSplendide:['Biologique Recherche Crème Splendide',195,'Firming cream for fine lines. Crème Grand Millésime works well too'],
  skClean:['Biologique Recherche Lait VIP O2 (1.7 oz)',35,'A gentle cleansing milk to start a real routine'],
  skMask:['Biologique Recherche Masque VIVANT',95,'Weekly mask for oily, blemish-prone skin']
};
const RX_TRY=6; /* Try Me bottle: 1 oz of any backbar product */
/* Taffeta BR Bottle: the skin version of a Try Me. A sample bottle of a BR backbar product (e.g. Collagène Originel) with enough for about 2 weeks at 1–2 drops, $25 (Alexandra, Oct 20 2026) */
const RX_BRB=25, RX_BRB_N='Taffeta BR Bottle';
const rxBrbAsk=()=>{const w=prompt('Which BR product goes in the Taffeta BR Bottle?','Collagène Originel');return w&&w.trim()?RX_BRB_N+': '+w.trim():null};
const RX_ALLIN_SKIN=400; /* skin: nothing suggested past a $400 ticket (Alexandra, Oct 16 2026) */
const RX_ALLIN_HAIR=450; /* hair All In never adds extras past a $450 ticket; was $400, but a full balayage with a cut is $425 to $450 (Alexandra, Oct 16 2026) */
const RX_CAP=400; /* Option 2 tops out here when no budget is given (Alexandra, Oct 16 2026) */
/* Home care price list artists learn and star their go-tos from: every hair and skin retail product we carry, at the
   retail price in Paired Plus (Retail Price List report, Oct 15 2026). Oribe Bright Blonde is discontinued and gone.
   Taffeta Refillable is our backbar shampoo + conditioner in Taffeta bottles: new bottle or a refill into her own bottle (Paired Plus, Oct 15 2026). */
const RX_PRICES={
  hair:[["Taffeta Refill Shampoo & Conditioner, new bottles",81],["Taffeta Refill Shampoo & Conditioner, refill her bottles",71],["Taffeta Refillable Shampoo, new bottle",39],["Taffeta Refillable Shampoo, refill",34],["Taffeta Refillable Conditioner, new bottle",42],["Taffeta Refillable Conditioner, refill",37],["Taffeta Satin Pillowcase",12],["Taffeta Style Shine Brush, pink",35],["Oribe Shampoo for Beautiful Color",49],["Oribe Conditioner for Beautiful Color",52],["Oribe Gold Lust Repair & Restore Shampoo",53],["Oribe Gold Lust Repair & Restore Conditioner",56],["Oribe Gold Lust Liter Conditioner (33.8 oz)",164],["Oribe Gold Lust Masque",69],["Oribe Gold Lust Nourishing Oil",59],["Oribe Gold Lust Nourishing Oil, 1.7 oz",42],["Oribe Gold Lust Restorative Night Crème",72],["Oribe Gold Lust Dry Heat Protection Spray",46],["Oribe Gold Lust Dry Shampoo",52],["Oribe Shampoo for Magnificent Volume",49],["Oribe Conditioner for Magnificent Volume",52],["Oribe Supershine Hydrating Shampoo",49],["Oribe Supershine Hydrating Conditioner",52],["Oribe Signature Shampoo",49],["Oribe Signature Conditioner",52],["Oribe Hair Alchemy Resilience Shampoo",56],["Oribe Hair Alchemy Resilience Conditioner",52],["Oribe Hair Alchemy Fortifying Treatment Serum",66],["Oribe Hair Alchemy Heatless Styling Balm",48],["Oribe Hair Alchemy Liter Shampoo (33.8 oz)",166],["Oribe Serene Scalp Balancing Shampoo",52],["Oribe Serene Scalp Balancing Conditioner",55],["Oribe Serene Scalp Densifying Shampoo",52],["Oribe Serene Scalp Densifying Conditioner",55],["Oribe Serene Scalp Densifying Treatment Spray",76],["Oribe Serene Scalp Thickening Treatment Spray",76],["Oribe Serene Scalp Soothing Leave-On",48],["Oribe Serene Scalp Exfoliating Scrub",52],["Oribe Serene Scalp Mist",58],["Oribe Oil Control Shampoo",52],["Oribe Oil Control Treatment Mist",58],["Oribe Oil Control Dry Shampoo Powder",46],["Oribe Eternal Curl Moisturizing Shampoo",49],["Oribe Eternal Curl Intense Conditioner",52],["Oribe Eternal Curl Polish + Protect",56],["Oribe Styling Butter Curl Enhancing Crème",48],["Oribe Curl Control Silkening Crème",46],["Oribe Curl Gloss Hydration & Hold",46],["Oribe Run-Through Detangling Shampoo",49],["Oribe Run-Through Detangling Primer",39],["Oribe The Cleanse",49],["Oribe Mirror Rinse Glass Hair Treatment",64],["Oribe Power Drops Damage Boost",58],["Oribe Invisible Defense Universal Protection Spray",44],["Oribe Royal Blowout Heat Styling Spray",72],["Oribe Balm d’Or Heat Styling Shield",48],["Oribe Imperial Blowout",69],["Oribe Supershine Moisturizing Cream",54],["Oribe Light Supershine Moisturizing Cream",54],["Oribe Grandiose Hair Plumping Mousse",42],["Oribe Maximista Thickening Spray",42],["Oribe Swept Up Volume Powder Spray",44],["Oribe Featherless Balm",44],["Oribe Matte Waves Texture Lotion",44],["Oribe Après Beach Wave & Shine Spray",46],["Oribe Dry Texturizing Spray",52],["Oribe Mystify Restyling Spray",46],["Oribe Anti-Humidity Spray",42],["Oribe Free Styler Working Hairspray",46],["Oribe Superfine Hairspray",46],["Oribe Superfine Strong Hairspray",46],["Oribe Flash Form Finishing Spray Wax",42],["Oribe Rough Luxury Soft Molding Paste",39],["Oribe Fiber Groom Elastic Texture Paste",40],["Oribe Root Touch Up Spray",36],["Oribe Côte d’Azur Eau de Parfum",135],["Oribe Côte d’Azur Eau de Parfum, travel",36],["Oribe Travel Beautiful Color Shampoo",16],["Oribe Travel Beautiful Color Conditioner",17],["Oribe Travel Gold Lust Shampoo",17],["Oribe Travel Gold Lust Conditioner",26],["Oribe Travel Supershine Moisturizing Cream",24],["Oribe Travel Dry Texturizing Spray",26],["Oribe Travel Gold Lust Dry Shampoo",23],["Oribe Travel Impermeable Anti-Humidity Spray",24],["Oribe Travel Invisible Defense",22],["Oribe Travel Mystify Restyling Spray",23],["Oribe Travel Run-Through Detangling Primer",19],["Oribe Travel Superfine Hairspray",23],["Oribe Travel Après Beach Wave",24],["Oribe Beautiful Color Travel Set",35],["Oribe Holiday Signature Style Set",72],["Oribe Holiday Signature Travel Set",50],["Oribe Holiday Shine & Style Travel Set",35],["Oribe Holiday Hair Alchemy Set",105],["Oribe Holiday Hair Alchemy Travel Set",50],["Oribe Holiday Gold Lust Collection",115],["Oribe Holiday Gold Lust Liter Set",295],["Oribe Holiday Côte d’Azur Fragrance Collection",195],["Oribe Holiday Côte d’Azur Hand Wash & Crème Set",78],["K18 Leave-In Molecular Repair Mask, 0.5 oz",29],["K18 Future Society Leave-In Mask, 1.7 oz",75],["K18 Damage Shield Shampoo",39],["K18 Damage Shield Protect Conditioner",39],["K18 Triple Bright Purple Shampoo",40],["K18 Heatbounce Heat Protectant, 1.6 oz",24],["K18 Heatbounce Heat Protectant, 4 oz",48],["K18 Heatbounce Conditioning Heat Protectant, 8 oz",83],["K18 Astro Lift Reparative Spray",46],["K18 AirWash Dry Shampoo, 1.6 oz",24],["K18 AirWash Dry Shampoo, 4 oz",48],["Davines NOUNOU Shampoo",30],["Davines NOUNOU Conditioner",34],["Davines LOVE Smoothing Shampoo",25],["Davines Alchemic Conditioner",37],["Davines Volume Boosting Mousse",35],["Davines Texturizing Dust",29],["Davines Strong Hairspray",42],["Davines Invisible No Gas Spray",39],["Davines This Is A Dry Texturizer",41],["Davines Paste",34],["IGK Crybaby Smoothing & Finishing Serum",32],["IGK Good Behavior Spirulina Protein Smoothing Spray",38],["IGK Good Behavior Spirulina Protein Smoothing Balm",34],["IGK Good Behavior 4-in-1 Prep Spray",34],["IGK Antisocial Bond Building Dry Mask",36],["IGK Frizz & Flyaway Taming Wand",30],["IGK Beach Club Blowout Serum",29],["IGK Beach Club Style Memory Blowout Cream",29],["IGK Beach Club Touchable Texture Spray",36],["IGK Beach Club Touchable Texture Spray, travel",16],["IGK Beach Club High Shine Texture Foam",32],["IGK Big Time Volume & Thickening Mousse",34],["IGK Good Spin Curl Defining Gelée",29],["IGK Rich Kid Wave Enhancing Air Dry Cream",25],["IGK Expensive Hi-Shine Gloss Tint",32],["IGK Expensive Clear Gloss Top Coat",34],["IGK Disco Disco Clear Gloss Shine Spray",34],["IGK Texture Powder",25],["Brazilian Blowout Anti-Frizz Shampoo",39],["Brazilian Blowout Anti-Frizz Conditioner",39],["Brazilian Blowout Daily Smoothing Serum",36],["Brazilian Blowout Ionic Bonding Spray",30],["Rossano Ferretti Vivace Everyday Hair & Body Shampoo",36],["Rossano Ferretti Vivace Leave-In Conditioner",46],["Rossano Ferretti Dolce Repair Nourish Shampoo",46],["Rossano Ferretti Dolce Nourishing Mask",64],["Rossano Ferretti Grandioso Extra Volume Shampoo",46],["Rossano Ferretti Grandioso Volumising Conditioner",55],["Rossano Ferretti Splendido Colour Protect Shampoo",56],["Rossano Ferretti Splendido Purple Shampoo",49],["Rossano Ferretti Intenso Moisture & Smoothing Mask",64],["Rossano Ferretti Prodigio Hair Power Drops",55],["Rossano Ferretti Prodigio Regenerating Pre-Shampoo Mask",129],["Rossano Ferretti Brillante Protect & Shine Oil",65],["Rossano Ferretti Favoloso Heat Protector Spray",59],["Rossano Ferretti Favoloso Style Shine Pomade",49],["Rossano Ferretti Fantastico Kids Shampoo",34],["Rossano Ferretti Fantastico Kids Leave-In Conditioner",34],["Rossano Ferretti Gentile Hand & Nail Crème",22],["Aluram Daily Shampoo, 12 oz",20.99],["Aluram Daily Conditioner, 12 oz",20.99],["Aluram Moisture Shampoo, 12 oz",20.99],["Aluram Moisture Conditioner, 12 oz",20.99],["Aluram High Shine Blowout Spray",22],["Aluram High Shine, 2 oz",8.99],["Aluram High Hold Finishing Spray",21.99],["Aluram Smoothing Balm Stick",19],["Olaplex Purple Shampoo",35],["Kenra Shine Spray",21],["Kenra Dry Volume Burst",21],["Jolie Filtered Showerhead",165],["Jolie Showerhead Replacement Filter",36],["EHP Rush Brush",32],["EHP Premium Boar Bristle Brush",25],["EHP Hair Insurance Kit",70],["Ergo Ionic Ceramic Round Brush",49.95],["T3 SinglePass Smooth X 1\" Iron",249],["T3 SinglePass Smooth X",180],["T3 SinglePass Curl X 1.25\"",170],["T3 Curl ID",250],["T3 Cura Hair Dryer",245],["T3 Featherweight StyleMax Hair Dryer",250],["T3 AireIQ Hair Dryer",400]],
  skin:[["Taffeta BR Bottle",25],["Biologique Recherche Lait VIP O2 (1.7 oz)",35],["Biologique Recherche Lait VIP O2 (5.1 oz)",60],["Biologique Recherche Lait VIP O2 (8 oz)",90],["Biologique Recherche Lait U (5.1 oz)",42],["Biologique Recherche Lait U (8 oz)",54],["Biologique Recherche Lait E.V. (5.1 oz)",60],["Biologique Recherche Lait E.V. (8.4 oz)",90],["Biologique Recherche Lait Dermo-S (1.7 oz)",30],["Biologique Recherche Lait Dermo-S (5.1 oz)",55],["Biologique Recherche Lait Dermo-S (8.5 oz)",80],["Biologique Recherche Lait S.R. (1.7 oz)",30],["Biologique Recherche Lait S.R. (5.1 oz)",55],["Biologique Recherche Lait S.R. (8.5 oz)",80],["Biologique Recherche Solution Démaquillante",58],["Biologique Recherche Eau Micellaire Biosensible",60],["Biologique Recherche Lotion P50 (1.7 oz)",45],["Biologique Recherche Lotion P50 (5.1 oz)",100],["Biologique Recherche Lotion P50 (8 oz)",155],["Biologique Recherche Lotion P50 1970",88],["Biologique Recherche Lotion P50V (1.7 oz)",45],["Biologique Recherche Lotion P50 V 1970 (1.7 oz)",36],["Biologique Recherche Lotion P50V (5 oz)",100],["Biologique Recherche Lotion P50W (5 oz)",100],["Biologique Recherche Lotion P50T (1.7 oz)",45],["Biologique Recherche Lotion P50T (5.1 oz)",100],["Biologique Recherche Lotion P50 PIGM 400 (1.7 oz)",45],["Biologique Recherche Lotion P50 PIGM 400 (5 oz)",100],["Biologique Recherche Lotion P50 PIGM 400 (8.4 oz)",150],["Biologique Recherche Lotion MC 110 N1",150],["Biologique Recherche L'Eauxygénante",75],["Biologique Recherche Sérum Grand Millésime (0.3 oz)",115],["Biologique Recherche Sérum Grand Millésime (1 oz)",320],["Biologique Recherche Le Grand Sérum (0.3 oz)",250],["Biologique Recherche Le Grand Sérum (1 oz)",660],["Biologique Recherche Sérum Erythros",140],["Biologique Recherche Sérum Biosensible",210],["Biologique Recherche Sérum TEWL (0.3 oz)",85],["Biologique Recherche Sérum TEWL (1 oz)",210],["Biologique Recherche Sérum T.E.W.L.",78],["Biologique Recherche Sérum PIGM 400 (0.3 oz)",115],["Biologique Recherche Sérum PIGM 400 (1 oz)",300],["Biologique Recherche Sérum Yall-O2 (0.3 oz)",115],["Biologique Recherche Fluide VIP O2 (0.3 oz)",115],["Biologique Recherche Fluide VIP O2 (1 oz)",298],["Biologique Recherche Sérum A-Glyca (0.3 oz)",85],["Biologique Recherche Sérum A-Glyca (1 oz)",195],["Biologique Recherche Sérum 3R (0.3 oz)",92],["Biologique Recherche Sérum 3R (1 oz)",296],["Biologique Recherche Sérum Progeskin (0.3 oz)",85],["Biologique Recherche Sérum Progeskin (1 oz)",195],["Biologique Recherche Sérum Collagène Marin (0.3 oz)",45],["Biologique Recherche Sérum Collagène Marin (1 oz)",105],["Biologique Recherche Collagène Originel (0.3 oz)",85],["Biologique Recherche Collagène Originel (1 oz)",195],["Biologique Recherche Élastine Sérum (0.3 oz)",60],["Biologique Recherche Élastine Sérum (1 oz)",140],["Biologique Recherche Iso-Placenta Sérum (0.3 oz)",60],["Biologique Recherche Iso-Placenta Sérum (1 oz)",140],["Biologique Recherche VG Tensil (0.3 oz)",85],["Biologique Recherche VG Tensil (1 oz)",195],["Biologique Recherche Amniotique (0.3 oz)",85],["Biologique Recherche Amniotique (1 oz)",195],["Biologique Recherche Oligo-Protéines Marines (0.3 oz)",50],["Biologique Recherche Oligo-Protéines Marines (1 oz)",125],["Biologique Recherche Dermopore (0.3 oz)",60],["Biologique Recherche Dermopore (1 oz)",140],["Biologique Recherche Colostrum Sérum Authentique (0.3 oz)",85],["Biologique Recherche Spectral Sérum Authentique (0.3 oz)",85],["Biologique Recherche Silk Plus (0.3 oz)",85],["Biologique Recherche Complexe Iribiol (0.3 oz)",50],["Biologique Recherche Extraits Tissulaires (0.3 oz)",50],["Biologique Recherche Sérum Liposmose (0.3 oz)",50],["Biologique Recherche Sérum Matriciel Visage",300],["Biologique Recherche Crème Dermopurifiante",135],["Biologique Recherche Crème VIP O2",225],["Biologique Recherche Crème Verte Espoir A.R.",135],["Biologique Recherche Crème ISO-Placenta",100],["Biologique Recherche Crème PIGM 400",330],["Biologique Recherche Crème Grand Millésime",225],["Biologique Recherche Crème Splendide",195],["Biologique Recherche Crème ADN Élastine Marine Collagène",185],["Biologique Recherche Crème Élastine",100],["Biologique Recherche Crème Collagène",100],["Biologique Recherche Crème VG Derm",135],["Biologique Recherche Crème Hydravits",135],["Biologique Recherche Crème PTO Métamorphique",225],["Biologique Recherche Crème aux Acides de Fruits",135],["Biologique Recherche Crème Biofixine",330],["Biologique Recherche Crème MSR-H",330],["Biologique Recherche Crème M.E.C.",225],["Biologique Recherche La Grande Crème",750],["Biologique Recherche Émulsion Originelle Régénérante",195],["Biologique Recherche Émulsion Gel Biosensible",205],["Biologique Recherche Émulsion Gel Biosensible S.R.",225],["Biologique Recherche Crème Contour des Yeux VIP O2",130],["Biologique Recherche Crème Contour des Yeux Biofixine",160],["Biologique Recherche Crème Contour des Yeux Biosensible",130],["Biologique Recherche Patchs Défatigants",25],["Biologique Recherche Eye Care Concealer",85],["Biologique Recherche Masque VIVANT",95],["Biologique Recherche Masque VIP O2",195],["Biologique Recherche Biomagic Mask",195],["Biologique Recherche Masque Biosensible",230],["Biologique Recherche Masque PIGM 400",45],["Biologique Recherche Masque Visolastine",130],["Biologique Recherche Masque Biofixine",230],["Biologique Recherche Platymsa Masque",45],["Biologique Recherche Masque Caviar Vert",45],["Biologique Recherche Crème Masque VG Vernix",225],["Biologique Recherche Réparation U.V.",158],["Biologique Recherche Préparation U.V.",160],["Biologique Recherche Sérum Teinté Foundation",155],["Biologique Recherche Biokiss",75],["Biologique Recherche Liftkiss",25],["Biologique Recherche Youth Skin Box",50],["Biologique Recherche Standard Skin Box",50],["Biologique Recherche Blemish Skin Box",50],["Cool Cucumber Hydralixir (1.7 oz)",88],["Hydralixir (1.7 oz)",65],["Cool Cucumber Soothe Operator",36],["Oribe Côte d’Azur Nourishing Hand Crème",52],["Aluram Golden Glow Body Lotion",20],["Aluram Golden Body Lotion, mini",7],["Taffeta Brow Oil",19],["Taffeta Cuticle Oil",10]]
};
/* the skin (BR) product list in A to Z order (Alexandra, Oct 22 2026), sizes small to large */
(()=>{const k=n=>String(n).replace(/^Biologique Recherche /,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  ['skin','hair'].forEach(t=>RX_PRICES[t].sort((a,b)=>k(a[0]).localeCompare(k(b[0]),'en',{numeric:true})))})();   /* hair too (Oct 22 2026) */

/* Retail grouped by brand (Alexandra, Oct 15 2026: a drop-down per brand, less scrolling) */
const RX_BRANDS=['Taffeta','Oribe','K18','Davines','IGK','Brazilian Blowout','Rossano Ferretti','Aluram','Olaplex','Kenra','Biologique Recherche','Cool Cucumber','Jolie','EHP','Ergo','T3'];
const rxBrand=n=>{n=String(n);if(/^BR |^Taffeta BR Bottle/.test(n))return 'Biologique Recherche';   /* the $25 BR Bottle sits with the BR products (Oct 22 2026) */return RX_BRANDS.find(b=>n.startsWith(b))||(/^Hydralixir/.test(n)?'Cool Cucumber':'More')};
const rxByBrand=items=>{const g={};items.forEach(x=>{const b=rxBrand(x[0]);(g[b]=g[b]||[]).push(x)});
  return Object.keys(g).sort((a,b)=>(RX_BRANDS.indexOf(a)+1||99)-(RX_BRANDS.indexOf(b)+1||99)).map(b=>[b,g[b]])};
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
/* The Maintenance price list with stars moved to Prices → Home Care (Alexandra, Oct 23 2026): the RX card budgets
   maintenance for her, so the artist doesn't pick products while building it. */

/* Balayage (Alexandra, Oct 15 2026): the glaze is already in the balayage price, so it is never added on top (Additional
   Mix $25 is the add-on instead), and anyone getting a balayage comes back for a balayage: Minimum Balayage. */
const RX_BAL=/balayage/i;
const RX_BAL_M=[['Minimum Balayage','Female Haircut'],'8–10 weeks','A minimum balayage and a trim. Your glaze is included.'];
/* Guests who come every 4 to 8 weeks don't need a cut every visit: the next visit after a cut can be "Leave Wet" to save
   on cost (Alexandra, Oct 15 2026). Balayage guests keep the trim.
   Color never goes longer than 10 weeks: 8–10 weeks for balayage, foils and soft root color; single process and gray
   coverage every 4–6 weeks (Alexandra, Oct 17 2026). */
/* What she's hoping for → service packages, fullest first. */
const RX_GOAL={
  hair:{
    'Lived-In Blonde (Balayage)':{p:[['Full Head Balayage','Female Haircut'],['Half Head Balayage','Female Haircut'],['Minimum Balayage','Female Haircut'],['Minimum Balayage']],
      m:RX_BAL_M},
    /* foils are their own color choice; foil prices don't include the glaze, so it's its own line (Alexandra, Oct 17 2026) */
    'Foils (Highlights)':{p:[['Full Foil','Glaze','Female Haircut'],['Half Foil','Glaze','Female Haircut'],['Minimum Foil','Glaze','Female Haircut'],['Face Frame/Spot Highlight','Glaze'],['Minimum Foil','Glaze']],
      m:[['Minimum Foil','Glaze','Leave Wet (no haircut)'],'8–10 weeks','Foils around the part and hairline and a glaze. If you get your cut today, skip it next time to save: leave wet, or add a $50 blow dry. Need a trim? A haircut leaving wet is $50.']},
    /* soft, grown-out color so she can go longer between visits (Alexandra, Oct 15 2026); balayage already includes shadow root and glaze */
    'Lower Maintenance Hair Color':{p:[['Half Head Balayage','Female Haircut'],['Minimum Balayage','Female Haircut'],['Shadow Root','Glaze','Female Haircut'],['Shadow Root','Glaze']],
      m:[['Shadow Root','Glaze'],'8–10 weeks','A soft root melt and a glaze. It grows out softly, so you can go up to 10 weeks between visits.']},
    /* a Female Haircut already includes the blow dry, so the two are never listed together; with no cut she leaves wet,
       no extra service (Alexandra, Oct 16 2026) */
    'Single Process or Gray Coverage':{p:[['Single Process','Glaze','Female Haircut'],['Single Process','Female Haircut'],['Single Process']],
      m:[['Single Process'],'4–6 weeks','Roots only. Add a cut every other visit.']},
    'Shine And Tone Refresh (Glaze)':{p:[['Glaze','Female Haircut'],['Glaze']],
      m:[['Glaze'],'6–8 weeks','A glaze to bring the shine and tone back.']},
    'New Cut or Shape':{p:[['Female Haircut'],['Haircut Leaving Wet']],
      m:[['Female Haircut'],'6–8 weeks','A trim to keep the shape.']},
    /* movement comes from both the color (dimension) and the styling and products (Alexandra, Oct 15 2026) */
    'Movement (Color & Style)':{p:[['Half Head Balayage','Female Haircut'],['Face Frame/Spot Highlight','Glaze','Female Haircut'],['Face Frame/Spot Highlight','Glaze'],['Female Haircut']],
      m:[['Face Frame/Spot Highlight','Glaze','Female Haircut'],'8–10 weeks','Brightness around the face, a glaze and a trim keep the movement going.']},
    'Big Change (Transformation)':{p:[['Full Head Balayage','Female Haircut'],['Full Foil','Glaze','Female Haircut'],['Half Head Balayage','Female Haircut'],['Half Foil','Glaze','Female Haircut']],
      m:[['Face Frame/Spot Highlight','Glaze','Leave Wet (no haircut)'],'8–10 weeks','A big change can take more than one visit. Next time: face-framing foils and a glaze. If you get your cut today, skip it next time to save: leave wet, or add a $50 blow dry. Need a trim? A haircut leaving wet is $50.']},
    'Blowout or Style':{p:[['Blowdry Plus'],['Blow Dry']],m:[['Blow Dry'],'1–2 weeks','A blowout for your next event.']}
  },
  skin:{
    'Clear Breakouts':{p:[['Biologique Recherche Cure All'],['Taffeta Facial'],['Express Acne Treatment']],m:[['Express Acne Treatment'],'4 weeks','A focused 30-minute treatment to stay clear.']},
    'Calm Redness':{p:[['Biologique Recherche Cure All'],['Taffeta Facial'],['Mini Redness Reversal']],m:[['Mini Redness Reversal'],'4 weeks','A calming 30-minute treatment.']},
    'Brighten or Even Tone':{p:[['Biologique Recherche Cure All'],['Taffeta Facial','Dermaplaning Add-On'],['Taffeta Facial'],['Brightening Mini Facial']],m:[['Brightening Mini Facial'],'4 weeks','A 30-minute brightening treatment.']},
    'Hydrate':{p:[['Biologique Recherche Cure All'],['Taffeta Facial'],['Hydration Boost']],m:[['Hydration Boost'],'4 weeks','A 30-minute moisture boost.']},
    /* named Anti-Aging so the girls find it (Alexandra, Oct 20 2026); cards saved as Fine Lines And Firmness still open */
    'Anti-Aging (Fine Lines & Firmness)':{p:[['Biologique Recherche Lift & Remodel'],['Taffeta Facial'],['Anti-Aging Express']],   /* Nano Needling is Carolyn's specialty suggestion, not an option (Oct 20 2026) */
      m:[['Anti-Aging Express'],'4 weeks','A 30-minute treatment for firmness and fine lines.']},
    'Overall Glow':{p:[['Biologique Recherche Cure All'],['Taffeta Facial'],['Hydration Boost']],m:[['Taffeta Facial'],'4–6 weeks','Your facial every 4 to 6 weeks keeps skin on track.']}
  }
};

/* Consultation questions (Alexandra's method: learn her weekly routine first). Hair approved as drafted; skin is a first draft. */
const RX_Q={
  hair:[
    ['wash','How often does she wash?',['Daily','Every other day','Every 2–3 days','Once a week']],
    ['feel','How does her hair feel?',['Dry','Oily','Frizzy','Flat','Breakage','Flyaways','Hard to style','Curly or wavy','Normal'],1],
    ['style','How does she style it?',['Air dry','Blow-dry with a brush or diffuser','Hot tools daily']],
    ['color','Is it color-treated?',['No','Yes','Yes, with a glaze that fades','Blonde that turns brassy','Grays showing'],1],
    ['prod','What does she use now?',['Professional','Drugstore']],
    ['love','Does she love it?',['Yes','It’s okay','No']],
    ['clean','Does she like clean, vegan products?',['No preference','Yes']]],
  skin:[
    /* "How does her skin feel?" is gone: it repeated Her Skin Instant, which now comes first (Alexandra, Oct 16 2026) */
    ['steps','Her routine now',['Nothing','Cleanser only','A few steps','Full routine']],
    ['spf','Daily sunscreen?',['Yes','No']],
    ['prod','What does she use now?',['Professional','Drugstore']],
    ['love','Does she love it?',['Yes','It’s okay','No']]]
};
const RX_NOW={
  /* hair: scalp health only; how her hair feels is asked earlier (Alexandra, Oct 17 2026) */
  hair:['Oily scalp','Dry or tight scalp','Itchy or flaky scalp','Sensitive scalp','Product buildup','Nothing new, healthy scalp'],
  skin:['Breakouts','Redness','Sensitive','Oily','Dullness or uneven tone','Dark spots','Dehydration','Fine lines','Large pores','Nothing new, just maintaining']
};

const rxKind=()=>(S.mine&&S.mine.role==='esthetician')?'skin':'hair';
const rxSlug=()=>(S.mine&&S.mine.staff&&S.mine.staff.slug)||(S.mine&&S.mine.slug)||'x';
const rxKey=()=>'pp-rx:'+rxSlug(), rxSavedKey=()=>'pp-rxsaved:'+rxSlug();
const rxBlank=k=>({kind:k||rxKind(),guest:'',visit:'',budget:'',nob:false,goal:[],a:{},now:[],opts:null,m:null,refresh:'',id:'',pro:''});
let RX=null, RX_VIEW='build', RX_FIND='', RX_SHOW=null, RX_MSG='', RX_HOME=null;
function rxLoad(){ if(RX) return RX; try{RX=Object.assign(rxBlank(),JSON.parse(store.get(rxKey())||'{}'))}catch(e){RX=rxBlank()} return RX }
function rxSave(){ store.set(rxKey(),JSON.stringify(RX)) }
function rxSaved(){ try{return JSON.parse(store.get(rxSavedKey())||'[]')}catch(e){return []} }
const rxMoney=n=>'$'+(Math.round(n*100)/100).toLocaleString('en-US',{maximumFractionDigits:2});
const rxFirst=n=>String(n||'').trim().split(/\s+/)[0]||'';
/* the guest is saved as first name + last initial ("Danielle M.") so two guests with the same name don't mix up (Alexandra, Oct 20 2026) */
const rxGuestName=n=>{const w=String(n||'').trim().split(/\s+/).filter(Boolean);if(!w.length)return '';const f=w[0].charAt(0).toUpperCase()+w[0].slice(1);const l=w.length>1?w[w.length-1].replace(/[^A-Za-z]/g,'').charAt(0).toUpperCase():'';return l?f+' '+l+'.':f};

/* Genuine needs only, most important first, at most two. "Right now" leads, then her routine. */
/* Hair concerns from her answers: the scalp question plus how her hair feels and her color (Oct 17 2026).
   Older cards saved hair concerns in the season question, so those still count. */
function rxNowAll(R){
  const now=[...(R.now||[])];if(R.kind!=='hair')return now;
  const a=R.a||{},feel=[].concat(a.feel||[]),color=[].concat(a.color||[]),add=x=>{if(!now.includes(x))now.push(x)};
  if(feel.includes('Dry'))add('Dryness');if(feel.includes('Frizzy'))add('Frizz');if(feel.includes('Flat'))add('Flat, no volume');
  if(feel.includes('Breakage'))add('Breakage');if(feel.includes('Flyaways'))add('Flyaways');if(feel.includes('Hard to style'))add('Hard to style');
  if(color.includes('Grays showing'))add('Grays showing');
  return now;
}
function rxNeeds(R){
  const a=R.a||{}, now=rxNowAll(R), out=[], add=k=>{if(!out.includes(k)&&RX_PROD[k]) out.push(k)};
  const notHappy=a.prod&&!['Professional','Unsure','Not sure','I don’t know'].includes(a.prod)||a.love==='No'||a.love==='It’s okay'; /* "it's okay" means she's open to something better (Alexandra, Oct 16 2026) */
  if(R.kind==='hair'&&rxGoalList(R).some(g=>/^Blowout/.test(g))&&(now.includes('Frizz')||now.includes('Flyaways'))) add('sleekStick');
  if(R.kind==='hair'&&rxGoalList(R).some(g=>/^Movement/.test(g))) add(a.style==='Air dry'?'movementAir':'movement');
  /* Skin home care the way Carolyn builds it (Oct 16 2026): one P50 matched to her skin plus a serum for the quickest
     results, then fill the gaps in her routine (the Lait cleanser that goes with the P50, a cream for dry skin or fine
     lines) so it's a sure sale. In that order: what doesn't fit the budget moves to the full sizes she takes home later.
     Her example: dry, dull, fine lines -> Lait VIP O2 + Lotion P50V + Spectral Sérum Authentique + Crème Grand Millésime. */
  if(R.kind==='skin'){
    const sens=now.includes('Redness')||now.includes('Sensitive')||a.feel==='Sensitive';
    const brk=now.includes('Breakouts')||now.includes('Large pores')||now.includes('Oily');
    const spots=now.includes('Dark spots');
    const dry=now.includes('Dehydration')||a.feel==='Dry or tight', dull=now.includes('Dullness or uneven tone'), lines=now.includes('Fine lines');
    const firm=lines||rxGoalList(R).some(g=>/Anti-Aging|Fine Lines|Firm/i.test(g));   /* anti-aging: collagen serum + Crème Splendide (Carolyn, Oct 22 2026) */
    add(sens?'skSens':brk?'skBreak':spots?'skBright':'skP50V');
    add(spots?'skSerPigm':firm?'skCollagen':(dull||dry)?'skSpectral':sens?'skSerSens':brk?'skSerPore':'skSpectral');
    const lovesFull=a.steps==='Full routine'&&a.prod==='Professional'&&a.love==='Yes';
    if(!lovesFull) add('skLaitO2');
    if(firm) add('skSplendide'); else if(dry||a.steps==='Nothing'||a.steps==='Cleanser only') add('skCreamGM');
    return out;
  }
  const feel=[].concat(a.feel||[]), color=[].concat(a.color||[]);
  const colored=color.some(c=>c&&c!=='No');
  if(now.includes('Color fading')||color.includes('Yes, with a glaze that fades')){ add(colored&&notHappy?'colorSafe':'glazeKeep'); add('uv') }
  if(now.includes('Brassiness')||color.includes('Blonde that turns brassy')) add('brassy');
  if(now.includes('Flyaways')) add('flyaway');
  if(now.includes('Breakage')) add('breakage');
  if(now.includes('Frizz')) add(a.style==='Air dry'?(feel.includes('Curly or wavy')?'airCurl':'airDry'):'frizz');
  if(now.includes('Dryness')) add('dry');
  if(now.includes('Oily scalp')) add(feel.includes('Flat')?'airWash':'oily');
  if(now.includes('Flat, no volume')){ add('flatWash'); add(/^Blow-dry with a brush/.test(a.style||'')?'flat':'flatSpray') }
  if(now.some(x=>/^(Itchy or flaky|Dry or tight|Sensitive) scalp$/.test(x))) add('scalp');
  if(now.includes('Grays showing')) add('grays');
  if(now.includes('Hard to style')) add(a.style==='Air dry'?(feel.includes('Curly or wavy')?'airCurl':'airDry'):/^Blow-dry with a brush/.test(a.style||'')?'prep':'blowLast');
  /* from the routine, only when nothing above already covers it */
  if(colored&&notHappy) add('colorSafe');
  if(a.style==='Hot tools daily'||/^Blow-dry with a brush/.test(a.style||'')) add('heat');
  if(a.style==='Air dry'&&!out.some(k=>k==='airDry'||k==='airCurl')) add(feel.includes('Curly or wavy')?'airCurl':'airDry');
  if(feel.includes('Oily')&&a.wash==='Daily') add('oily');
  if(feel.includes('Flat')) add('flatWash');
  if((a.wash==='Every 2–3 days'||a.wash==='Once a week')&&(/^Blow-dry with a brush/.test(a.style||'')||feel.includes('Flat'))) add('airWash');
  /* home care is always budgeted, even before the artist knows exactly what she'll take home (Alexandra, Oct 16 2026) */
  if(!out.length) add(colored?'colorSafe':'basicWash');
  return out.slice(0,2).map(k=>a.clean==='Yes'&&RX_PROD[k+'RF']?k+'RF':k);
}

/* Every blonding service gets K18 sprayed in before the lightener: a backbar charge from $25 (up to $50 by amount used),
   and one pump of K18 leave-in after (Alexandra, Oct 2026). */
const RX_BLOND=/foil|balayage|highlight|lightener/i;
const rxSvcLines=(k,names)=>{names=k==='hair'?rxMergeSvc(names):rxMergeSkin(names); if(names.some(n=>RX_BAL.test(n))) names=names.filter(n=>n!=='Glaze');
  const L=names.map(n=>{const p=rxPrice(k,n),reg=rxRegPrice(k,n);return reg!==p?{n,p,t:'s',reg}:{n,p,t:'s'}});
  if(k==='hair'&&names.some(n=>RX_BLOND.test(n))&&!names.includes('K18 Bond Protection')) L.push({n:'K18 Bond Protection',p:rxPrice('hair','K18 Bond Protection'),t:'s'});
  return L};
/* 1.7 oz P50 lotions are offered only when they're on the shelf (Alexandra, Oct 15 2026); otherwise the full size.
   Out of stock as of the last Paired Plus count; update this list when the 1.7 oz comes in or sells out. */
const RX_OUT=['Biologique Recherche Lotion P50 (1.7 oz)'];
const rxProdLines=(keys,mode)=>mode==='none'?[]:typeof mode==='number'?rxProdLines(keys.slice(0,mode),'full'):keys.map((k,i)=>{let [n,p,why,alt]=RX_PROD[k];if(alt&&RX_OUT.includes(n))[n,p]=alt;const t=mode==='try'||(mode==='first'&&i>0);return {n,p:t?RX_TRY:p,t:t?'t':'p',why,full:p}});
const rxTotal=L=>L.reduce((s,x)=>s+(Number(x.p)||0),0);

/* Option 1 fits inside the budget (lighter service, or Try Me bottles before dropping home care); Option 2 is the full look. */
/* She can pick more than one goal (Alexandra, Oct 15 2026): the packages merge tier by tier, without doubles
   (a full cut wins over leaving wet, Blowdry Plus over Blow Dry). Old cards saved one goal as text. */
/* goal names are Title Case (Alexandra, Oct 15 2026); cards saved before still match by spelling, any case */
const RX_GOAL_OLD={'fine lines and firmness':'Anti-Aging (Fine Lines & Firmness)','brighter blonde (foils)':'Foils (Highlights)','root touch-up or gray coverage':'Single Process or Gray Coverage','movement (layers & texture)':'Movement (Color & Style)'};
const rxGoalKey=(R,g)=>{const l=String(g).toLowerCase();return Object.keys((RX_GOAL[R.kind]||{})).find(k=>k.toLowerCase()===l)||RX_GOAL_OLD[l]||g};
const rxGoalList=R=>(Array.isArray(R.goal)?R.goal:(R.goal?[R.goal]:[])).map(g=>rxGoalKey(R,g));
function rxMergeSvc(names){
  let L=[...new Set(names)];
  /* a Female Haircut includes the blow dry: a cut plus any blow dry becomes just Female Haircut, and a
     Haircut Leaving Wet plus a blow dry is really a Female Haircut (Alexandra, Oct 16 2026) */
  const dry=n=>n==='Blow Dry'||n==='Blowdry Plus';
  if(L.some(dry)&&(L.includes('Female Haircut')||L.includes('Haircut Leaving Wet'))){
    L=L.map(n=>n==='Haircut Leaving Wet'?'Female Haircut':n).filter(n=>!dry(n)); L=[...new Set(L)] }
  if(L.includes('Female Haircut')) L=L.filter(n=>n!=='Haircut Leaving Wet'&&n!=='Leave Wet (no haircut)');
  else if(L.includes('Haircut Leaving Wet')) L=L.filter(n=>n!=='Leave Wet (no haircut)');
  if(L.includes('Blowdry Plus')) L=L.filter(n=>n!=='Blow Dry');
  if(L.some(dry)) L=L.filter(n=>n!=='Leave Wet (no haircut)');
  return L;
}
/* Skin: one facial per visit (Alexandra, Oct 16 2026). With several goals the card keeps one facial (the MC 110 facial
   when it's there, otherwise the fullest) plus any add-ons like dermaplaning, brows or wax. */
const RX_FACIAL=/^(?!Masque: ).*(?:Facial|Treatment|Boost|Reversal|Express|Microdermabrasion|Lift & Remodel|Cure All)/;
function rxMergeSkin(names){
  let L=[...new Set(names)]; const f=L.filter(n=>RX_FACIAL.test(n)&&!/Add-On/.test(n)); if(f.length<2) return L;
  const keep=f.find(n=>/MC 110/.test(n))||f.slice().sort((x,y)=>rxRegPrice('skin',y)-rxRegPrice('skin',x))[0];
  return L.filter(n=>n===keep||!f.includes(n));
}
/* Fine lines + brighten: a facial with MC 110 sheds the dull skin and plumps into the fine lines, so it brightens
   and plumps at the same time (Alexandra, Oct 16 2026). It stands in for both goals. */
const RX_MC110={p:[['Taffeta Facial with MC 110'],['Brightening Mini Facial']],
  m:[['Taffeta Facial with MC 110'],'4–6 weeks','Your facial with MC 110 brightens and plumps at the same time.']};
function rxGoalPlan(R){
  let keys=rxGoalList(R);
  const mc=R.kind==='skin'&&keys.includes('Anti-Aging (Fine Lines & Firmness)')&&keys.includes('Brighten or Even Tone');
  if(mc) keys=keys.filter(k=>k!=='Anti-Aging (Fine Lines & Firmness)'&&k!=='Brighten or Even Tone');
  const gs=[...(mc?[RX_MC110]:[]),...keys.map(k=>(RX_GOAL[R.kind]||{})[k]).filter(Boolean)]; if(!gs.length) return null;
  if(gs.length===1) return gs[0];
  const mg=R.kind==='skin'?rxMergeSkin:rxMergeSvc;
  const n=Math.max(...gs.map(g=>g.p.length));
  const p=Array.from({length:n},(_,i)=>mg(gs.flatMap(g=>g.p[Math.min(i,g.p.length-1)])));
  const ms=mg(gs.flatMap(g=>g.m[0]));
  let mt=R.kind==='skin'?(gs.find(g=>g.m[0].some(x=>ms.includes(x)&&RX_FACIAL.test(x)))||gs[0]).m[2]:gs.map(g=>g.m[2]).join(' ');
  if(ms.includes('Female Haircut')) mt=mt.replace(/ If you get your cut today[^]*?Need a trim\? A haircut leaving wet is \$50\./,'');
  const m=[ms,gs[0].m[1],mt];
  return {p,m};
}
const RX_BIG_BLOND=/^(Half|Full) Head Balayage$|^(Half|Full) Foil$/;
const rxNeedsFor=(needs,names)=>names.some(n=>RX_BIG_BLOND.test(n))&&!needs.includes('k18Home')&&!needs.includes('breakage')?[...needs,'k18Home']:needs;
/* Full-size versions of the home care that the options only carry as Try Me bottles or left off for the budget */
function rxRecFull(o1,o2,keys){
  const full=new Set(o2.filter(l=>l.t==='p').map(l=>l.n)); /* judged on All In: what it only carries as Try Me or leaves off */
  return rxProdLines([...new Set(keys)],'full').filter(l=>!full.has(l.n)).slice(0,3).map(l=>({n:l.n,p:l.p,why:l.why}));
}
/* Hair home care is a budget she agrees to at the consult, built into each option's total, so it's already part of
   her price at checkout (Alexandra, Oct 17 2026, from Melissa's paper card): All In $81 (the Taffeta shampoo and
   conditioner set), Worth The Wait $45. The artist decides what she actually goes home with at the end. */
const RX_HC_HI=81, RX_HC_LO=45;
const rxHcLine=(amt,needs)=>({n:'Home Care',p:amt,t:'h',why:needs.length?'Suggested: '+[...new Set(needs.map(k=>RX_PROD[k][0]))].join(', '):'',full:amt});
/* the lighter option keeps the color and swaps the haircut for a blow dry (Melissa's card: $266 with the cut, $246 with a blow dry) */
function rxCutSwap(P){const out=[];P.forEach(t=>{out.push(t);if(t.includes('Female Haircut')&&t.some(n=>n!=='Female Haircut')){const b=t.map(n=>n==='Female Haircut'?'Blow Dry':n);
  if(!P.some(x=>x.length===b.length&&x.every((n,i)=>n===b[i])))out.push(b)}});return out}
/* Option 1 at or under her budget, Option 2 about $60 to $80 more, so the two are a real choice (Alexandra, Oct 20 2026:
   Sarah's skin card came out $9 over her budget with the options only $41 apart). Option 1 is the fullest service
   that fits her budget with home care; when none does, the lightest service with whatever home care is left.
   Option 2 is the fullest package up to $80 more, keeping every service in Option 1; when nothing lands at
   least $60 more, its home care goes up to make the difference. pkg(i,home care $,leave-in) builds a tier. */
const RX_GAP_LO=60, RX_GAP_HI=80, RX_GAP_MID=70;
function rxPair(P,b,pkg,lo,vars,ok,cap){
  const bb=b!=null?b:RX_CAP-RX_GAP_HI;
  let o1=null,i1=P.length-1;
  for(let i=0;i<P.length&&!o1;i++){const L=pkg(i,lo,false); if(rxTotal(L)<=bb){o1=L;i1=i}}
  if(!o1){const s=rxTotal(pkg(i1,0,false)); o1=pkg(i1,Math.max(0,Math.floor((bb-s)/5)*5),false)}
  /* Option 2 keeps every service in Option 1 (Donelle's card, Oct 20 2026: never trade her haircut for a blow dry) */
  const svc1=o1.filter(l=>l.t==='s').map(l=>l.n), keeps=L=>svc1.every(n=>L.some(l=>l.n===n));
  const t1=rxTotal(o1); let best=null;
  for(let i=0;i<=i1;i++) for(const [a,lv] of vars){const L=pkg(i,a,lv),t=rxTotal(L);
    if(t>t1&&t<=t1+RX_GAP_HI&&ok(L)&&keeps(L)&&(!best||t>best.t)) best={L,t,i,a,lv}}
  if(!best) for(let i=0;i<=i1;i++) for(const [a,lv] of vars){const L=pkg(i,a,lv),t=rxTotal(L);
    if(t>t1&&ok(L)&&keeps(L)&&(!best||t<best.t)) best={L,t,i,a,lv}}
  if(!best){const a=vars[0][0];best={L:pkg(i1,a,false),i:i1,a,lv:false};best.t=rxTotal(best.L)}
  let o2=best.L;
  if(best.t<t1+RX_GAP_LO){const add=Math.min(Math.round(t1+RX_GAP_MID)-best.t,cap-best.t), a=Math.ceil((best.a+add)/5)*5;
    if(add>0) o2=pkg(best.i,best.t+a-best.a<=cap?a:best.a+add,best.lv)}
  return [o1,o2];
}
function rxGenerateHair(R,g){
  const needs=rxNeeds(R), P=rxCutSwap(g.p), b=R.nob?null:Number(R.budget)||null;
  const now=rxNowAll(R), leave=now.some(x=>/Color fading|Brassiness|Breakage|Dryness/.test(x))||P[0].some(n=>RX_BLOND.test(n));
  const cap=Infinity;  /* Option 2 stays within $80 of Option 1 (rxPair), which replaces the old $100-over-budget cap */
  const pkg=(i,amt,lv)=>[...rxSvcLines('hair',P[i]),...(lv?rxSvcLines('hair',['Goldwell Leave-In Treatment']):[]),...(amt>0?[rxHcLine(amt,rxNeedsFor(needs,P[i]))]:[])];
  const okL=L=>rxTotal(L)<=cap&&(rxTotal(L)<=RX_ALLIN_HAIR||!L.some(l=>l.n==='Goldwell Leave-In Treatment'));
  const vars=[[RX_HC_HI,leave],[RX_HC_HI,false],[RX_HC_LO,leave],[RX_HC_LO,false]].filter(([,lv],i,A)=>!lv||A.findIndex(x=>x[0]===A[i][0])===i);
  const [o1,o2]=rxPair(P,b,pkg,RX_HC_LO,vars,okL,cap);
  let [ms,mw,mt]=[o1,o2].some(L=>L.some(l=>RX_BAL.test(l.n)))?RX_BAL_M:g.m;
  /* next visit: today's color stays (a glaze she had today comes back), and with no cut or style it's a blow dry, not leave wet */
  ms=[...ms]; const today=[...o1,...o2].map(l=>l.n);
  /* single process or gray coverage today: her next visit is her roots in 4–6 weeks, even with a balayage or foils
     (those refresh at about 8–10 weeks) (Alexandra, Oct 17 2026) */
  if(today.includes('Single Process')){const bal=today.some(n=>RX_BAL.test(n)), bl=today.some(n=>RX_BLOND.test(n));
    ms=['Single Process']; mw='4–6 weeks';
    mt='Your roots every 4 to 6 weeks keep your grays covered.'+(bl?' Your '+(bal?'balayage':'highlights')+' refresh comes at about 8 to 10 weeks.':'')+' Add a cut every other visit.'}
  if(ms.includes('Single Process')&&today.includes('Glaze')&&!ms.includes('Glaze')) ms.push('Glaze');
  ms=ms.map(n=>n==='Leave Wet (no haircut)'?'Blow Dry':n);
  if(!ms.some(n=>/Haircut|Blow ?dry|Blowdry/i.test(n))&&ms.some(n=>!/Female Haircut/.test(n))&&g.p[0].includes('Female Haircut')) ms.push('Blow Dry');
  ms=rxMergeSvc(ms);
  if(ms.includes('Blow Dry')) mt=mt.replace(/ If you get your cut today[^]*$/,' With a blow dry, and your cut every other visit.').replace(/^Roots only\. Add a cut every other visit\.$/,'Your color refresh and a blow dry. Add a cut every other visit.');
  return {opts:[{title:'Option 1',lines:o1},{title:'Option 2',lines:o2}],
    m:{lines:rxSvcLines('hair',ms),when:mw,text:mt},refresh:mw,keep:false,more:false,rec:[]};
}
/* Skin home care the same way (Alexandra, Oct 17 2026): All In budgets $60 for the full-size cleanser (Lait VIP O2 5.1 oz),
   Worth The Wait carries the $50 Biologique Recherche Skin Box. Her matched P50 is highly suggested under All In, not in the total. */
/* How long a skin product lasts with daily use (Alexandra, Oct 20 2026), so she knows when she'll need it again.
   Estimates for using it as directed; Carolyn can correct any of them. */
function rxLasts(n){n=String(n||'');
  if(/Skin Box/.test(n))return '4-week skincare routine';
  if(n.startsWith(RX_BRB_N))return 'about 2 weeks';   /* Taffeta BR Bottle: a 2-week sample, 1–2 drops */
  const oz=Number((n.match(/\(([\d.]+) oz\)/)||[])[1])||0;
  if(/Lait|Démaquillante|Micellaire/.test(n))return oz&&oz<2?'about 1 month':oz>=8?'about 5 months':'about 3 months';
  if(/Lotion P50|Eauxyg/.test(n))return oz&&oz<2?'about 1 month':oz>=8?'about 5 months':'about 3 months';
  if(/MC 110/.test(n))return 'about 3 months';
  if(/Sérum|Serum|Fluide|Amniotique|Collag|Élastine|Placenta|Tensil|Oligo|Dermopore|Silk Plus|Iribiol|Tissulaires|Colostrum|Spectral/.test(n))return oz&&oz<0.5?'about 1 month':'about 3 months';
  if(/Contour des Yeux|Eye Care/.test(n))return 'about 3 months';
  if(/Masque|Mask/.test(n))return 'about 3 months (1–2 times a week)';
  if(/Crème|Émulsion|Cream/.test(n))return 'about 2–3 months';
  return ''}
const RX_SK_HI=60, RX_SK_LO=50, RX_SK_MIN=25;   /* $25: three samples matched to her skin, so a first-time guest never leaves with nothing (Alexandra, Oct 20 2026) */
/* the 90-minute Biologique Recherche facials ($200) sit at the top of every skin goal: All In on a bigger budget, or
   Worth The Wait with the Skin Box when her budget is about $300 (Alexandra, Oct 20 2026) */
function rxGenerateSkin(R,g){
  const needs=rxNeeds(R), P=g.p, b=R.nob?null:Number(R.budget)||null, cap=RX_ALLIN_SKIN;
  const nw=R.now||[], gl=rxGoalList(R);
  const box=nw.includes('Breakouts')||gl.includes('Clear Breakouts')?'Blemish Skin Box':nw.includes('Fine lines')||gl.includes('Anti-Aging (Fine Lines & Firmness)')?'Youth Skin Box':'Standard Skin Box';
  /* every product rule still runs: the artist sees the products matched to what she said (P50, serum, cleanser, cream);
     her card shows only the budget (Alexandra, Oct 17 2026) */
  const picks=[...new Set(needs.map(k=>{let [n,,,alt]=RX_PROD[k];return alt&&RX_OUT.includes(n)?alt[0]:n}))].join(', ');
  /* home care by amount: $60 and up starts with the full-size cleanser, $50 is the Skin Box, less is what's left of her budget */
  const hc=p=>({n:'Home Care',p,t:'h',full:p,why:p>=RX_SK_HI?'Start with the full-size cleanser, Biologique Recherche Lait VIP O2 (5.1 oz, lasts about 3 months)'+(picks?'. Matched to her skin: '+picks:''):
    p>=RX_SK_LO?'Suggested: Biologique Recherche '+box+', lasts for a 4-week skincare routine'+(picks?'. Matched to her skin for later: '+picks:''):
    p>RX_SK_MIN?'What’s left of her budget: the travel-size Lait VIP O2 (1.7 oz, $35, lasts about 1 month) or a Taffeta BR Bottle ($25, lasts about 2 weeks)'+(picks?'. Matched to her skin for later: '+picks:''):
    'Three Biologique Recherche samples matched to her skin (less than the Skin Box, but she goes home with something)'+(picks?'. Matched to her skin for later: '+picks:'')});
  const pkg=(i,amt)=>[...rxSvcLines('skin',P[i]),...(amt>0?[hc(amt)]:[])];
  /* two different facials (Alexandra, Oct 20 2026): Worth The Wait is the lighter facial that fits her budget, All In is
     the next facial up. With only one facial to offer, All In is the same facial with the bigger home care budget. */
  const bb=b!=null?b:RX_CAP;
  const fac=i=>P[i][0], up=i=>{for(let j=i-1;j>=0;j--) if(fac(j)!==fac(i)) return j; return -1};
  const who0=rxArtist(), at99=x=>rxRegPrice('skin',x)===99&&rxSkinCan(x,who0);
  const tgt=g.m[0].find(at99)||P.flat().find(at99)||['Hydration Boost','Anti-Aging Express','Brightening Mini Facial'].find(at99)||g.m[0][0];
  let i1=P.findIndex((t,i)=>rxTotal(pkg(i,RX_SK_LO))<=bb); if(i1<0) i1=P.length-1;
  let o1=pkg(i1,RX_SK_LO); if(b!=null&&rxTotal(o1)>b){const s=rxTotal(pkg(i1,0)); o1=pkg(i1,Math.max(RX_SK_MIN,Math.floor((b-s)/5)*5))}
  /* All In: the next facial up; when she's already on the top facial, the same facial with her cleanser and matched P50 in full size */
  const p50k=(needs.find(k=>/^sk(Break|Sens|Bright|P50V)$/.test(k))||'skP50V'), p50f=(()=>{let [pn,pp,,alt]=RX_PROD[p50k];if(alt&&(RX_OUT.includes(pn)||!/5(\.1)? oz/.test(pn)))[pn,pp]=alt;return [pn,pp]})();
  let o2=up(i1)>=0?pkg(up(i1),RX_SK_HI):[...rxSvcLines('skin',P[i1]),{n:'Home Care',p:RX_SK_HI+p50f[1],t:'h',full:RX_SK_HI+p50f[1],why:'Her full-size cleanser, Biologique Recherche Lait VIP O2 (5.1 oz), and her P50 matched to her skin: '+p50f[0]}];
  /* a budget under $200 to start (Alexandra, Oct 20 2026): Worth The Wait is the $99 targeted treatment with the Skin Box
     ($149), or a Taffeta Facial with no home care when her budget is under that; All In is a Taffeta Facial with the
     Skin Box, or one full-size bottle instead */
  if(b!=null&&b<200){
    o1=b>=99+RX_SK_LO?[...rxSvcLines('skin',[tgt]),hc(RX_SK_LO)]:[...rxSvcLines('skin',['Taffeta Facial']),hc(RX_SK_MIN)];
    o2=[...rxSvcLines('skin',['Taffeta Facial']),Object.assign(hc(RX_SK_LO),{why:'The Biologique Recherche '+box+' (lasts for a 4-week skincare routine), or one full-size bottle instead: her cleanser, Lait VIP O2 (5.1 oz, $60), or her P50 matched to her skin'+(picks?' ('+picks+')':'')})];
    if(rxTotal(o1)>=rxTotal(o2)) o1=[...rxSvcLines('skin',['Taffeta Facial']),hc(RX_SK_MIN)];
    /* she wants the relaxing 60-minute facial: both options are the Taffeta Facial, Worth The Wait with what her budget allows */
    if(R.visit==='relax'){const left=b-rxPrice('skin','Taffeta Facial');
      o1=left>=RX_SK_LO?[...rxSvcLines('skin',['Taffeta Facial']),hc(RX_SK_LO)]:[...rxSvcLines('skin',['Taffeta Facial']),hc(RX_SK_MIN)];
      if(rxTotal(o2)<=rxTotal(o1)) o2=[...rxSvcLines('skin',['Taffeta Facial']),hc(RX_SK_HI)]}
  }
  /* All In stays about $50–60 over the budget she gave, never more than $60 (Alexandra, Oct 23 2026): the next facial up if it
     fits with some home care, otherwise Worth The Wait's service with more home care */
  if(b!=null&&rxTotal(o2)>b+60){
    const lim=b+60, j=up(i1); let alt=null;
    if(j>=0){const s2=rxTotal(pkg(j,0)); if(s2+RX_SK_MIN<=lim) alt=pkg(j,Math.min(RX_SK_HI,Math.floor((lim-s2)/5)*5))}
    if(!alt){const sv=o1.filter(l=>l.t==='s'), s1=rxTotal(sv), amt=Math.floor((lim-s1)/5)*5; if(amt>=RX_SK_MIN) alt=[...sv,hc(amt)]}
    if(alt&&rxTotal(alt)>rxTotal(o1)) o2=alt;
  }
  /* and not much under it: All In reaches about $50 over her budget with more home care (up to $200 of it) */
  if(b!=null&&rxTotal(o2)<b+50){
    const sv=o2.filter(l=>l.t==='s'), s2=rxTotal(sv), amt=Math.min(200,Math.ceil((b+50-s2)/5)*5);
    if(amt>=RX_SK_MIN&&s2+amt>rxTotal(o2)) o2=[...sv,hc(amt)];
  }
  /* Carolyn's specialty: Nano Needling is suggested for her to swap into All In when it's right for the guest */
  const spec=rxArtist()==='carolyn'&&(gl.includes('Anti-Aging (Fine Lines & Firmness)')||nw.includes('Fine lines'))
    ?{n:'Nano Needling Facial',p:rxPrice('skin','Nano Needling Facial'),why:'Your specialty for fine lines and firmness. If it’s right for her, swap it into All In.'}:null;
  const p50=(needs.find(k=>/^sk(Break|Sens|Bright|P50V)$/.test(k))||'skP50V'); let [n,pr,why,alt]=RX_PROD[p50]; if(alt&&RX_OUT.includes(n))[n,pr]=alt;
  if(!/5(\.1)? oz/.test(n)&&alt) [n,pr]=alt;   /* the note suggests the full-size P50 */
  let [ms,mw,mt]=g.m, mLines=rxSvcLines('skin',ms);
  if(/every .*weeks/i.test(mt||'')) mt='';   /* the timing is already in "In about": no repeat (Alexandra, Oct 20 2026) */
  /* a budget that only covers Worth The Wait means she goes home with the Skin Box (about 4 weeks of samples), so her
     next visit is a $99 targeted treatment plus her first full-size product, not a full facial. A rule for everyone with a
     low budget to start, not just one guest (Alexandra, Oct 20 2026) */
  const low=b!=null&&b<200;   /* a low budget to start: under $200 */
  if(low){
    /* every low budget, relaxing visit or results first: the $99 targeted treatment next time (Alexandra, Oct 20 2026) */
    mLines=[...rxSvcLines('skin',[tgt]),{n,p:pr,t:'p',why:'Her first full size, matched to her skin',full:pr}];
    mw='4 weeks'; mt='We’ll see how your skin did with what you took home: a targeted treatment, and your first full-size product to keep your results going.'}
  return {opts:[{title:'Option 1',lines:o1},{title:'Option 2',lines:o2}],
    m:{lines:mLines,when:mw,text:mt},refresh:mw,keep:false,more:false,rec:[{n,p:pr,why,hint:'p50'}],spec};
}
/* Who does which skin service (Alexandra, Oct 20 2026): only Carolyn does Nano Needling; Kelly does the Taffeta Facial
   and the Biologique Recherche facials only. A suggestion she can't do is swapped out or dropped from her card. */
const RX_BR_FACIALS=['Express Acne Treatment','Hydration Boost','Brightening Mini Facial','Mini Redness Reversal','Anti-Aging Express','Taffeta Facial with MC 110','Biologique Recherche Lift & Remodel','Biologique Recherche Cure All'];
const RX_SKIN_ONLY={kelly:['Taffeta Facial',...RX_BR_FACIALS]};
const RX_SKIN_JUST={'Nano Needling Facial':['carolyn']};
function rxArtist(){const n=(typeof S!=='undefined'&&S&&S.mine&&(S.mine.name||(S.mine.staff&&S.mine.staff.name)))||'';return String(n).trim().split(/\s+/)[0].toLowerCase()}
function rxSkinCan(n,who){if(!who)return true;if(RX_SKIN_JUST[n]&&!RX_SKIN_JUST[n].includes(who))return false;const only=RX_SKIN_ONLY[who];return !only||only.includes(n)}
function rxSkinFor(g){const who=rxArtist();if(!who)return g;
  const keep=L=>L.filter(n=>rxSkinCan(n,who));
  let p=g.p.map(keep).filter(t=>t.length);p=p.filter((t,i)=>p.findIndex(x=>x.join('|')===t.join('|'))===i);
  if(!p.length)p=[['Taffeta Facial']];
  let ms=keep(g.m[0]);if(!ms.length)ms=[p[p.length-1][0]];
  return {p,m:[ms,g.m[1],g.m[2]]}}
function rxGenerate(R){
  RX_VIPON=!!R.vip; RX_RATE=(typeof S!=='undefined'&&S&&S.mine&&Number(S.mine.rate))||45;
  let g=rxGoalPlan(R); if(!g) return null;
  if(R.kind==='skin') g=rxSkinFor(g);
  if(R.kind==='hair') return Object.assign({spec:null},rxGenerateHair(R,g));
  if(R.kind==='skin') return rxGenerateSkin(R,g);
  const needs=rxNeeds(R), P=g.p, b=R.nob?null:Number(R.budget)||null;
  /* Goldwell leave-in backbar treatment: a no-downtime add-on for color that fades, blonde repair or dry, damaged hair.
     $20, or $10–15 when only half the bottle is used (Alexandra, Oct 2026). Offered in the full look. */
  const now=rxNowAll(R), leave=R.kind==='hair'&&(now.some(x=>/Color fading|Brassiness|Breakage|Dryness/.test(x))||P[0].some(n=>RX_BLOND.test(n)));
  /* Option 2 never goes more than $100 over her budget, and with no budget it stays at $400 or under
     (Alexandra, Oct 16 2026): the fullest package that fits, trimming home care to Try Me bottles,
     then the leave-in treatment, before stepping down a service tier. */
  /* skin: services run about $200, so nothing on a skin card is suggested past a $400 ticket, budget or not; more
     retail only if she asks (Alexandra, Oct 16 2026) */
  const RX_ALLIN=R.kind==='skin'?RX_ALLIN_SKIN:RX_ALLIN_HAIR;
  const cap=R.kind==='skin'?Math.min(b!=null?b+100:RX_CAP,RX_ALLIN):(b!=null?b+100:RX_CAP);
  const pkg=(i,mode,lv)=>[...rxSvcLines(R.kind,P[i]),...(lv?rxSvcLines('hair',['Goldwell Leave-In Treatment']):[]),...rxProdLines(rxNeedsFor(needs,P[i]),mode)];
  /* All In (Option 2) never adds extras that take the ticket over $400 (Alexandra, Oct 16 2026): the services her
     budget allows can go higher, but home care and the leave-in only ride along while the total stays at $400 or
     under. Past that, the card says she can ask for more and she decides. */
  const okL=L=>rxTotal(L)<=cap&&(rxTotal(L)<=RX_ALLIN||L.every(l=>l.t==='s'&&l.n!=='Goldwell Leave-In Treatment'));
  /* with more than two home care picks, drop from the end (cream, then cleanser) before going to Try Me bottles */
  const trimN=[];for(let n=needs.length-1;n>=1;n--)trimN.push(n);
  let o2=null,i2=P.length-1,m2=null;
  /* All In keeps the fullest service her budget allows. Home care rides along with it; it's left off only when the
     $400 extras rule blocks it (the card then invites her to ask), otherwise the service steps down to make room. */
  for(let i=0;i<P.length&&!o2;i++){
    for(const [mode,lv] of [['full',leave],...trimN.map(n=>[n,leave]),['first',leave],['try',leave],['try',false]]){const L=pkg(i,mode,lv); if(okL(L)){o2=L;i2=i;m2=[mode,lv];break}}
    if(!o2&&rxTotal(pkg(i,'try',false))>RX_ALLIN){const L=pkg(i,'none',false); if(okL(L)){o2=L;i2=i;m2=['none',false]}} }
  for(let i=0;i<P.length&&!o2;i++){const L=pkg(i,'none',false); if(okL(L)){o2=L;i2=i;m2=['none',false]}}
  if(!o2){o2=pkg(P.length-1,'none',false);m2=['none',false]}
  const more=(m2[0]!=='full'&&rxNeedsFor(needs,P[i2]).length>0)||(leave&&!m2[1]);  /* numeric mode = some picks moved to full sizes */
  /* Option 1 is the lighter one: inside her budget and always below Option 2 */
  /* the budget option keeps full-size home care if any service tier allows it, before trimming to Try Me bottles
     (Alexandra, Oct 16 2026: home care is part of the budget) */
  let o1=null; const lim=Math.min(b!=null?b:Infinity,rxTotal(o2)-1);
  for(const mode of ['full',...trimN,'first','try','none']){ for(let i=Math.min(i2+1,P.length-1);i<P.length&&!o1;i++){
    const L=pkg(i,mode,false); if(rxTotal(L)<=lim) o1=L } if(o1) break }
  if(!o1) o1=pkg(P.length-1,'none',false);
  let [ms,mw,mt]=[o1,o2].some(L=>L.some(l=>RX_BAL.test(l.n)))?RX_BAL_M:g.m;
  /* no cut today: the next visit keeps the cut instead of leaving wet */
  if(ms.includes('Leave Wet (no haircut)')&&![o1,o2].some(L=>L.some(l=>/haircut/i.test(l.n)))){
    ms=ms.map(n=>n==='Leave Wet (no haircut)'?'Female Haircut':n); mt=mt.replace(/ and a glaze\..*$/,', a glaze and a trim.') }
  let mLines=rxSvcLines(R.kind,ms);
  /* Skin on a tight budget (Alexandra, Oct 16 2026): when full-size home care doesn't fit today, she goes home with a
     $50 Biologique Recherche Skin Box (about 4 weeks of product) instead of samples. She comes back in 4 weeks so we
     can see how her skin reacted, for a $99 targeted treatment facial and regular-size home care. */
  if(R.kind==='skin'&&b!=null&&o1.some(l=>l.t==='t')){
    const nw=R.now||[], gl=rxGoalList(R);
    const box=nw.includes('Breakouts')||gl.includes('Clear Breakouts')?'Blemish Skin Box':
      nw.includes('Fine lines')||gl.includes('Anti-Aging (Fine Lines & Firmness)')?'Youth Skin Box':'Standard Skin Box';
    const bx={n:'Biologique Recherche '+box,p:50,t:'p',why:'Lasts for a 4-week skincare routine',full:50};
    o1=[...o1.filter(l=>l.t==='s'),bx];
    if(o2.some(l=>l.t==='t')){const o2b=[...o2.filter(l=>l.t==='s'),bx]; if(rxTotal(o2b)<=cap) o2=o2b}
    const last=P[P.length-1], tgt=last.find(n=>RX_FACIAL.test(n)&&rxRegPrice('skin',n)===99)||'Hydration Boost';
    const hc=needs.length?needs.slice(0,2):['skClean'];  /* next visit: the P50 and serum in full size */
    mLines=[...rxSvcLines('skin',[tgt]),...rxProdLines(hc,'full')];
    mw='4 weeks'; mt='We’ll see how your skin reacted to your Skin Box: a targeted treatment facial, and your home care in full size.' }
  return {opts:[{title:'Option 1',lines:o1},{title:'Option 2',lines:o2}],
    m:{lines:mLines,when:mw,text:mt},refresh:mw,keep:!needs.length,more,rec:rxRecFull(o1,o2,[...rxNeedsFor(needs,P[i2]),...needs])};
}

/* ---- the card in a link: compact JSON → base64url after # ---- */
function rxPack(R,me,day){
  const au=rxAuth();
  const o={v:1,k:R.kind,g:rxFirst(R.guest),s:au?au.slug:undefined,i:R.id||undefined,   /* s + i let her card tell the desk she opened it */a:rxFirst(me),d:day||new Date().toISOString().slice(0,10),b:R.nob?null:(Number(R.budget)||null),
    w:rxGoalList(R).join(', '),n:rxNowAll(R).filter(x=>!/^Nothing new/.test(x)),
    /* home care shows on her card as one "Maintenance" line, the way Alexandra writes cards by hand,
       so she sees the investment, not a list of products to say no to */
    vp:R.vip?1:0,  /* VIP has its own key: it used to be "v" too, which overwrote the card version and broke every non-VIP card */
    o:R.opts.map(x=>{const sv=x.lines.filter(l=>l.t==='s').map(l=>l.reg&&l.reg!==l.p?[l.n,Number(l.p)||0,l.reg]:[l.n,Number(l.p)||0]), hc=x.lines.filter(l=>l.t!=='s').reduce((a,l)=>a+(Number(l.p)||0),0);
      return [x.title,hc?[...sv,[R.kind==='skin'&&hc===RX_SK_LO?'Maintenance: Skin Box, lasts for a 4-week skincare routine':'Maintenance',hc]]:sv]}),   /* the Skin Box says how long it lasts on her card (Alexandra, Oct 20 2026) */
    m:[R.m.lines.map(l=>l.reg&&l.reg!==l.p?[l.n,Number(l.p)||0,l.reg]:[l.n,Number(l.p)||0]),R.m.when,R.m.text],r:R.refresh,x:R.more?1:0,f:(R.rec||[]).map(l=>[l.hint==='p50'?'Your P50, matched to your skin':l.n,Number(l.p)||0]),hs:(R.rec||[]).some(l=>l.hint==='p50')?1:0};
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
  try{const e=JSON.parse(sessionStorage.getItem('rx-edit')||'null');if(e){sessionStorage.removeItem('rx-edit');const c=Date.now()-e.t<30*60000&&rxSaved().find(y=>y.id===e.id);if(c&&e.to==='home'){RX_HOME=c.id;RX_MSG='';RX_SHOW=null;RX_VIEW='home'}else if(c&&c.draft){RX=Object.assign(rxBlank(c.kind),c.draft);rxSave();RX_VIEW='build';RX_SHOW=null}}}catch(e){}
  const R=rxLoad(), me=(S.mine&&(S.mine.name||(S.mine.staff&&S.mine.staff.name)))||'';
  rxSetCut(me); const spNow=rxSetSP();
  const tabs=h('div',{class:'seg',style:'justify-content:center'},
    h('button',{type:'button','aria-pressed':String(RX_VIEW!=='saved'),onclick:()=>{RX_VIEW='build';render()}},'Build A Card'),
    h('button',{type:'button','aria-pressed':String(RX_VIEW==='saved'),onclick:()=>{RX_VIEW='saved';RX_SHOW=null;render()}},'Saved Cards'));
  const head=h('div',{},h('span',{class:'lbl'},'Customer Cards'),h('h1',{style:'font-size:28px'},'RX Consultation Card'),
    h('p',{class:'soft',style:'margin-top:6px'},'For new guests and anyone ready for a big change. Two options for today, home care in both, and what her next visit looks like.'));
  if(RX_VIEW==='home'&&RX_HOME) return [h('div',{class:'hub'},rxTakeHomeView(me))];
  if(RX_VIEW==='saved') return [h('div',{class:'hub'},head,tabs,RX_MSG?h('div',{class:'card2',style:'text-align:center;border-color:var(--ink)'},h('p',{},'✓ '+RX_MSG)):null,rxSavedView(me))];
  if(RX_VIEW==='qr'&&RX_SHOW) return [h('div',{class:'hub'},head,rxQrView(RX_SHOW))];
  /* Start A New One sits at the top, right under the tabs, so a new guest never starts on the last guest's answers (Alexandra, Oct 20 2026) */
  const used=!!(String(R.guest||'').trim()||rxGoalList(R).length||String(R.budget||'').trim()||(R.now||[]).length||Object.keys(R.a||{}).length);
  const fresh=used?h('div',{style:'display:flex;justify-content:center;margin:-4px 0 4px'},h('button',{type:'button',class:'obtn',style:'max-width:320px',
    onclick:()=>{if(!confirm('Start a new card? This clears the one on screen.'))return;RX=rxBlank(R.kind);rxSave();render();window.scrollTo(0,0)}},'Start A New One')):null;
  return [h('div',{class:'hub'},head,tabs,fresh,...rxBuild(R,me))];
}

let RX_HINT='', RX_THQ='';
let RX_DD={card:null,kind:null,open:null};
function rxDDStyle(){if(document.getElementById('rxdd-css'))return;const st=document.createElement('style');st.id='rxdd-css';
  st.textContent=`.rxdd{border-top:1px solid var(--line)}
.rxdd>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:10px 0;min-height:44px;-webkit-tap-highlight-color:transparent}
.rxdd>summary::-webkit-details-marker{display:none}
.rxdd-q{flex:1;min-width:0;display:flex;flex-direction:column;font-size:14px;color:var(--ink)}
.rxdd-q small{font-size:13px;color:var(--kelly,var(--ink))}.rxdd-q small.none{color:var(--muted)}
.rxdd-ok{flex:none;width:22px;height:22px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;font-size:12px;color:#fff}
.rxdd-ok.on{background:var(--kelly,var(--ink));border-color:var(--kelly,var(--ink))}
.rxdd-chev{flex:none;color:var(--muted);transition:transform .2s}.rxdd[open] .rxdd-chev{transform:rotate(180deg)}
.rxdd-list{display:flex;flex-direction:column;padding:0 0 10px 32px}
.rxdd-list label{display:flex;align-items:center;gap:12px;padding:8px 0;font-size:14.5px;cursor:pointer;color:var(--ink)}
.rxdd-list input{appearance:none;-webkit-appearance:none;width:20px;height:20px;margin:0;flex:none;border:1px solid var(--kelly,var(--ink));border-radius:4px;background:#fff;display:grid;place-items:center}
.rxdd-list input[type=radio]{border-radius:50%}
.rxdd-list input:checked{background:var(--kelly,var(--ink))}.rxdd-list input:checked::after{content:"✓";color:#fff;font-size:12px;line-height:1}
@media (prefers-reduced-motion:reduce){.rxdd-chev{transition:none}}`;document.head.append(st)}
function rxBuild(R,me){
  const spNow=rxSetSP();   /* her single process price; rxView sets it too, but this function needs its own copy */
  /* every word starts with a capital, "or" stays lowercase (Alexandra, Oct 15 2026); the saved answers keep their spelling */
  const rxTitle=o=>String(o).replace(/(^|[\s(\-])([a-z])/g,(m,p,c)=>p+c.toUpperCase()).replace(/ Or /g,' or ');
  const chips=(opts,isOn,onTap)=>h('div',{class:'seg'},opts.map(o=>h('button',{type:'button','aria-pressed':String(!!isOn(o)),onclick:()=>{onTap(o);rxSave();render()}},rxTitle(o))));
  const kindRow=h('div',{class:'fld'},'Card For',chips(['Hair','Skin'],o=>R.kind===o.toLowerCase(),o=>{const k=o.toLowerCase();if(k!==R.kind){RX=Object.assign(rxBlank(k),{guest:R.guest,budget:R.budget,nob:R.nob})}}));
  const gIn=h('input',{type:'text',value:R.guest,placeholder:'First name and last initial',autocomplete:'off',autocapitalize:'words'});
  gIn.addEventListener('input',()=>{R.guest=gIn.value;rxSave()});
  const bIn=h('input',{type:'number',inputmode:'decimal',min:'0',step:'5',value:R.budget,placeholder:'$'});
  bIn.addEventListener('input',()=>{const was=Number(R.budget)>0;R.budget=bIn.value;rxSave();if(was!==(Number(R.budget)>0)){render();const n=document.querySelector('.card2 input[type=number]');if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length)}catch(e){}}}});
  RX_VIPON=!!R.vip; RX_RATE=(typeof S!=='undefined'&&S&&S.mine&&Number(S.mine.rate))||45;
  /* family on VIP pricing (Alexandra, Oct 16 2026): options are priced from the VIP list; her card shows the regular price crossed out */
  const vipRow=h('div',{class:'fld'},'Pricing',chips(['Regular','VIP (family)'],o=>(o==='Regular')!==!!R.vip,o=>{const v=o!=='Regular';if(v!==!!R.vip){R.vip=v;R.opts=null;R.m=null}}));
  const spRow=R.kind==='hair'?h('div',{class:'fld'},'Your Single Process Price',chips(RX_SP.map(p=>'$'+p),o=>o==='$'+spNow,o=>{if(o!=='$'+spNow){store.set(rxSpKey(),o.slice(1));R.opts=null;R.m=null}})):null;
  const s1=h('section',{class:'card2'},h('span',{class:'lbl'},'1 · Your Guest'),kindRow,vipRow,spRow,
    h('label',{class:'fld'},'Guest’s First Name & Last Initial',gIn),
    /* skin: the kind of visit comes before her budget (Alexandra, Oct 20 2026): a relaxing 60-minute facial, or results
       first where time doesn't matter (then the $99 targeted treatment makes sense on a budget) */
    R.kind==='skin'?h('div',{class:'fld'},'What Kind Of Visit Is She Hoping For?',chips(['Relaxing 60 min & solve a skin problem','Results first, time doesn’t matter'],o=>R.visit===(/^Relaxing/.test(o)?'relax':'results'),o=>{const v=/^Relaxing/.test(o)?'relax':'results';if(v!==R.visit){R.visit=v;R.opts=null;R.m=null}})):null,
    h('label',{class:'fld'},h('span',{},'Her All In Cost For Today’s Visit'),bIn));
  /* Each question is one dropdown row that shows what's picked; tap it to open a checklist (Alexandra, Oct 16 2026).
     Answering a one-answer question closes it and opens the next unanswered one, so nothing gets skipped; a pick-all
     question stays open until she taps it closed, then the next one opens. Same colors as the rest of the app. */
  rxDDStyle(); R.nob=false;
  const sk=R.kind==='skin', IDK='I don’t know';
  const routine=RX_Q[R.kind].map(([key,q,opts,multi])=>({key,q,opts:[IDK,...opts],multi:!!multi,
    get:()=>[].concat(R.a[key]||[]).filter(Boolean),
    tap:o=>{if(multi){let a=[].concat(R.a[key]||[]);const i=a.indexOf(o);if(i<0)a=o===IDK?[IDK]:[...a.filter(x=>x!==IDK),o];else a.splice(i,1);R.a[key]=a}else R.a[key]=R.a[key]===o?'':o}}));
  const goalQ={key:'goal',q:'Today’s Goals',opts:Object.keys(RX_GOAL[R.kind]),multi:true,get:()=>rxGoalList(R),
    tap:o=>{const L=rxGoalList(R);R.goal=L.includes(o)?L.filter(x=>x!==o):[...L,o]}};
  const nowQ={key:'now',q:sk?'What is her skin going through right now, this season?':'Scalp Condition',
    opts:RX_NOW[R.kind],multi:true,get:()=>R.now,tap:o=>{const i=R.now.indexOf(o);i<0?R.now.push(o):R.now.splice(i,1)}};
  /* skin, right after what her skin is going through: known allergies, yes or no (Alexandra, Oct 20 2026) */
  const allergyQ={key:'allergy',q:'Does she have any known allergies to skincare products we should be aware of?',opts:['Yes','No'],multi:false,
    get:()=>[].concat(R.a.allergy||[]).filter(Boolean),tap:o=>{R.a.allergy=R.a.allergy===o?'':o}};
  const order=[goalQ,...(sk?[nowQ,allergyQ,...routine]:[...routine,nowQ])];
  const nextOpen=after=>{const i=order.findIndex(x=>x.key===after);const L=[...order.slice(i+1),...order.slice(0,Math.max(i,0))];const n=L.find(x=>!x.get().length);return n?n.key:null};
  if(RX_DD.card!==R||RX_DD.kind!==R.kind){RX_DD={card:R,kind:R.kind,open:(order.find(x=>!x.get().length)||{}).key||null}}
  const dd=x=>{const sel=x.get(), isOpen=RX_DD.open===x.key, unsure=sel.includes(IDK);
    const sum=h('summary',{onclick:e=>{e.preventDefault();RX_DD.open=isOpen?(x.multi?nextOpen(x.key):null):x.key;render()}},
      h('span',{class:'rxdd-ok'+(sel.length?' on':''),'aria-hidden':'true'},sel.length?'✓':''),
      h('span',{class:'rxdd-q'},h('span',{},x.q),h('small',{class:sel.length?'':'none'},sel.length?sel.map(rxTitle).join(', '):'Not answered yet')),
      h('span',{class:'rxdd-chev','aria-hidden':'true'},'⌄'));
    const list=h('div',{class:'rxdd-list'},x.opts.map((o,i)=>{const id='rxdd_'+x.key+'_'+i;
      const inp=h('input',{type:x.multi?'checkbox':'radio',name:'rxdd_'+x.key,id});inp.checked=sel.includes(o);
      inp.addEventListener('change',()=>{x.tap(o);if(!x.multi&&x.get().length)RX_DD.open=nextOpen(x.key);rxSave();render()});
      return h('label',{for:id},inp,h('span',{},rxTitle(o)))}),
      x.multi?h('small',{class:'soft'},'Check all that fit, then tap the question to close it.'):null);
    const d=h('details',{class:'rxdd'},sum,list); if(isOpen) d.open=true;
    return h('div',{},d,unsure?h('small',{class:'rxfind'},'Is it that she didn’t tell you, or did you not remember to ask? You need to know this, so please ask her and come back with the right answer.'):null)};
  s1.append(dd(goalQ));
  /* skin: Her Skin Instant comes right after the guest, then her routine (Alexandra, Oct 16 2026) */
  /* every question starts with "I don't know" (what the girls say); tapping it tells her to go ask (Alexandra, Oct 15 2026) */
  const s2=h('section',{class:'card2'},h('span',{class:'lbl'},(sk?'3':'2')+' · Her Routine'),...routine.map(dd));
  const s3=h('section',{class:'card2'},h('span',{class:'lbl'},sk?'2 · Her Skin Instant':'3 · Right Now'),dd(nowQ),
    sk?dd(allergyQ):null,sk&&R.a.allergy==='Yes'?h('small',{class:'rxfind'},'Ask what she’s allergic to, and check every product before you suggest it.'):null);
  const done=order.filter(x=>x.get().length).length;
  /* no options until a budget is typed in (Alexandra, Oct 16 2026): "No set budget" is gone */
  const ready=rxGoalList(R).length&&Number(R.budget)>0&&R.now.length;
  /* the button always answers (Alexandra, Oct 20 2026): with something missing it opens that question instead of doing nothing */
  const missing=()=>{
    if(!(Number(R.budget)>0)){const n=document.querySelector('.card2 input[type=number]');if(n){n.scrollIntoView({behavior:'smooth',block:'center'});n.focus()}RX_HINT='Type her budget first.';return}
    RX_DD.open=!rxGoalList(R).length?'goal':'now';RX_HINT=!rxGoalList(R).length?'Pick today’s goals first.':(sk?'Answer Her Skin Instant first.':'Answer Scalp Condition first.');render();
    setTimeout(()=>{const d=document.querySelector('details.rxdd[open]');if(d)d.scrollIntoView({behavior:'smooth',block:'center'})},60)};
  const gen=h('button',{type:'button',class:'obtn',style:ready?null:'opacity:.55',onclick:()=>{if(!ready){missing();return}RX_HINT='';const g=rxGenerate(R);if(!g)return;Object.assign(R,g);rxSave();render();setTimeout(()=>{const n=document.getElementById('rxopts');if(n)n.scrollIntoView({behavior:'smooth'})},50)}},R.opts?'Suggest Again':'Suggest Options');
  const s4=h('section',{class:'card2',style:'align-items:center;text-align:center'},gen,
    h('small',{class:'soft'},done+' of '+order.length+' questions answered'),
    !ready&&RX_HINT?h('small',{style:'color:#8b3a2b;font-weight:600'},RX_HINT):null,
    h('small',{class:'soft'},ready?'Suggestions follow the Taffeta consultation: only what she needs, inside her budget.':(Number(R.budget)>0?'Pick her goals and what’s going on right now.':'Type her budget first. Options only show once there’s a budget.')));
  const out=[s1,...(sk?[s3,s2]:[s2,s3]),s4];
  if(R.opts) out.push(...rxEditor(R,me));
  return out;
}

/* Categories for the editor's Add picker (Alexandra, Oct 20 2026) */
const RX_ADDCAT=new WeakMap(), RX_ADDOPEN=new WeakSet();
function rxSvcCats(kind,svc){
  const groups=kind==='skin'?[['Facials',/Facial|Lift & Remodel|Cure All|Microdermabrasion/],['Targeted Treatments',/Express|Boost|Mini|Reversal/],['Add-Ons',/Dermaplaning|^Masque: /],['Brows & Wax',/Brow|Wax/]]
    :[['Cuts & Styling',/Haircut|Leave Wet|Blow|Formal/],['Color',/Single Process|Shadow Root|Glaze|Additional Mix|Base Lightener/],['Foils & Balayage',/Foil|Highlight|Balayage/],['Treatments',/K18|Goldwell|Wave/]];
  const out=groups.map(([c,re])=>['Services · '+c,svc.filter(([n])=>re.test(n)&&(c==='Add-Ons'||!n.startsWith(RX_MQ)))]);
  const left=svc.filter(([n])=>!groups.some(([,re])=>re.test(n))); if(left.length) out.push(['Services · Other',left]);
  return out.filter(c=>c[1].length);
}
function rxProdCats(kind,plist){
  const groups=kind!=='skin'?[['Scalp Care',/Scalp/],['Shampoos',/Shampoo|Wash|Cleanse/],['Conditioners',/Conditioner|Condtion|Cond\b/],['Masks & Treatments',/Mask|Masque|Treatment|Leave-In|Leave In|Repair|Night Cr/i],
    ['Heat Protection',/Heat|Protect|Shield|D.Or|Defense/i],['Oils & Serums',/Oil|Serum|Drops/],
    ['Creams, Mousse & Volume',/Mousse|Cream|Crème|Creme|Balm|Gel|Foam|Primer|Lotion|Blowout|Butter|Styler|Volume|Textur|Wand|Après|Apres/i],
    ['Sprays & Finishing',/Hairspray|Spray|Gloss|Shine|Polish|Wax|Pomade|Paste|Powder|Dust|Finish/i],
    ['Tools, Sets & Extras',/Brush|Dryer|Iron|Straightener|Curl|Smooth X|T3|Showerhead|Filter|Pillowcase|Clip|Set|Ties|Kit|Parfum|Collection|Holiday/i]]:[['Skin Boxes',/Skin Box/],['Cleansers',/Lait|Démaquillante|Micellaire|Cleans/i],['P50 & Lotions',/Lotion|Eauxyg/],['Eye Care',/Contour des Yeux|Eye|Patch/i],['Masks',/Masque|Mask/],
    ['Serums',/Sérum|Serum|Fluide|Amniotique|Collag|Élastine|Placenta|Tensil|Oligo|Dermopore|Silk Plus|Iribiol|Tissulaires|Colostrum|Spectral/],['Moisturizers',/Crème|Émulsion|Cream/]];
  const used=new Set(), out=groups.map(([c,re])=>{const P=plist.filter(([n])=>!used.has(n)&&re.test(n)&&!(c==='Serums'&&/Crème/.test(n)));P.forEach(([n])=>used.add(n));return [c,P]});
  const left=plist.filter(([n])=>!used.has(n)); if(left.length) out.push(['Other',left]);
  return out.filter(c=>c[1].length);
}
function rxEditor(R,me){
  const b=R.nob?null:Number(R.budget)||null;
  const favs=rxFavs(), plist=RX_PRICES[R.kind];
  const lineRow=(L,l)=>{
    const p=h('input',{type:'number',inputmode:'decimal',min:'0',value:String(l.p),class:'rxp','aria-label':'Price for '+l.n});
    p.addEventListener('change',()=>{l.p=Number(p.value)||0;rxSave();render()});
    return h('div',{class:'rxl'},
      h('div',{class:'rxn'},h('b',{},l.t==='t'?'Try Me: '+l.n:l.t==='h'?'Home Care Budget':l.n),l.t==='s'&&l.reg&&l.reg!==l.p?h('small',{class:'soft'},'VIP · regular ',h('s',{},rxMoney(l.reg))):null,l.t==='s'?null:h('small',{class:'soft'},l.t==='t'?'1 oz Try Me bottle':l.t==='h'?'She agrees to this at the consult; you pick what she takes home at the end.'+(l.why?' '+l.why+'.':''):'Maintenance'+(l.why?' · '+l.why:''))),
      l.t==='s'||l.t==='h'||(R.kind==='skin'&&l.t!=='t')?null:h('button',{type:'button',class:'tab rxtry',onclick:()=>{if(l.t==='t'){l.t='p';l.p=l.full||(RX_PRICES[R.kind].find(x=>x[0]===l.n)||[0,l.p])[1]}else{l.full=l.full||l.p;l.t='t';l.p=RX_TRY}rxSave();render()}},l.t==='t'?'Full Size':'Try Me '+rxMoney(RX_TRY)),
      p,h('button',{type:'button',class:'rgx','aria-label':'Remove '+l.n,onclick:()=>{L.splice(L.indexOf(l),1);rxSave();render()}},'×'));
  };
  /* Add a line in two steps, a category and then what's in it, so it's never one long list (Alexandra, Oct 20 2026) */
  const adder=L=>{
    const opt=([n,p])=>h('option',{value:n},n+' · '+rxMoney(p));
    const svc=RX_SVC[R.kind].filter(([n])=>!(n==='Glaze'&&L.some(l=>RX_BAL.test(l.n))));
    const cats=[];
    /* the $25 BR Bottle sits first on skin cards (Alexandra, Oct 24 2026) */
    if(R.kind==='skin') cats.push([RX_BRB_N+' · $25',[['__brb',RX_BRB]]]);
    if(favs.length) cats.push(['My Go-Tos',plist.filter(x=>favs.includes(x[0]))]);
    rxSvcCats(R.kind,svc).forEach(c=>cats.push(c));
    rxProdCats(R.kind,plist).forEach(([c,P])=>cats.push(['Maintenance · '+c,P]));
    /* skin has no Try Me bottles: its version is the $25 take-home size (Alexandra, Oct 20 2026) */
    if(R.kind!=='skin') cats.push(['Try Me Bottle',[['__try',RX_TRY]]]);
    const cur=RX_ADDCAT.get(L), cat=h('select',{'aria-label':'Category'},h('option',{value:''},'Pick A Category'),cats.map(([c,P])=>h('option',Object.assign({value:c},c===cur?{selected:''}:{}),c+' ('+P.length+')')));
    const items=(cats.find(c=>c[0]===cur)||[])[1];
    const sel=h('select',Object.assign({'aria-label':'Add a service or product'},items?{}:{disabled:''}),h('option',{value:''},'Then Pick One'),items?items.map(([n,p])=>n==='__try'?h('option',{value:n},'Try Me bottle · '+rxMoney(p)):n==='__brb'?h('option',{value:n},RX_BRB_N+' (pick the BR product) · '+rxMoney(p)):opt([n,p])):null);
    cat.addEventListener('change',()=>{RX_ADDCAT.set(L,cat.value);render()});
    sel.addEventListener('change',()=>{const n=sel.value;if(!n)return;RX_ADDCAT.delete(L);RX_ADDOPEN.delete(L);if(n==='__brb'){const w=rxBrbAsk();if(w)L.push({n:w,p:RX_BRB,t:'p',full:RX_BRB});rxSave();render();return}if(n==='__try'){const what=prompt('Which product goes in the Try Me bottle?');if(what)L.push({n:what.trim(),p:RX_TRY,t:'t'});rxSave();render();return}
      const sv=RX_SVC[R.kind].find(x=>x[0]===n);const pr=plist.find(x=>x[0]===n);const ex=Object.values(RX_PROD).find(x=>x[0]===n);
      L.push(sv?(()=>{const p=rxPrice(R.kind,n),reg=sv[1];return reg!==p?{n,p,t:'s',reg}:{n,p,t:'s'}})():{n,p:pr[1],t:'p',why:ex?ex[2]:'',full:pr[1]});rxSave();render()});
    /* folded under "Add A Service Or Product +" so the two pickers don't read as part of the card (Alexandra, Oct 20 2026) */
    const d=h('details',Object.assign({class:'rxaddd'},RX_ADDOPEN.has(L)||cur?{open:''}:{}),h('summary',{},h('span',{},'Add A Service Or Product'),h('span',{class:'pm','aria-hidden':'true'})),
      h('div',{class:'rxadd'},h('label',{class:'fld'},cat),h('label',{class:'fld'},sel)));
    d.addEventListener('toggle',()=>{if(d.open)RX_ADDOPEN.add(L);else{RX_ADDOPEN.delete(L);RX_ADDCAT.delete(L)}});
    return d};
  const badge=t=>b==null?null:h('span',{class:'rxbadge '+(t<=b?'ok':'over')},t<=b?rxMoney(b-t)+' under budget':rxMoney(t-b)+' over budget');
  /* the same names her card shows: the higher total is All In, the other Worth The Wait, none when they tie (Alexandra, Oct 20 2026) */
  const tots=R.opts.map(o=>rxTotal(o.lines)), hiI=tots.length===2&&tots[0]!==tots[1]?tots.indexOf(Math.max(...tots)):-1;
  const opts=R.opts.map((o,i)=>{const t=tots[i];
    return h('section',{class:'card2 out'},h('span',{class:'lbl'},o.title+(hiI<0?'':i===hiI?' · All In':' · Worth The Wait')),
      ...o.lines.map(l=>lineRow(o.lines,l)),
      !o.lines.some(l=>l.t!=='s')?h('p',{class:'soft'},'Maintenance: keep her current routine.'):null,
      i===1&&R.more?h('small',{class:'soft'},'Kept at '+rxMoney(R.kind==='skin'?RX_ALLIN_SKIN:RX_ALLIN_HAIR)+' or under: home care is trimmed to Try Me bottles or left off. The full sizes she should end up with show below the options.'):null,
      o.lines.some(l=>l.n==='K18 Bond Protection')?h('small',{class:'soft'},'K18 goes on before the lightener ($25 to $50 by amount used). Finish with one pump of K18 leave-in.'):null,
      o.lines.some(l=>l.t!=='s'&&l.t!=='h')?h('small',{class:'soft'},'Home care is estimated from her answers. Swap in what she’s really taking home once you know.'):null,
      o.lines.some(l=>l.t!=='s')?h('small',{class:'soft'},'Her card shows these as one line: Maintenance '+rxMoney(o.lines.filter(l=>l.t!=='s').reduce((a,l)=>a+(Number(l.p)||0),0))+'.'):null,
      adder(o.lines),
      h('div',{class:'rxtot'},badge(t),h('b',{},rxMoney(t))));
  });
  const mw=h('input',{type:'text',value:R.m.when}); mw.addEventListener('input',()=>{R.m.when=mw.value;rxSave()});
  const mt=h('textarea',{class:'rgta',rows:'2'}); mt.value=R.m.text; mt.addEventListener('input',()=>{R.m.text=mt.value;rxSave()});
  const rf=h('input',{type:'text',value:R.refresh}); rf.addEventListener('input',()=>{R.refresh=rf.value;rxSave()});
  const maint=h('section',{class:'card2'},h('span',{class:'lbl'},'Her Next Visit'),
    ...R.m.lines.map(l=>lineRow(R.m.lines,l)),adder(R.m.lines),
    h('div',{class:'rxtot'},h('span',{class:'soft'},'Next Visit'),h('b',{},rxMoney(rxTotal(R.m.lines)))),
    h('label',{class:'fld'},'In About',mw),h('label',{class:'fld'},'What It Looks Like ',h('small',{class:'soft'},'(optional note)'),mt)); /* no Refresh In: it repeated In About (Alexandra, Oct 20 2026) */
  /* Pro Notes (Alexandra, Oct 24 2026): only the team sees these. They're saved with the card in Saved Cards, never on her card or QR. */
  const pn=h('textarea',{class:'rgta',rows:'3',placeholder:'Formulas, what she liked, what to watch for next time'}); pn.value=R.pro||''; pn.addEventListener('input',()=>{R.pro=pn.value;rxSave()});
  const pro=h('section',{class:'card2'},h('span',{class:'lbl'},'Pro Notes'),h('small',{class:'soft'},'Only the team sees these. They’re saved with her card in Saved Cards and never show on her card.'),h('label',{class:'fld'},pn));
  const save=h('button',{type:'button',class:'obtn',onclick:()=>rxStore(R,me)},'Save & Send To Desk');
  const done=h('section',{class:'card2',style:'align-items:center;text-align:center'},save,
    h('small',{class:'soft'},'Her card goes to the front desk and her QR shows here. She scans it with her camera; if she doesn’t, the desk texts it to her.'));
  /* full sizes she should end up with, outside the budget (Alexandra, Oct 16 2026) */
  const hs=(R.rec||[]).some(l=>l.hint==='p50');
  const rec=(R.rec&&R.rec.length)?h('section',{class:'card2'},h('span',{class:'lbl'},hs?'Highly Suggested: Add Her P50':'Full Sizes To Go Home With'),
    h('small',{class:'soft'},hs?'Shows under All In on her card. Not in the totals: offer it on top of her cleanser.':'Not in her budget or totals. She starts with '+(R.kind==='skin'?'her samples':'the Try Me')+' today; these are what she should take home when she’s ready.'),
    ...R.rec.map(l=>h('div',{style:'display:flex;justify-content:space-between;gap:12px;font-size:14px'},h('span',{},l.n),h('span',{},rxMoney(l.p))))):null;
  /* specialty suggestion (Carolyn's Nano Needling): one tap swaps it in as All In's facial; she can still edit it after */
  const all2=R.opts&&R.opts[1], hasSpec=R.spec&&all2&&!all2.lines.some(l=>l.n===R.spec.n);
  const spec=hasSpec?h('section',{class:'card2'},h('span',{class:'lbl'},'Specialty Suggestion'),
    h('div',{style:'display:flex;justify-content:space-between;gap:12px;font-size:15px'},h('b',{},R.spec.n),h('span',{},rxMoney(R.spec.p))),
    h('small',{class:'soft'},R.spec.why),
    h('button',{type:'button',class:'tab',onclick:()=>{all2.lines=[...rxSvcLines('skin',[R.spec.n]),...all2.lines.filter(l=>l.t!=='s')];rxSave();render()}},'Use It In All In')):null;
  const wrap=h('div',{id:'rxopts',style:'display:flex;flex-direction:column;gap:26px'},...opts,spec,rec,maint,pro,done);
  return [wrap];
}

async function rxStore(R,me){
  if(!R.guest.trim()){alert('Add her first name and last initial first.');return}
  if(R.guest.trim().split(/\s+/).length<2){alert('Add her last initial too, like “Danielle M.”');return}
  const id=R.id||String(Date.now()); R.id=id;
  const link=await rxLink(R,me), list=rxSaved();
  /* Save & Send To Desk (Alexandra, Oct 17 2026): she scans the QR here; if she doesn't open it, the desk texts it */
  const row={id,guest:rxGuestName(R.guest),date:new Date().toISOString().slice(0,10),kind:R.kind,budget:R.nob?null:Number(R.budget)||null,
    totals:R.opts.map(o=>rxTotal(o.lines)),link,desk:true,draft:JSON.parse(JSON.stringify(R))};
  const i=list.findIndex(x=>x.id===id); i<0?list.unshift(row):list.splice(i,1,row);
  store.set(rxSavedKey(),JSON.stringify(list.slice(0,300)));
  rxSync({cards:[row]}).then(ok=>{if(ok){row.up=1;const L=rxSaved(),j=L.findIndex(x=>x.id===id);if(j>=0){L[j].up=1;store.set(rxSavedKey(),JSON.stringify(L))}}});
  /* the builder clears once she's sent to the desk, so the next guest starts on a blank card; this card stays in Saved Cards (Edit reopens it) (Alexandra, Oct 19 2026) */
  RX=rxBlank(R.kind); rxSave(); RX_SHOW={link,guest:row.guest,id}; RX_VIEW='qr'; render(); window.scrollTo(0,0);
}

/* a saved card's QR is rebuilt from its draft, so cards saved before a change (like home care showing as one
   Maintenance line) open the current way; keeps the day it was made */
async function rxRelink(x,me){
  const d=x.draft;
  if(!d||!Array.isArray(d.opts)||!d.m||!d.opts.every(o=>(o.lines||[]).every(l=>l&&l.t))) return x.link;
  try{return await rxLink(Object.assign(rxBlank(d.kind),d),me,x.date)}catch(e){return x.link}
}
/* She chose an option (Alexandra, Oct 22 2026): a home care card for that option's budget waits, unfinished, in the
   artist's Saved Cards and on the front desk's Home Care list. At the end of the service the artist plugs in the exact
   products and saves; that replaces the draft and the desk texts her the PDF. */
const rxOptNames=x=>{const o=(x.draft&&x.draft.opts)||[], t=o.map(q=>rxTotal(q.lines)), hi=t.length===2&&t[0]!==t[1]?t.indexOf(Math.max(...t)):1;return o.map((q,i)=>i===hi?'All In':'Worth The Wait')};
const rxHcBudget=(x,i)=>{const o=((x.draft&&x.draft.opts)||[])[i];return o?rxTotal(o.lines.filter(l=>l.t!=='s')):0};
async function rxDraftHome(x){
  const st=(S.mine&&S.mine.staff)||{}, me=(S.mine&&(S.mine.name||st.name))||'';
  if(!window.TAFFETA_ENDPOINT||!(st.t||st.tk)) return false;
  const i=x.chosen, nm=rxOptNames(x)[i]||'', b=rxHcBudget(x,i), d=x.draft||{};
  const data={guest:x.guest,services:[],type:'',picks:[],notes:[],own:'',next:(d.m&&d.m.when)||'',nextDate:'',msg:'',rid:x.id,
    plan:'She chose '+nm+(b?': '+rxMoney(b)+' of home care':'')};
  try{const r=await fetch(window.TAFFETA_ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({type:'regimen',draft:true,slug:st.slug,t:st.t,tk:st.tk,artist:me,guest:x.guest,kind:x.kind==='skin'?'skin':'hair',data})});
    const j=await r.json(); return !!j.ok}catch(e){return false}
}
function rxChoose(x,i,toast){
  const L=rxSaved(), k=L.findIndex(r=>r.id===x.id); if(k<0) return;
  L[k].chosen=i; L[k].home=null; store.set(rxSavedKey(),JSON.stringify(L));
  toast.textContent='Saving…';
  rxDraftHome(L[k]).then(ok=>{RX_CHOSE_MSG=ok?'Her home care card is waiting in your Saved Cards and at the front desk. Review it when she’s getting dressed.':'Saved on this device. The desk copy didn’t go through, so check the Wi-Fi and tap her option again.';render()});
}
let RX_CHOSE_MSG='';
function rxQrView(x){
  /* the team mostly shows or talks her through the card, so the QR folds under "Client QR Code +" and the next steps
     are the main part of the screen (Alexandra, Oct 20 2026) */
  const qr=h('details',{class:'rxqrd'},h('summary',{},h('span',{},'Client QR Code'),h('span',{class:'pm','aria-hidden':'true'})),
    h('div',{class:'rxqrb'},rxQR(x.link),h('p',{class:'rxscript'},'Scan With Your Camera'),
      h('small',{class:'soft'},'It opens her options and what her next visit looks like on her own phone.')));
  return h('section',{class:'card2 out',style:'align-items:center;text-align:center'},
    h('h2',{},rxGuestName(x.guest)+'’s RX card'),
    h('small',{class:'soft'},'Saved and sent to the front desk. If she doesn’t open it, the desk texts it to her.'),
    (()=>{const sv=rxSaved().find(r=>r.id===x.id); if(!sv||!sv.draft||!(sv.draft.opts||[]).length) return null;
      const nm=rxOptNames(sv), t=h('small',{class:'soft'},RX_CHOSE_MSG);
      return h('div',{class:'rxchose'},h('span',{class:'lbl'},'Which option did she choose?'),
        h('div',{class:'rxqrow'},nm.map((n,i)=>h('button',{type:'button',class:'obtn'+(sv.chosen===i?' on':''),'aria-pressed':String(sv.chosen===i),onclick:()=>{RX_CHOSE_MSG='';rxChoose(sv,i,t)}},(sv.chosen===i?'✓ ':'')+n+' · '+rxMoney(rxTotal(sv.draft.opts[i].lines))))),t)})(),
    /* one flow (Alexandra, Oct 20 2026): straight to what she takes home; she can come back and change it at the end */
    x.id&&typeof rgSave2==='function'?h('button',{type:'button',class:'obtn rxqbig',onclick:()=>{RX_HOME=x.id;RX_MSG='';RX_SHOW=null;RX_VIEW='home';render();window.scrollTo(0,0)}},'Next: What She Takes Home'):null,
    h('div',{class:'rxqrow'},
      /* same tab, so Go Back To Edit on her card comes back here with this card open to edit (Alexandra, Oct 20 2026) */
      h('button',{type:'button',class:'obtn',onclick:()=>rxCardOverlay(x)},'Open Her Card'),
      x.id?h('button',{type:'button',class:'obtn',onclick:()=>rxEditSaved(x.id)},'Edit Her Card'):null),
    qr,
    h('button',{type:'button',class:'tab',onclick:()=>{RX_VIEW='build';RX_SHOW=null;render()}},'Done'));
}
/* coming back from her card with the Back button (the page may be restored as it was): open the card to edit */
window.addEventListener('pageshow',e=>{try{if(e.persisted&&sessionStorage.getItem('rx-edit')&&typeof render==='function')render()}catch(_){}});
/* Her card opens on top of the app instead of leaving it, so the artist stays signed in, with Go Back To Edit and
   What She Takes Home right there (Alexandra, Oct 20 2026) */
function rxCardOverlay(x){
  const old=document.getElementById('rxov'); if(old) old.remove();
  const close=()=>{ov.remove();document.documentElement.style.overflow=''};
  const B='padding:10px 16px;border:1px solid #121212;border-radius:999px;background:#fff;color:#121212;font:inherit;font-size:11px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;white-space:nowrap';
  const bar=h('div',{style:'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:10px 12px calc(10px + env(safe-area-inset-top,0px));padding-top:calc(10px + env(safe-area-inset-top,0px));background:#f8f6f0;border-bottom:1px solid #dcd6cb'},
    h('button',{type:'button',style:B,onclick:()=>{close();if(x.id)rxEditSaved(x.id)}},'‹ Go Back To Edit'),
    x.id&&typeof rgSave2==='function'?h('button',{type:'button',style:B,onclick:()=>{close();RX_HOME=x.id;RX_MSG='';RX_SHOW=null;RX_VIEW='home';render();window.scrollTo(0,0)}},'What She Takes Home'):null,
    h('button',{type:'button',style:B,'aria-label':'Close',onclick:close},'×'));
  const fr=h('iframe',{src:x.link.replace('/rx/#','/rx/?p=2#'),title:'Her RX card',style:'flex:1;width:100%;border:0;background:#fff'});
  const ov=h('div',{id:'rxov',style:'position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;background:#fff'},bar,fr);
  document.body.append(ov); document.documentElement.style.overflow='hidden';
}
function rxEditSaved(id){
  const c=rxSaved().find(y=>y.id===id); if(!c||!c.draft) return false;
  RX=Object.assign(rxBlank(c.kind),c.draft); rxSave(); RX_VIEW='build'; RX_SHOW=null; render(); window.scrollTo(0,0); return true;
}

function rxSavedView(me){
  const list=rxSaved(), q=RX_FIND.trim().toLowerCase();
  const s=h('input',{type:'search',id:'rxfind',value:RX_FIND,placeholder:'Search by guest’s name',autocomplete:'off'});
  s.addEventListener('input',()=>{RX_FIND=s.value;const pos=s.selectionStart;render();const n=document.getElementById('rxfind');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
  const hits=q?list.filter(x=>x.guest.toLowerCase().includes(q)):[];
  const fin=list.filter(x=>x.chosen!=null&&!x.sent).slice(0,12);
  return h('section',{class:'card2'},
    fin.length?h('div',{class:'rxfin'},h('span',{class:'lbl'},'Home Care To Review'),...fin.map(x=>h('div',{class:'rxl'},
      h('div',{class:'rxn'},h('b',{},x.guest),h('small',{class:'soft'},'She chose '+(rxOptNames(x)[x.chosen]||'')+(rxHcBudget(x,x.chosen)?' · '+rxMoney(rxHcBudget(x,x.chosen))+' of home care':''))),
      h('button',{type:'button',class:'obtn',onclick:()=>{RX_HOME=x.id;RX_MSG='';RX_VIEW='home';render();window.scrollTo(0,0)}},'Review')))):null,
    h('label',{class:'fld'},s),
    !list.length?h('p',{class:'soft'},'Cards you save show up here. Search by her name.'):null,
    q&&!hits.length?h('p',{class:'soft'},'No saved card for “'+RX_FIND+'”.'):null,
    ...hits.slice(0,20).map(x=>h('div',{class:'rxl'},
      h('div',{class:'rxn'},h('b',{},x.guest),h('small',{class:'soft'},(x.kind==='skin'?'Skin':'Hair')+' · '+new Date(x.date+'T12:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+(x.budget?' · budget '+rxMoney(x.budget):'')+' · '+x.totals.map(rxMoney).join(' / ')),x.draft&&String(x.draft.pro||'').trim()?h('small',{class:'rxpro'},'Pro Notes: '+String(x.draft.pro).trim()):null),
      h('button',{type:'button',class:'tab',onclick:async()=>{RX_SHOW={link:await rxRelink(x,me),guest:x.guest,id:x.id};RX_VIEW='qr';render();window.scrollTo(0,0)}},'QR'),
      h('button',{type:'button',class:'tab',onclick:()=>{RX=Object.assign(rxBlank(x.kind),x.draft);rxSave();RX_VIEW='build';render();window.scrollTo(0,0)}},'Edit'),
      x.draft&&x.draft.opts&&typeof rgSave2==='function'?h('button',{type:'button',class:'tab',onclick:()=>{RX_HOME=x.id;RX_MSG='';RX_VIEW='home';render();window.scrollTo(0,0)}},'Takes Home'):null)));
}

/* What She Takes Home (Alexandra, Oct 17 2026): at the end of the appointment the artist fills the home care budget the
   guest agreed to at her consult. Her starred go-tos come first, then the products the consult rules matched to what
   she said. Going over just warns ("let her know before ringing up"). Save & Send To Desk puts her Home Care PDF on
   the front desk app's Home Care list, and the desk texts it to her. */
/* How to use it at home, by type of product, not by name (Alexandra, Oct 20 2026). Face and neck only, the way Carolyn teaches it. */
/* generic directions by product type, in Carolyn's own words (Alexandra, Oct 14 2026). A product with its own
   directions in the take-home builder (g/regimen.js) uses those instead. Face and neck only. */
function rxHowTo(n){n=String(n||'');
  /* Taffeta BR Bottle: a sample, so 1–2 drops (Alexandra, Oct 20 2026) */
  if(n.startsWith(RX_BRB_N+': ')){const b=n.slice(RX_BRB_N.length+2);return (rxHowTo(/Sérum|Serum|Collag/i.test(b)?'Sérum '+b:b)||rxHowTo('Sérum')).replace(/2–3 drops/g,'1–2 drops')}
  if(/Skin Box/.test(n))return 'Morning and night, in this order:\nCleanser: With dry hands and a dry face, 1 pump in the morning, 2–3 at night. Massage over face and neck for 1–2 minutes, remove with a wet cloth, then rinse with cool water. Double cleanse at night if you’re wearing makeup.\nP50 Toner: Put 1–2 drops on a cotton round and press into your face and neck in an upward motion. No rubbing. Avoid the eye area. Don’t rinse.\nMoisturizer: Emulsify a pea-size amount between your fingers and press into face and neck.';
  if(/Lait|Démaquillante|Micellaire|Cleans/i.test(n))return 'With dry hands and a dry face, cleanse with 1 pump in the morning and 2–3 pumps at night. Massage over face and neck for 1–2 minutes. Remove with a wet cloth, then rinse with cool water. At night, if you’re wearing makeup, double cleanse to remove the first layer.';
  if(/Lotion MC 110/.test(n))return 'Use 2–3 times a week. Apply 1–2 pumps to a cotton round and tap onto the affected areas. Also great for fine lines.';
  if(/Lotion P50|Eauxyg/.test(n))return 'After cleansing, put 1–2 drops of your P50 on a cotton round and press it into your face and neck in an upward motion. No rubbing. Avoid the eye area. A light tingle is normal. Don’t rinse.';
  if(/Sérum Vivant/.test(n))return 'At night, apply 2–3 drops onto blemished areas and pat into skin.';
  if(/Sérum|Serum|Fluide|Amniotique|Collag|Élastine|Placenta|Tensil|Oligo|Dermopore|Silk Plus|Iribiol|Tissulaires|Colostrum|Spectral/.test(n))return 'After your P50, apply 2–3 drops directly onto skin. Gently pat to spread the product evenly over face and neck.';
  if(/Contour des Yeux|Eye/.test(n))return 'Tap a rice-grain amount around the orbital bone with your ring finger, from the inner corner out.';
  if(/Masque|Mask/.test(n))return 'Apply an even layer to clean skin, avoiding the eyes. Leave on 10–15 minutes, then rinse with lukewarm water.';
  if(/Crème|Émulsion|Cream/.test(n))return 'Use a pea-size amount all over face and neck. Emulsify between your fingers and press into skin. Use a little more if needed.';
  return ''}
const RX_NEWP50='New to P50: Dilute your cotton round with water first. For the first few applications, use it 1–2 times a week, then add more days once your skin is used to it.';
const RX_HOW_STEP=n=>/Skin Box/.test(n)?0:/Lait|Démaquillante|Micellaire/.test(n)?1:/Lotion P50|MC 110|Eauxyg/.test(n)?2:/Masque|Mask/.test(n)?5:/Contour des Yeux|Eye/.test(n)?4:/Crème|Émulsion|Cream/.test(n)?4.5:3;
function rxTakeHomeView(me){
  const list=rxSaved(), x=list.find(r=>r.id===RX_HOME); if(!x){RX_VIEW='saved';return rxSavedView(me)}
  const d=x.draft, kind=d.kind||x.kind, put=()=>{const L=rxSaved(),i=L.findIndex(r=>r.id===x.id);if(i>=0){L[i]=x;store.set(rxSavedKey(),JSON.stringify(L))}};
  const opts=d.opts||[], ch=x.chosen!=null?x.chosen:Math.max(0,opts.length-1);
  const hcOf=o=>o?o.lines.filter(l=>l.t!=='s'):[], budget=rxTotal(hcOf(opts[ch]));
  const names=[['Worth The Wait'],['All In']]; const tots=opts.map(o=>rxTotal(o.lines)), hi=tots.length===2?tots.indexOf(Math.max(...tots)):1;
  const label=i=>i===hi?'All In':'Worth The Wait';
  /* candidates: her go-tos, the default for the budget, what the consult matched, a Try Me */
  const price=n=>{const r=(RX_PRICES[kind]||[]).find(p=>p[0]===n);return r?r[1]:null};
  const cand=[], add=(n,p,why,grp)=>{if(p==null||cand.some(c=>c.n===n))return;const l=kind==='skin'&&!/Skin Box/.test(n)?rxLasts(n):'';cand.push({n,p,why:l?(why?why+' · ':'')+'Lasts '+l:why,grp})};
  const favs=rxFavs(); (RX_PRICES[kind]||[]).filter(([n])=>favs.includes(n)).forEach(([n,p])=>add(n,p,'Your go-to','fav'));
  const hcWhy=hcOf(opts[ch]).map(l=>l.why||'').join(' ');
  if(kind==='skin'){const bx=(hcWhy.match(/Biologique Recherche \w+ Skin Box/)||[])[0];
    if(bx) add(bx,RX_SK_LO,'Lasts for a 4-week skincare routine','def'); add('Biologique Recherche Lait VIP O2 (5.1 oz)',price('Biologique Recherche Lait VIP O2 (5.1 oz)')||60,'The full-size cleanser','def');add('Biologique Recherche Lait VIP O2 (1.7 oz)',price('Biologique Recherche Lait VIP O2 (1.7 oz)')||35,'The travel-size cleanser','def');}
  else add('Taffeta Refill Shampoo & Conditioner, new bottles',81,'Full-size Taffeta bottles','def');
  let needs=[]; try{needs=rxNeeds(d)}catch(e){}
  if(kind==='hair'){const svc=opts.flatMap(o=>o.lines.map(l=>l.n)); needs=rxNeedsFor(needs,svc)}
  needs.forEach(k=>{let [n,p,why,alt]=RX_PROD[k]; if(alt&&RX_OUT.includes(n))[n,p]=alt; add(n,p,why,'match')});
  /* starts with the products already on the option she chose (a BR Bottle added on the build, Angelina Oct 24 2026),
     otherwise the default for her budget */
  if(!x.home){x.home=hcOf(opts[ch]).filter(l=>l.t!=='h').map(l=>({n:l.t==='t'?'Try Me: '+l.n:l.n,p:Number(l.p)||0}));
    if(!x.home.length){const df=cand.find(c=>c.grp==='def'&&c.p<=budget);if(df)x.home.push({n:df.n,p:df.p})} put()}
  const picked=n=>x.home.find(p=>p.n===n), sum=rxTotal(x.home), left=budget-sum;
  /* the whole maintenance list, searchable, her stars on top; pick as many as she wants and the list stays open
     (Alexandra, Oct 20 2026). Consult matches are tagged, not a separate list. */
  const matched=new Set(cand.filter(c=>c.grp==='match'||c.grp==='def').map(c=>c.n));
  const sumBox=()=>{const t=rxTotal(x.home),l=budget-t,e=document.getElementById('rxthsum');if(!e)return;
    e.querySelector('[data-k=p]').textContent=rxMoney(t);e.querySelector('[data-k=l]').textContent=rxMoney(Math.max(0,l));
    const o=document.getElementById('rxthover');if(o){o.hidden=l>=0;o.textContent=rxMoney(-l)+' over her budget: let her know before ringing it up.'}
    const pk=document.getElementById('rxthpicked');if(pk)pk.textContent=x.home.length?'Picked: '+x.home.map(q=>q.n.replace(/^Biologique Recherche /,'BR ')).join(', '):'Nothing picked yet.'};
  const pickRow=(n,pr,tag)=>{const on=!!picked(n),l=/Skin Box/.test(n)?'4-week skincare routine':(kind==='skin'?rxLasts(n):'');
    const why=[tag,l?'Lasts '+l:''].filter(Boolean).join(' · ');
    const b=h('button',{type:'button',class:'rxth'+(on?' on':''),'aria-pressed':String(on),onclick:()=>{const now=!picked(n);
        if(now)x.home.push({n,p:pr});else x.home=x.home.filter(q=>q.n!==n); put();
        const y=window.scrollY;render();window.scrollTo(0,y)}},   /* re-render so How & When below lists it */
      h('span',{class:'rxbx','aria-hidden':'true'},on?'✓':''),h('span',{class:'rxthn'},h('b',{},(favs.includes(n)?'★ ':'')+n.replace(/^Biologique Recherche /,'BR ')),why?h('small',{},why):null),h('span',{class:'rxthp'},rxMoney(pr)));
    return b};
  const allP=(RX_PRICES[kind]||[]), q=RX_THQ.trim().toLowerCase(), hit=([n])=>!q||n.toLowerCase().includes(q);
  const srch=h('input',{type:'search',id:'rxthq',value:RX_THQ,placeholder:'Search a product',autocomplete:'off'});
  srch.addEventListener('input',()=>{RX_THQ=srch.value;const pos=srch.selectionStart;render();const n=document.getElementById('rxthq');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
  const tagOf=n=>matched.has(n)?'Matched to her consult':'';
  const mineL=allP.filter(([n])=>favs.includes(n)&&hit([n]));
  const listSec=h('section',{class:'card2'},h('span',{class:'lbl'},'Pick What She Takes Home'),
    h('small',{class:'soft'},'Search or open a brand. Tap as many as she wants; your stars are on top.'),
    /* the $25 BR Bottle (or Try Me) sits at the top (Alexandra, Oct 24 2026) */
    kind==='skin'?h('button',{type:'button',class:'tab',style:'align-self:flex-start',onclick:()=>{const w=rxBrbAsk();if(w){x.home.push({n:w,p:RX_BRB});put();render()}}},'+ '+RX_BRB_N+' · '+rxMoney(RX_BRB)):h('button',{type:'button',class:'tab',style:'align-self:flex-start',onclick:()=>{const w=prompt('Which product goes in the Try Me bottle?');if(w){x.home.push({n:'Try Me: '+w.trim(),p:RX_TRY});put();render()}}},'+ Try Me bottle · '+rxMoney(RX_TRY)),
    h('label',{class:'fld'},srch),
    mineL.length?h('div',{},h('span',{class:'lbl',style:'margin-top:6px'},'★ Your Go-Tos'),...mineL.map(([n,p])=>pickRow(n,p,tagOf(n)))):null,
    ...rxByBrand(allP.filter(([n])=>!favs.includes(n)&&hit([n]))).map(([br,L])=>{const dd=h('details',{class:'invg'},h('summary',{},h('h2',{style:'font-size:17px'},br),h('span',{class:'soft invc'},String(L.length)),h('span',{class:'tplus','aria-hidden':'true'},'+')),
      h('div',{class:'sec2'},...L.map(([n,p])=>pickRow(n,p,tagOf(n)))));if(q||L.some(([n])=>picked(n)))dd.open=true;return dd}),
    ...x.home.filter(p=>!allP.some(([n])=>n===p.n)).map(p=>pickRow(p.n,p.p,'')));
  const row=c=>{const on=!!picked(c.n);return h('button',{type:'button',class:'rxth'+(on?' on':''),'aria-pressed':String(on),onclick:()=>{
      if(on)x.home=x.home.filter(p=>p.n!==c.n);else x.home.push({n:c.n,p:c.p}); put(); render()}},
    h('span',{class:'rxbx','aria-hidden':'true'},on?'✓':''),h('span',{class:'rxthn'},h('b',{},(c.grp==='fav'?'★ ':'')+c.n),c.why?h('small',{},c.why):null),h('span',{class:'rxthp'},rxMoney(c.p)))};
  const grp=(t,g)=>{const L=cand.filter(c=>c.grp===g);return L.length?[h('span',{class:'lbl',style:'margin-top:6px'},t),...L.map(row)]:[]};
  const tryMe=kind==='skin'?h('button',{type:'button',class:'tab',onclick:()=>{const w=rxBrbAsk();if(w){x.home.push({n:w,p:RX_BRB});put();render()}}},'+ '+RX_BRB_N+' · '+rxMoney(RX_BRB)):h('button',{type:'button',class:'tab',onclick:()=>{const w=prompt('Which product goes in the Try Me bottle?');if(w){x.home.push({n:'Try Me: '+w.trim(),p:RX_TRY});put();render()}}},'+ Try Me bottle · '+rxMoney(RX_TRY));
  const extra=x.home.filter(p=>!cand.some(c=>c.n===p.n)).map(p=>row({n:p.n,p:p.p,why:'',grp:'x'}));
  const toast=h('p',{class:'soft',style:'text-align:center;margin:0'});
  /* Add-Ons (Alexandra, Oct 24 2026): picked at the end while she gets dressed. Not in her home care budget; the desk
     sees them on her Home Care card and rings them up. One already in the option she chose isn't offered again. */
  const svcOpt=(opts[ch]?opts[ch].lines:[]).filter(l=>l.t==='s').map(l=>l.n), inOpt=n=>svcOpt.includes(n);
  if(!Array.isArray(x.addons)) x.addons=[];
  const addL=kind==='skin'?RX_SVC.skin.filter(([n])=>n==='Dermaplaning Add-On'&&!inOpt(n)):[];
  /* one Masque line with a drop-down of which masque; picking another swaps it */
  const mqOn=x.addons.find(a=>a.n.startsWith(RX_MQ)), mq=kind==='skin'?h('select',{'aria-label':'Which masque'},h('option',{value:''},'Masque · $50: Pick One'),
    RX_MASQUES.map(m=>h('option',Object.assign({value:RX_MQ+m},mqOn&&mqOn.n===RX_MQ+m?{selected:''}:{}),m))):null;
  if(mq) mq.addEventListener('change',()=>{x.addons=x.addons.filter(a=>!a.n.startsWith(RX_MQ));if(mq.value)x.addons.push({n:mq.value,p:50});put();render()});
  const addSec=kind==='skin'?h('section',{class:'card2'},h('span',{class:'lbl'},'Add-Ons'),
    h('small',{class:'soft'},'Did she add anything at the end? Tap it and the desk rings it up. Not part of her home care budget.'),
    ...addL.map(([n,p])=>{const on=x.addons.some(a=>a.n===n);return h('button',{type:'button',class:'rxth'+(on?' on':''),'aria-pressed':String(on),onclick:()=>{
        x.addons=on?x.addons.filter(a=>a.n!==n):[...x.addons,{n,p}];put();render()}},
      h('span',{class:'rxbx','aria-hidden':'true'},on?'✓':''),h('span',{class:'rxthn'},h('b',{},n)),h('span',{class:'rxthp'},rxMoney(p)))}),
    h('label',{class:'fld'},'Masque · $50',mq),
    x.addons.length?h('small',{class:'soft'},'Add-ons today: '+rxMoney(rxTotal(x.addons))):null):null;
  /* Extra instructions for her Home Care PDF (Alexandra, Oct 24 2026) */
  const ex=h('textarea',{class:'rgta',rows:'3',placeholder:'Anything else she should know at home'}); ex.value=x.extra||''; ex.addEventListener('input',()=>{x.extra=ex.value;put()});
  const exSec=h('section',{class:'card2'},h('span',{class:'lbl'},'Extra Instructions For Her'),
    h('small',{class:'soft'},'Prints on her Home Care PDF with her aftercare when you Save & Send To Desk.'),h('label',{class:'fld'},ex));
  const proN=String((d&&d.pro)||'').trim();
  const proSec=proN?h('section',{class:'card2'},h('span',{class:'lbl'},'Pro Notes'),h('small',{class:'soft'},'Only the team sees these.'),h('p',{style:'margin:0;white-space:pre-wrap;font-size:14px'},proN)):null;
  const cat=typeof rgCatalog==='function'?rgCatalog(kind):[], whens=RG_WHEN[kind];
  const pickOf=p=>{if(String(p.n).startsWith(RX_BRB_N+': '))return {n:String(p.n),how:rxHowTo(p.n)+' Lasts about 2 weeks.',when:whens[0],step:''};const b=rgNorm(rgBase(String(p.n).replace(/^Try Me: /,''))), it=cat.find(c=>rgNorm(c.n)===b||c.sizes.includes(p.n))||cat.find(c=>{const k=rgNorm(c.n);return k.length>8&&(b.startsWith(k)||k.startsWith(b))});
      const nm=it?it.n:String(p.n).replace(/^Try Me: /,''), gen=kind==='skin'?rxHowTo(nm):'';
      return it?{n:it.n,how:it.how||gen,when:it.w0&&whens.includes(it.w0)?it.w0:whens[0],step:it.step}:{n:nm,how:gen,when:whens[0],step:''}};
  /* How & When (Oct 24 2026): what the artist types here for each product goes on her PDF. Before this the PDF always
     used the standard wording, so an artist's own directions never made it to the guest (Angelina's card). */
  if(!x.how||typeof x.how!=='object') x.how={};
  const howOf=p=>Object.assign(pickOf(p),x.how[p.n]||{});
  const hw=x.home.length?h('section',{class:'card2'},h('span',{class:'lbl'},'How & When'),
    h('small',{class:'soft'},'This is what prints on her Home Care PDF. Change the wording or when to use it for her.'),
    ...x.home.map(p=>{const q=howOf(p), set=(k,v)=>{x.how[p.n]=Object.assign({},x.how[p.n]||{},{[k]:v});put()};
      const ta=h('textarea',{class:'rgta',rows:'3'}); ta.value=q.how||''; ta.addEventListener('input',()=>set('how',ta.value));
      return h('div',{class:'rgitem'},h('div',{class:'rgitem-h'},h('b',{},q.n.replace(/^Biologique Recherche /,'BR '))),
        h('div',{class:'seg'},whens.map(o=>h('button',{type:'button','aria-pressed':String(q.when===o),onclick:()=>{set('when',o);render()}},o))),
        h('label',{class:'fld'},ta))})):null;
  const toRG=()=>{
    RG=rgBlank(); RG.guest=x.guest; RG.next=d.m&&d.m.when||''; RG.rid=x.id;   /* her card id: saving again replaces the desk's copy */
    RG.picks=x.home.map(howOf);
    /* New to P50 (Alexandra, Oct 20 2026): the artist checks it and her P50 step gets the dilute / ease-in line */
    if(kind==='skin'&&x.newP50) RG.newP50=true;   /* g/regimen.js rgBake puts it on her P50 step, or with her aftercare notes */
    if(kind==='skin') RG.picks.sort((a,b)=>RX_HOW_STEP(a.n)-RX_HOW_STEP(b.n));
    RG.own=String(x.extra||'').trim();   /* her extra instructions print on the PDF with the aftercare (Alexandra, Oct 24 2026) */
    RG.addons=(x.addons||[]).filter(a=>!inOpt(a.n))};
  const send=h('button',{type:'button',class:'obtn',onclick:async()=>{if(!x.home.length){toast.textContent='Pick what she’s taking home first.';return}
    toRG(); await rgSave2(me,toast,send); if(!RG.guest){RX_MSG=x.guest+'’s Home Care PDF is on the front desk list to text her.';x.sent=new Date().toISOString();put();RX_VIEW='saved';RX_FIND=x.guest;render();window.scrollTo(0,0)}}},'Save & Send To Desk');
  const prev=h('button',{type:'button',class:'tab',onclick:()=>{if(!x.home.length){toast.textContent='Pick what she’s taking home first.';return}toRG();rgPreview(me,toast,RG,kind)}},'Preview Her PDF');
  return [h('section',{class:'card2'},
      h('button',{type:'button',class:'tab',style:'align-self:flex-start',onclick:()=>{RX_VIEW='saved';render()}},'‹ Saved Cards'),
      h('span',{class:'lbl'},'RX Card · '+x.guest),h('h1',{style:'font-size:28px'},'What She Takes Home'),
      opts.length>1?h('div',{class:'seg'},opts.map((o,i)=>h('button',{type:'button','aria-pressed':String(i===ch),onclick:()=>{x.chosen=i;x.home=null;put();render()}},'She chose '+label(i)))):null,
      h('p',{class:'soft'},'She agreed to '+rxMoney(budget)+' of home care at her consult. Pick what fits her best.'),
      h('div',{class:'rxthb',id:'rxthsum'},h('div',{},h('b',{},rxMoney(budget)),h('small',{},'Her budget')),h('div',{},h('b',{'data-k':'p'},rxMoney(sum)),h('small',{},'Picked')),h('div',{},h('b',{'data-k':'l'},rxMoney(Math.max(0,left))),h('small',{},'Left'))),
      h('p',{class:'soft',id:'rxthpicked',style:'margin:0'},x.home.length?'Picked: '+x.home.map(q=>q.n.replace(/^Biologique Recherche /,'BR ')).join(', '):'Nothing picked yet.'),
      h('p',{class:'rxover',id:'rxthover',hidden:left<0?null:''},rxMoney(-left)+' over her budget: let her know before ringing it up.')),
    listSec,
    kind==='skin'?h('section',{class:'card2'},h('span',{class:'lbl'},'P50 Options'),
      h('button',{type:'button',class:'rxth'+(x.newP50?' on':''),'aria-pressed':String(!!x.newP50),onclick:()=>{x.newP50=!x.newP50;put();render()}},
        h('span',{class:'rxbx','aria-hidden':'true'},x.newP50?'✓':''),h('span',{class:'rxthn'},h('b',{},'She’s new to P50'),h('small',{},'Adds to her PDF: dilute the cotton round, start 1–2 times a week, then add more days once her skin is used to it.')))):null,
    hw,addSec,exSec,proSec,
    h('section',{class:'card2',style:'align-items:center;text-align:center'},send,prev,toast,
      h('small',{class:'soft'},'Her Home Care PDF goes to the front desk app’s Home Care list, and the desk texts it to her at checkout. Changed your mind at the end of her service? Change the picks and tap Save & Send To Desk again: it replaces the one on the desk.'))];
}
