/* Aftercare for the front desk and the team app (Alexandra, Oct 2026; every service + Copy text added Nov 28 2026).
   The desk types the guest's first name, taps Text the PDF, and the share sheet opens with a Taffeta-branded PDF
   ready for Messages, or taps Copy text to paste the same words into a text. PDFs are made on the device with jsPDF
   (loaded on first use). Mounts into #afterList on the desk and the Aftercare Texts page in the team app. */

const AC_PHONE='(609) 383-5504', AC_SITE='taffetadesign.com';
/* Every service on the menu that needs aftercare (Alexandra, Nov 28 2026). One list feeds the Copy text button, the PDF
   and the printable guide, so a change here changes all three. group = where it sits on the page; hi = the text's first line. */
const AC_SHEETS=[
  {id:'ext',kind:'hair',group:'Hair',name:'Hair extensions',title:'Your hair extension aftercare',
   hi:'Thank you for trusting us with your new extensions! Here is how to keep them beautiful:',
   intro:'Your extensions are an investment. A few simple habits keep them looking beautiful and your own hair healthy.',
   sections:[
    ['First 48 hours',['No shampooing, no getting your hair wet and no exercise that makes you sweat for 48 hours, no exceptions. The bonds need this time to set.']],
    ['Washing',['Use conditioner only from mid-shaft down, or from a low ponytail down. Keep it off your scalp and the panels.']],
    ['Brushing',['Brush often.','When your hair is wet, hold the panels and work from the ends up.','We carry a Premium Boar Detangling Brush and a Wet/Dry Detangling Brush made for extensions.']],
    ['Sleeping',['Sleep on a silk pillowcase with your hair in a loose ponytail or braid.']],
    ['Pool & ocean',['Put leave-in conditioner on your mid-lengths and ends and wear a ponytail. No braids while swimming.']],
    ['Good to know',['Give yourself extra styling time at first while you get used to them.','Pre-book your follow-up and maintenance no later than 6–8 weeks after your application.']]]},
  {id:'color',kind:'hair',group:'Hair',name:'Hair color & balayage',title:'Your hair color aftercare',
   hi:'Thank you for coming in! Here is how to keep your new color fresh:',
   intro:'Your color is freshly done. The first few days and a few simple habits keep it rich and shiny longer.',
   sections:[
    ['First 48 hours',['Wait 48–72 hours before your first shampoo so the color can settle in.']],
    ['Washing',['Use a color-safe, sulfate-free shampoo and conditioner.','Wash 2–3 times a week, not every day.','Rinse with cool or lukewarm water. Hot water fades color.']],
    ['Styling',['Use a heat protectant every time you blow dry, curl or flat iron.','Skip drugstore and clarifying shampoos. They strip color.']],
    ['Pool & sun',['Wet your hair and add leave-in conditioner before the pool or ocean.','Wear a hat in strong sun to keep your tone from turning brassy.']],
    ['Good to know',['Book your next color in about 4–8 weeks for roots, or 8–12 weeks for balayage. A glaze in between keeps it shiny.']]]},
  {id:'bb',kind:'hair',group:'Hair',name:'Brazilian Blowout & smoothing',title:'Your smoothing treatment aftercare',
   hi:'Thank you for coming in! Here is how to make your smooth hair last:',
   intro:'Your hair is smooth and frizz-free. The right shampoo is the secret to making it last.',
   sections:[
    ['Washing',['Wash only with a sulfate-free, salt-free shampoo and conditioner. The Brazilian Blowout line we carry is made for this.','Wash 2–3 times a week to make your results last longer.']],
    ['Styling',['A quick blow dry with a round brush brings back the sleek, smooth finish.','Use a heat protectant when you heat style.']],
    ['Pool & ocean',['Wet your hair and add leave-in conditioner before you swim. Chlorine and salt water shorten your results.']],
    ['Good to know',['Your results last up to 12 weeks.','Book your next smoothing treatment in about 10–12 weeks.']]]},
  {id:'perm',kind:'hair',group:'Hair',name:'Permanent wave',title:'Your permanent wave aftercare',
   hi:'Thank you for coming in! Here is how to care for your new waves:',
   intro:'Your new curl is still setting. Be gentle for the first two days so it stays strong.',
   sections:[
    ['First 48 hours',['Don’t shampoo or get your hair wet for 48 hours.','No tight ponytails, clips, headbands or hats.','Don’t brush or flat iron your hair.']],
    ['Every day after',['Use a wide-tooth comb or your fingers, never a brush on dry curls.','Use a sulfate-free shampoo and a moisturizing conditioner.','Scrunch in a curl cream while your hair is damp and let it air dry or use a diffuser.']],
    ['Good to know',['Your waves soften a little over the first week. That is normal.','Wait at least 2 weeks before any color service.']]]},
  {id:'facial',kind:'skin',group:'Skin',name:'Facials',title:'Your facial aftercare',
   hi:'Thank you for coming in! Here is how to care for your skin after your facial:',
   intro:'Your skin is fresh and clean. Give it a day to rest so you get the most from today’s treatment.',
   sections:[
    ['First 24 hours',['Skip makeup for the rest of today if you can.','Avoid saunas, steam, hot yoga and hard workouts.','Sleep on a fresh, clean pillowcase tonight.']],
    ['First 48–72 hours',['No retinol, acids or scrubs.','Don’t pick or squeeze. Let your skin settle on its own.']],
    ['Every day',['Wear SPF 30 or higher every morning, and reapply every 2 hours outdoors.','Drink extra water over the next few days.','Follow the plan your esthetician made for you.']],
    ['Good to know',['Book your next facial in about 4 weeks to keep your results going.']]]},
  {id:'peel',kind:'skin',group:'Skin',name:'Peels, dermaplaning & microderm',title:'Your peel & resurfacing aftercare',
   hi:'Thank you for coming in! Here is how to care for your skin after today’s treatment:',
   intro:'Your skin was gently resurfaced today, so it is extra sensitive for the next few days. Be kind to it.',
   sections:[
    ['First 24 hours',['No makeup if you can.','No saunas, steam, hot yoga or hard workouts.','Wash with a gentle cleanser and cool water only.']],
    ['First 3–5 days',['No retinol, acids, scrubs or face brushes.','Don’t pick or peel any flaking skin. Let it come off on its own.','No facial waxing or hair removal for 1 week.']],
    ['Sun',['Stay out of the sun as much as you can, and wear SPF 30 or higher every day. Your new skin burns easily.']],
    ['Good to know',['A little redness, tightness or flaking is normal and fades in a few days.','If anything feels very sore or doesn’t settle, call or text us.']]]},
  {id:'nano',kind:'skin',group:'Skin',name:'Nano needling',title:'Your nano needling aftercare',
   hi:'Thank you for coming in! Here is how to care for your skin after nano needling:',
   intro:'Your skin is soaking up today’s serums. Keep it clean and calm so the results come through.',
   sections:[
    ['First 24 hours',['No makeup.','Don’t touch your face, and wash only with a gentle cleanser and cool water.','No saunas, steam, swimming or hard workouts.']],
    ['First 3 days',['No retinol, acids, vitamin C or scrubs.','Don’t pick at any dry or rough spots.']],
    ['Sun',['Wear SPF 30 or higher every day and stay out of strong sun for 1 week.']],
    ['Good to know',['Your skin may feel tight or a little pink for a day. That is normal.','If you are doing a series of 3, book your next one in about 4 weeks.']]]},
  {id:'wax',kind:'skin',group:'Skin',name:'Waxing',title:'Your waxing aftercare',
   hi:'Thank you for coming in! Here is how to care for your skin after waxing:',
   intro:'Your skin is smooth and a little open right now. A day of rest keeps it calm and bump-free.',
   sections:[
    ['First 24 hours',['No hot showers, baths, hot tubs, saunas, pools or sweaty workouts.','Wear loose, soft clothing over the area.','Skip lotions, perfume and deodorant on the waxed area.']],
    ['First 48 hours',['No tanning, self-tanner or strong sun.','Don’t touch or scratch the area.']],
    ['Every day after',['Starting on day 3, gently exfoliate 2–3 times a week to stop ingrown hairs.','Moisturize every day to keep skin soft.']],
    ['Good to know',['Book your next wax in about 4–6 weeks.']]]},
  {id:'brow',kind:'skin',group:'Brows & lashes',name:'Brow lamination',title:'Your brow lamination aftercare',sign:'Pretty Brows by Taffeta xo',
   hi:'Thank you for coming in! Here is how to care for your new brow lamination:',
   intro:'Your brows are freshly set. These first 24 hours decide how long the shape lasts, so be gentle with them.',
   sections:[
    ['First 24 hours',['Keep your brows completely dry: no washing your face over them, steam, saunas, swimming or sweaty workouts.','No makeup, brow gel, oils or skincare on your brows.','Don’t rub or touch your brows, and try not to sleep face-down tonight.']],
    ['Every day after',['Brush your brows into shape each morning with a clean spoolie.','After the first 24 hours, smooth a nourishing brow oil or serum through them each night to keep the hairs healthy.','Keep retinol, acids and exfoliants away from the brow area.']],
    ['Good to know',['Your lamination lasts about 6–8 weeks.','Please wait at least 6 weeks between laminations.','If you notice redness, swelling or irritation that doesn’t settle, call or text us.']]]},
  {id:'browtint',kind:'skin',group:'Brows & lashes',name:'Brow tint & brow sculpt',title:'Your brow tint & sculpt aftercare',sign:'Pretty Brows by Taffeta xo',
   hi:'Thank you for coming in! Here is how to care for your brows:',
   intro:'Your brows are shaped and tinted. Keep them clean and dry for a day so the color and shape last.',
   sections:[
    ['First 24 hours',['Keep your brows dry: no steam, saunas, swimming or sweaty workouts.','No makeup, brow products or skincare on your brows.','Don’t touch, rub or pick at the brow area.']],
    ['Every day after',['Wash gently around your brows. Skip oil cleansers, scrubs, retinol and acids on the brow area. They fade the tint.','Wear SPF. Sun fades tint faster.']],
    ['Good to know',['Your tint lasts about 3–4 weeks.','Book your next brow sculpt in about 4–6 weeks to keep the shape.']]]},
  {id:'lash',kind:'skin',group:'Brows & lashes',name:'Lash lift & tint',title:'Your lash lift & tint aftercare',sign:'Pretty Lashes by Taffeta xo',
   hi:'Thank you for coming in! Here is how to care for your lash lift:',
   intro:'Your lashes are lifted and tinted. Keep them dry and oil-free for the first day so the curl sets.',
   sections:[
    ['First 24 hours',['Keep your lashes completely dry: no water on your eyes, steam, saunas, swimming or sweaty workouts.','No mascara or eye makeup.','Don’t rub your eyes, and try not to sleep face-down tonight.']],
    ['Every day after',['Brush your lashes up gently with a clean spoolie each morning.','Skip oil-based cleansers and eye makeup removers around your eyes. Oil relaxes the lift.','No lash curler, and skip waterproof mascara. It is hard to remove without tugging.','A lash conditioning serum after the first 24 hours keeps them strong.']],
    ['Good to know',['Your lift lasts about 6–8 weeks, and the tint fades gradually over 4–6 weeks.','If your eyes feel irritated or look red after today, call or text us.']]]},
  {id:'lashext',kind:'skin',group:'Brows & lashes',name:'Lash extensions',title:'Your lash extension aftercare',sign:'Pretty Lashes by Taffeta xo',
   hi:'Thank you for coming in! Here is how to keep your new lashes full:',
   intro:'Your lashes are freshly applied. The glue sets over the first day, so keep them dry and oil-free.',
   sections:[
    ['First 24 hours',['Keep your lashes dry: no water on your eyes, steam, saunas or sweaty workouts.','No mascara or eye makeup.']],
    ['Every day after',['Wash your lashes every day with a lash-safe foaming cleanser, then brush them with a clean spoolie.','Keep oils away from your eyes. Use oil-free makeup remover and skincare.','No lash curler and no mascara on your extensions.','Don’t rub, pull or pick at your lashes. Try to sleep on your back.']],
    ['Good to know',['It is normal to lose a few lashes each day as your natural lashes shed.','Book your refill every 2–3 weeks to keep them full.']]]},
  {id:'nails',kind:'skin',group:'Nails',name:'Gel & acrylic nails',title:'Your nail aftercare',sign:'Pretty Nails by Taffeta xo',
   hi:'Thank you for coming in! Here is how to keep your nails looking fresh:',
   intro:'Your nails are freshly done. A few small habits keep them strong and chip-free.',
   sections:[
    ['Every day',['Rub cuticle oil into your nails and cuticles every day.','Wear gloves when you clean or wash dishes.','Don’t use your nails as tools to open cans or peel labels.']],
    ['Never',['Never pick, peel or bite off your gel or acrylic. It pulls off layers of your real nail. Come see us for a safe removal.']],
    ['Good to know',['Gel lasts about 2–3 weeks.','Book a rebalance or a fresh set every 2–3 weeks.','If a nail lifts or cracks, call or text us and we will fix it.']]]}
];

let AC_LIB=null, AC_LOGO=null;
function acLib(){
  if(window.jspdf) return Promise.resolve(window.jspdf);
  return AC_LIB||(AC_LIB=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=()=>ok(window.jspdf);s.onerror=()=>{AC_LIB=null;no(new Error('lib'))};document.head.appendChild(s)}));
}
/* daintier script (same as the Home care PDFs): Cormorant Garamond Light Italic, Times italic if it can't load */
let AC_SCRIPT=null;
function acScriptFont(){
  if(AC_SCRIPT!==null) return Promise.resolve(AC_SCRIPT);
  return fetch((window.AC_LOGO_URL||'../g/logo.png').replace(/logo\.png.*$/,'cormorant-garamond-300-italic.ttf')).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(b=>{const u=new Uint8Array(b);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return AC_SCRIPT=btoa(s)})
    .catch(()=>AC_SCRIPT='');
}
function acLogo(){
  if(AC_LOGO) return Promise.resolve(AC_LOGO);
  return fetch(window.AC_LOGO_URL||'../g/logo.png').then(r=>r.blob()).then(b=>new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(AC_LOGO=f.result);f.readAsDataURL(b)})).catch(()=>null);
}

/* Half-letter page (5.5 × 8.5 in), cream ground, wreath, serif headings: same look as the artists' regimen PDF */
async function acPdf(sheet,guest){
  const [lib,logo,script]=await Promise.all([acLib(),acLogo(),acScriptFont()]);
  /* laid out twice: once to measure, then for real with the spare room shared evenly between the sections, so a
     short sheet fills the page instead of bunching at the top (Alexandra, Oct 20 2026) */
  let H=612;
  const mk=()=>{const d=new lib.jsPDF({unit:'pt',format:[396,H]});
    if(script){try{d.addFileToVFS('CormorantLightItalic.ttf',script);d.addFont('CormorantLightItalic.ttf','CormorantLI','italic');SF='CormorantLI'}catch(e){SF='times'}}return d};
  let SF='times', doc=mk(), pad=0, gaps=0;
  const big=SF==='times'?1:1.12;
  const W=396,M=34,CW=W-M*2,ink=[18,18,18],soft=[95,91,85],choc=[18,18,18],line=[226,222,213];
  let y=0;
  const bg=()=>{doc.setFillColor(248,246,240);doc.rect(0,0,W,H,'F');doc.setFillColor(255,255,255);doc.rect(12,12,W-24,H-24,'F');
    /* the app's double frame: a thin black line and a finer charcoal line just inside (Alexandra, Oct 15 2026) */
    doc.setDrawColor(18,18,18);doc.setLineWidth(.7);doc.rect(12,12,W-24,H-24,'S');doc.setDrawColor(43,42,40);doc.setLineWidth(.3);doc.rect(17,17,W-34,H-34,'S');doc.setLineWidth(.2)};
  const foot=()=>{doc.setDrawColor(...line);doc.line(M,H-40,W-M,H-40);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...soft);
    doc.text('Taffeta Salon & Spa  ·  219 Bellevue Ave, Hammonton NJ  ·  '+AC_PHONE+'  ·  '+AC_SITE,W/2,H-26,{align:'center'})};
  const need=n=>{if(y+n>H-52){foot();doc.addPage([396,H]);bg();y=M+6}};
  const para=(t,size,font,style,color,gap,indent)=>{doc.setFont(font,style);doc.setFontSize(size);doc.setTextColor(...color);
    const ls=doc.splitTextToSize(t,CW-(indent||0)),lh=size*1.32;ls.forEach(l=>{need(lh);doc.text(l,M+(indent||0),y+size);y+=lh});y+=gap||0};
  const label=t=>{gaps++;y+=pad;need(50);y+=4;doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...ink);doc.setCharSpace(1.6);
    const T=t.toUpperCase(), tw=doc.getTextWidth(T)+1.6*T.length; doc.text(T,W/2-tw/2,y+8);doc.setCharSpace(0);
    /* centered label between two short dashes, like MENU in the app */
    doc.setDrawColor(18,18,18);doc.setLineWidth(.4);doc.line(W/2-tw/2-30,y+5.5,W/2-tw/2-10,y+5.5);doc.line(W/2+tw/2+10,y+5.5,W/2+tw/2+30,y+5.5);doc.setLineWidth(.2);y+=20};
  const draw=()=>{
  bg();
  if(logo) doc.addImage(logo,'PNG',W/2-34,24,68,68);
  y=104;
  doc.setFont(SF,'italic');doc.setFontSize(21*big);doc.setTextColor(...ink);
  doc.text(doc.splitTextToSize(sheet.title,CW),W/2,y+18,{align:'center'});y+=30;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...soft);
  y+=6;
  para(sheet.intro,10.5*big,SF,'italic',ink,6);
  sheet.sections.forEach(([t,items])=>{label(t);items.forEach(n=>{need(16);doc.setFont('helvetica','normal');doc.setTextColor(...choc);doc.setFontSize(9.5);doc.text('•',M+2,y+9.5);para(n,9.5,'helvetica','normal',ink,4,14)})});
  gaps++;y+=10+pad;need(40);
  para('Questions? Call or text us at '+AC_PHONE+'.',9.5,'helvetica','bold',choc,8);
  /* five stars that open our Google review page (Alexandra, Oct 21 2026) */
  if(window.pdfReview&&(window.TAFFETA_REVIEWS||{}).salon){y+=4;need(56);y+=window.pdfReview(doc,W,y,SF,ink,soft)}
  y+=14;   /* the Pretty ... by Taffeta line sits a little lower (Alexandra, Oct 21 2026) */
  doc.setFont(SF,'italic');doc.setFontSize(13*big);doc.setTextColor(...choc);need(20);doc.text(sheet.sign||(sheet.kind==='hair'?'Pretty Hair by Taffeta xo':'Pretty Skin by Taffeta xo'),W/2,y+12,{align:'center'});y+=20;
  need(14);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...soft);doc.text(new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),W/2,y+8,{align:'center'});
  foot()};
  draw();
  /* the extra room goes before each section and the sign-off; if that tips it onto a second page, ease off until it fits */
  if(doc.getNumberOfPages()===1&&gaps){const room=Math.min(70,Math.max(0,(H-60-y)/gaps));
    for(const f of [1,.75,.5,0]){pad=room*f;doc=mk();gaps=0;draw();if(doc.getNumberOfPages()===1)break}}
  /* still more than one page (the review stars can tip a long sheet over): one longer page cut just below the date,
     same as the Home care PDFs, so nothing spills onto a second page (Oct 21 2026) */
  if(doc.getNumberOfPages()>1){pad=0;H=4000;doc=mk();gaps=0;draw();H=Math.max(612,Math.ceil(y+72));doc=mk();gaps=0;draw()}
  return doc.output('blob');
}
const acFile=(s,g)=>'Taffeta '+s.name.replace(/&/g,'and')+' Aftercare'+(g?' - '+g:'')+'.pdf';

async function acSend(sheet,guest,st,how,win){
  st.textContent='Making the PDF…';
  try{
    const blob=await acPdf(sheet,guest), file=new File([blob],acFile(sheet,guest),{type:'application/pdf'});
    if(how==='share'&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:sheet.title});st.textContent='Sent.'}
      catch(e){st.textContent=e&&e.name==='AbortError'?'':'Couldn’t open the share sheet. Try Preview.'}
      return;
    }
    const url=URL.createObjectURL(blob);
    if(how==='share'){const a=document.createElement('a');a.href=url;a.download=acFile(sheet,guest);document.body.appendChild(a);a.click();a.remove();st.textContent='Saved the PDF. Attach it to your text.'}
    else {URL.revokeObjectURL(url); st.textContent=''; window.pdfOverlay(blob,acFile(sheet,guest))}  /* Back button, never stuck (Oct 16 2026) */
  }catch(e){st.textContent='Couldn’t make the PDF. Check the Wi-Fi and try again.'}
}

/* The copy-and-paste text for a guest (Alexandra, Nov 28 2026): same words as the PDF, as one text message. */
function acText(s,guest){
  return 'Hi '+(guest||'there')+'! '+s.hi+'\n\n'+s.sections.flatMap(x=>x[1]).map(t=>'• '+t).join('\n')+
    '\n\nQuestions? Call or text us at '+AC_PHONE+'.\nTaffeta Salon & Spa 🤍';
}
async function acCopy(txt,b,st){
  const done=()=>{b.textContent='Copied';st.textContent='Copied. Paste it into her text.';setTimeout(()=>{if(b.isConnected)b.textContent='Copy text'},1800)};
  try{await navigator.clipboard.writeText(txt);done();return}catch(e){}
  /* older iPads: copy through a hidden box */
  const t=document.createElement('textarea');t.value=txt;t.setAttribute('readonly','');t.style.cssText='position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(t);t.select();t.setSelectionRange(0,txt.length);let ok=false;try{ok=document.execCommand('copy')}catch(e){}t.remove();
  if(ok)done();else st.textContent='Couldn’t copy. Tap See the text, then press and hold to copy.';
}
const AC_CSS=`.acw{display:flex;flex-direction:column;gap:14px}.acw .acg{font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;margin:10px 0 0;color:var(--ink,#121212)}
.acw .acg::after{content:'';display:block;height:1px;background:var(--line,#e2ded5);margin-top:8px}
.acw .aci{display:flex;flex-direction:column;gap:6px;padding-bottom:12px;border-bottom:1px solid var(--line,#e2ded5)}.acw .aci b{font-size:15px}
.acw .aci p{margin:0;font-size:13.5px;color:var(--soft,#5f5b55);line-height:1.45}
.acw .acb{display:flex;gap:8px;flex-wrap:wrap}.acw .acb button{all:unset;cursor:pointer;border:1px solid var(--ink,#121212);border-radius:6px;background:#fff;color:var(--ink,#121212);padding:10px 14px;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase}
.acw .acb button.acc{background:var(--ink,#121212);color:#fff}
.acw details summary{cursor:pointer;font-size:13px;color:var(--soft,#5f5b55);text-decoration:underline;list-style:none}.acw details summary::-webkit-details-marker{display:none}
.acw pre{white-space:pre-wrap;font:inherit;font-size:13.5px;line-height:1.5;margin:8px 0 0;padding:10px 12px;background:#f2f1ec;border-radius:6px;-webkit-user-select:text;user-select:text}
.acw input{font:inherit;font-size:16px;height:44px;border:1px solid var(--line,#e2ded5);border-radius:6px;padding:0 10px;background:#fbfaf7}`;
function acMount(el,opt){
  if(!el) return;
  opt=opt||{};
  if(!document.getElementById('acCss')){const c=document.createElement('style');c.id='acCss';c.textContent=AC_CSS;document.head.appendChild(c)}
  const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups=[...new Set(AC_SHEETS.map(s=>s.group))];
  el.classList.add('acw');
  el.innerHTML=`<p style="margin:0;font-size:13.5px;color:var(--soft)">${opt.note||'Type her first name. Tap <b>Copy text</b> and paste it into her text, or tap <b>Text the PDF</b> to send the pretty PDF. Pick Messages and her name.'}</p>
  <input class="acGuest" type="text" placeholder="Guest’s first name" autocomplete="off" autocapitalize="words" value="${e(window.AC_GUEST||'')}">`+
  groups.map(g=>`<p class="acg">${e(g)}</p>`+AC_SHEETS.map((s,i)=>s.group!==g?'':`<div class="aci" data-i="${i}"><b>${e(s.name)}</b><p>${e(s.intro)}</p>
    <details><summary>See the text</summary><pre></pre></details>
    <div class="acb"><button class="acc" data-ac="${i}" data-w="copy">Copy text</button><button data-ac="${i}" data-w="share">Text the PDF</button><button data-ac="${i}" data-w="view">Preview PDF</button></div><p class="acst" style="min-height:1.2em"></p></div>`).join('')).join('');
  const who=()=>(el.querySelector('.acGuest').value||'').trim().split(/\s+/)[0]||'';
  const fill=()=>el.querySelectorAll('.aci').forEach(d=>{d.querySelector('pre').textContent=acText(AC_SHEETS[+d.dataset.i],who())});
  fill(); el.querySelector('.acGuest').addEventListener('input',ev=>{window.AC_GUEST=ev.target.value;fill()});   /* the name survives a page refresh of the app */
  el.addEventListener('click',ev=>{
    const b=ev.target.closest('button[data-ac]'); if(!b) return;
    const s=AC_SHEETS[+b.dataset.ac], g=who(), st=b.closest('.aci').querySelector('.acst');
    if(b.dataset.w==='copy') return acCopy(acText(s,g),b,st);
    acSend(s,g,st,b.dataset.w);
  });
}
