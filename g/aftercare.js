/* Aftercare PDFs for the front desk (Alexandra, Oct 2026): brow lamination, lash lift & tint and hair extensions.
   The desk types the guest's first name, taps Text the PDF, and the share sheet opens with a Taffeta-branded PDF
   ready for Messages. Made on the device with jsPDF (loaded on first use). Mounts into #afterList. */

const AC_PHONE='(609) 383-5504', AC_SITE='taffetadesign.com';
const AC_SHEETS=[
  {id:'brow',kind:'skin',name:'Brow lamination',title:'Your brow lamination aftercare',
   intro:'Your brows are freshly set. These first 24 hours decide how long the shape lasts, so be gentle with them.',
   sections:[
    ['First 24 hours',['Keep your brows completely dry: no washing your face over them, steam, saunas, swimming or sweaty workouts.','No makeup, brow gel, oils or skincare on your brows.','Don’t rub or touch your brows, and try not to sleep face-down tonight.']],
    ['Every day after',['Brush your brows into shape each morning with a clean spoolie.','After the first 24 hours, smooth a nourishing brow oil or serum through them each night to keep the hairs healthy.','Keep retinol, acids and exfoliants away from the brow area.']],
    ['Good to know',['Your lamination lasts about 6–8 weeks.','Please wait at least 6 weeks between laminations.','If you notice redness, swelling or irritation that doesn’t settle, call or text us.']]]},
  {id:'lash',kind:'skin',name:'Lash lift & tint',title:'Your lash lift & tint aftercare',
   intro:'Your lashes are lifted and tinted. Keep them dry and oil-free for the first day so the curl sets.',
   sections:[
    ['First 24 hours',['Keep your lashes completely dry: no water on your eyes, steam, saunas, swimming or sweaty workouts.','No mascara or eye makeup.','Don’t rub your eyes, and try not to sleep face-down tonight.']],
    ['Every day after',['Brush your lashes up gently with a clean spoolie each morning.','Skip oil-based cleansers and eye makeup removers around your eyes. Oil relaxes the lift.','No lash curler, and skip waterproof mascara. It is hard to remove without tugging.','A lash conditioning serum after the first 24 hours keeps them strong.']],
    ['Good to know',['Your lift lasts about 6–8 weeks, and the tint fades gradually over 4–6 weeks.','If your eyes feel irritated or look red after today, call or text us.']]]},
  {id:'ext',kind:'hair',name:'Hair extensions',title:'Your hair extension aftercare',
   intro:'Your extensions are an investment. A few simple habits keep them looking beautiful and your own hair healthy.',
   sections:[
    ['First 48 hours',['No shampooing, no getting your hair wet and no exercise that makes you sweat for 48 hours, no exceptions. The bonds need this time to set.']],
    ['Washing',['Use conditioner only from mid-shaft down, or from a low ponytail down. Keep it off your scalp and the panels.']],
    ['Brushing',['Brush often.','When your hair is wet, hold the panels and work from the ends up.','We carry a Premium Boar Detangling Brush and a Wet/Dry Detangling Brush made for extensions.']],
    ['Sleeping',['Sleep on a silk pillowcase with your hair in a loose ponytail or braid.']],
    ['Pool & ocean',['Put leave-in conditioner on your mid-lengths and ends and wear a ponytail. No braids while swimming.']],
    ['Good to know',['Give yourself extra styling time at first while you get used to them.','Pre-book your follow-up and maintenance no later than 6–8 weeks after your application.']]]}
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
  const doc=new lib.jsPDF({unit:'pt',format:[396,612]});
  let SF='times';
  if(script){try{doc.addFileToVFS('CormorantLightItalic.ttf',script);doc.addFont('CormorantLightItalic.ttf','CormorantLI','italic');SF='CormorantLI'}catch(e){SF='times'}}
  const big=SF==='times'?1:1.12;
  const W=396,H=612,M=34,CW=W-M*2,ink=[18,18,18],soft=[95,91,85],choc=[18,18,18],line=[226,222,213];
  let y=0;
  const bg=()=>{doc.setFillColor(248,246,240);doc.rect(0,0,W,H,'F');doc.setFillColor(255,255,255);doc.rect(12,12,W-24,H-24,'F');
    /* the app's double frame: a thin black line and a finer charcoal line just inside (Alexandra, Oct 15 2026) */
    doc.setDrawColor(18,18,18);doc.setLineWidth(.7);doc.rect(12,12,W-24,H-24,'S');doc.setDrawColor(43,42,40);doc.setLineWidth(.3);doc.rect(17,17,W-34,H-34,'S');doc.setLineWidth(.2)};
  const foot=()=>{doc.setDrawColor(...line);doc.line(M,H-40,W-M,H-40);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...soft);
    doc.text('Taffeta Salon & Spa  ·  219 Bellevue Ave, Hammonton NJ  ·  '+AC_PHONE+'  ·  '+AC_SITE,W/2,H-26,{align:'center'})};
  const need=n=>{if(y+n>H-52){foot();doc.addPage([396,612]);bg();y=M+6}};
  const para=(t,size,font,style,color,gap,indent)=>{doc.setFont(font,style);doc.setFontSize(size);doc.setTextColor(...color);
    const ls=doc.splitTextToSize(t,CW-(indent||0)),lh=size*1.32;ls.forEach(l=>{need(lh);doc.text(l,M+(indent||0),y+size);y+=lh});y+=gap||0};
  const label=t=>{need(50);y+=4;doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...ink);doc.setCharSpace(1.6);
    const T=t.toUpperCase(), tw=doc.getTextWidth(T)+1.6*T.length; doc.text(T,W/2-tw/2,y+8);doc.setCharSpace(0);
    /* centered label between two short dashes, like MENU in the app */
    doc.setDrawColor(18,18,18);doc.setLineWidth(.4);doc.line(W/2-tw/2-30,y+5.5,W/2-tw/2-10,y+5.5);doc.line(W/2+tw/2+10,y+5.5,W/2+tw/2+30,y+5.5);doc.setLineWidth(.2);y+=20};
  bg();
  if(logo) doc.addImage(logo,'PNG',W/2-34,24,68,68);
  y=104;
  doc.setFont(SF,'italic');doc.setFontSize(21*big);doc.setTextColor(...ink);
  doc.text(doc.splitTextToSize(sheet.title,CW),W/2,y+18,{align:'center'});y+=30;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...soft);
  y+=6;
  para(sheet.intro,10.5*big,SF,'italic',ink,6);
  sheet.sections.forEach(([t,items])=>{label(t);items.forEach(n=>{need(16);doc.setFont('helvetica','normal');doc.setTextColor(...choc);doc.setFontSize(9.5);doc.text('•',M+2,y+9.5);para(n,9.5,'helvetica','normal',ink,4,14)})});
  y+=10;need(40);
  para('Questions? Call or text us at '+AC_PHONE+'.',9.5,'helvetica','bold',choc,8);
  doc.setFont(SF,'italic');doc.setFontSize(13*big);doc.setTextColor(...choc);need(20);doc.text(sheet.kind==='hair'?'Pretty Hair by Taffeta xo':sheet.id==='brow'?'Pretty Brows by Taffeta xo':sheet.id==='lash'?'Pretty Lashes by Taffeta xo':'Pretty Skin by Taffeta xo',W/2,y+12,{align:'center'});y+=20;
  need(14);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...soft);doc.text(new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),W/2,y+8,{align:'center'});
  foot();
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

function acMount(el){
  if(!el) return;
  const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  el.innerHTML=`<p style="margin:0;font-size:13.5px;color:var(--soft)">Type her first name, then text her the PDF. It opens your share sheet: pick Messages and her name.</p>
  <input id="acGuest" type="text" placeholder="Guest’s first name" autocomplete="off" autocapitalize="words" style="font:inherit;font-size:16px;height:44px;border:1px solid var(--line);border-radius:6px;padding:0 10px;background:#fbfaf7">`+
  AC_SHEETS.map((s,i)=>`<div class="item"><b>${e(s.name)}</b><p>${e(s.intro)}</p><div class="b"><button data-ac="${i}" data-w="share">Text the PDF</button><button data-ac="${i}" data-w="view">Preview</button></div><p class="acst" style="min-height:1.2em"></p></div>`).join('');
  el.addEventListener('click',ev=>{
    const b=ev.target.closest('button[data-ac]'); if(!b) return;
    const s=AC_SHEETS[+b.dataset.ac], g=(el.querySelector('#acGuest').value||'').trim().split(/\s+/)[0]||'';
    acSend(s,g,b.closest('.item').querySelector('.acst'),b.dataset.w);
  });
}
