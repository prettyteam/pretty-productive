/* Holiday party (Alexandra, Nov 20 2026): "Sips, Sleigh & Play" on Sunday Dec 20.
   On Pretty Life only. A Party List button that opens her RSVP sheet (private to her Google account),
   plus Copy and Share for the two invite links: guests (asks about a +1) and staff (no +1 question).
   The guest list itself is never in this file. Use: PartyLinks.mount(element). */
(function(){
const PAGE='https://prettyteam.taffetadesign.com/soiree-aae8a7/';
const SHEET='https://docs.google.com/spreadsheets/d/1g7_ObRowzvvIe7NIpgc7vvoBn3wVLad6iUFwBgyQUKk/edit';
const LINKS=[
  ['Guest invite','For people bringing a +1',PAGE+'?invite=guest'],
  ['Staff invite','Just them, no +1 question',PAGE]];
const CSS=`
@font-face{font-family:PLDisplay;src:url(https://prettyteam.taffetadesign.com/g/fraunces-latin-300-normal.woff2) format("woff2");font-weight:300}
@font-face{font-family:PLBody;src:url(https://prettyteam.taffetadesign.com/g/libertinus-sans-latin-400-normal.woff2) format("woff2")}
.pl{box-sizing:border-box;max-width:380px;width:100%;margin:0 auto;background:#f2f1ec;color:#000;border:1px solid #000;outline:1px solid #000;outline-offset:-6px;
  padding:18px 18px 16px;display:flex;flex-direction:column;gap:12px;font-family:PLBody,"Libertinus Sans",system-ui,sans-serif;text-align:left}
.pl *{box-sizing:border-box}
.pl .pl-k{font-size:10.5px;letter-spacing:.28em;display:flex;align-items:center;justify-content:center;gap:12px;margin:0}
.pl .pl-k::before,.pl .pl-k::after{content:"";width:28px;height:1px;background:#b3202c}
.pl .pl-h{font-family:PLDisplay,Fraunces,Georgia,serif;font-weight:300;font-style:italic;font-size:22px;text-align:center;color:#b3202c;margin:0}
.pl .pl-d{font-size:12px;color:#555;text-align:center;margin:-6px 0 0}
.pl .pl-big{all:unset;cursor:pointer;display:block;text-align:center;background:#000;color:#f2f1ec;font-size:11px;letter-spacing:.24em;padding:13px 12px;border:1px solid #000}
.pl .pl-r{display:flex;align-items:center;gap:8px;border-top:1px solid #cfcdc4;padding-top:12px}
.pl .pl-t{flex:1;min-width:0;font-family:PLDisplay,Fraunces,Georgia,serif;font-weight:300;font-size:17px;line-height:1.2}
.pl .pl-t small{display:block;font-family:PLBody,"Libertinus Sans",system-ui,sans-serif;font-size:11px;line-height:1.35;color:#666;margin-top:2px}
.pl button{all:unset;cursor:pointer;flex:0 0 auto;font-family:PLBody,"Libertinus Sans",system-ui,sans-serif;font-size:10px;letter-spacing:.22em;padding:8px 11px;border:1px solid #000;line-height:1.2}
.pl .pl-c{background:#000;color:#f2f1ec}.pl .pl-s{background:#f2f1ec;color:#000}
.pl button:focus-visible,.pl .pl-big:focus-visible{outline:2px solid #b3202c;outline-offset:2px}
.pl .pl-n{font-size:12px;color:#666;text-align:center;min-height:1.3em;margin:0}`;
function css(){if(document.getElementById('pl-css'))return;const s=document.createElement('style');s.id='pl-css';s.textContent=CSS;document.head.appendChild(s)}
async function copy(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();
    const ok=document.execCommand('copy');a.remove();return ok}catch(e){return false}}
function el(){
  css();
  const box=document.createElement('div');box.className='pl';
  const k=document.createElement('p');k.className='pl-k';k.textContent='HOLIDAY PARTY';box.appendChild(k);
  const h=document.createElement('p');h.className='pl-h';h.textContent='Sips, Sleigh & Play';box.appendChild(h);
  const d=document.createElement('p');d.className='pl-d';d.textContent='Sunday, Dec 20 \u00b7 RSVP by Dec 10';box.appendChild(d);
  const big=document.createElement('a');big.className='pl-big';big.href=SHEET;big.target='_blank';big.rel='noopener';big.textContent='OPEN PARTY LIST';box.appendChild(big);
  const note=document.createElement('p');note.className='pl-n';note.setAttribute('role','status');
  const say=t=>{note.textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>note.textContent='',3000)};
  LINKS.forEach(([title,sub,url])=>{
    const r=document.createElement('div');r.className='pl-r';
    const t=document.createElement('div');t.className='pl-t';t.textContent=title;const s=document.createElement('small');s.textContent=sub;t.appendChild(s);
    const c=document.createElement('button');c.type='button';c.className='pl-c';c.textContent='COPY';
    c.onclick=async()=>say(await copy(url)?'Copied. Paste it in your text.':'Couldn\u2019t copy. The link is '+url);
    const sh=document.createElement('button');sh.type='button';sh.className='pl-s';sh.textContent='SHARE';
    sh.onclick=async()=>{
      if(navigator.share){try{await navigator.share({url});return}catch(e){if(e&&e.name==='AbortError')return}}
      say(await copy(url)?'Share isn\u2019t on this device, so it\u2019s copied instead.':'The link is '+url)};
    r.append(t,c,sh);box.appendChild(r)});
  box.appendChild(note);
  return box}
function mount(target){if(!target)return null;target.innerHTML='';const b=el();target.appendChild(b);return b}
window.PartyLinks={el,mount,links:LINKS};
})();
